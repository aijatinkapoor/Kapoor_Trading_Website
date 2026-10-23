import os
import uuid

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from dotenv import load_dotenv

from app.database import supabase, supabase_admin
from app.auth import hash_password, verify_password, create_access_token
from app.dependencies import get_current_admin
from app.schemas import ProductCreate, ProductUpdate, OrderStatusUpdate


load_dotenv()

ADMIN_SETUP_KEY = os.getenv("ADMIN_SETUP_KEY")

if not ADMIN_SETUP_KEY:
    raise ValueError("ADMIN_SETUP_KEY is missing")


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


class AdminCreate(BaseModel):
    username: str
    password: str
    setup_key: str


class AdminLogin(BaseModel):
    username: str
    password: str


# =========================
# Admin Authentication
# =========================

@router.post("/create")
def create_admin(admin: AdminCreate):

    if admin.setup_key != ADMIN_SETUP_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid admin setup key"
        )

    existing = (
        supabase
        .table("admins")
        .select("*")
        .eq("username", admin.username)
        .execute()
    )

    if existing.data:
        raise HTTPException(
            status_code=400,
            detail="Admin already exists"
        )

    password_hash = hash_password(
        admin.password
    )

    response = (
        supabase
        .table("admins")
        .insert({
            "username": admin.username,
            "password_hash": password_hash
        })
        .execute()
    )

    return {
        "message": "Admin created successfully",
        "username": admin.username
    }


@router.post("/login")
def admin_login(admin: AdminLogin):

    response = (
        supabase
        .table("admins")
        .select("*")
        .eq("username", admin.username)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    admin_data = response.data[0]

    if not verify_password(
        admin.password,
        admin_data["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = create_access_token(
        admin_data["username"]
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/dashboard")
def admin_dashboard(
    current_admin: str = Depends(get_current_admin)
):

    return {
        "message": "Welcome to the admin dashboard",
        "admin": current_admin
    }


# =========================
# Product Management
# =========================

@router.post("/products")
def create_product(
    product: ProductCreate,
    current_admin: str = Depends(get_current_admin)
):

    response = (
        supabase
        .table("products")
        .insert({
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "image_url": product.image_url,
            "is_available": product.is_available
        })
        .execute()
    )

    return {
        "message": "Product created successfully",
        "product": response.data
    }


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductUpdate,
    current_admin: str = Depends(get_current_admin)
):

    update_data = product.model_dump(
        exclude_unset=True
    )

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    response = (
        supabase
        .table("products")
        .update(update_data)
        .eq("id", product_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "message": "Product updated successfully",
        "product": response.data
    }


@router.delete("/products/{product_id}")
def disable_product(
    product_id: int,
    current_admin: str = Depends(get_current_admin)
):

    response = (
        supabase
        .table("products")
        .update({
            "is_available": False
        })
        .eq("id", product_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "message": "Product disabled successfully",
        "product": response.data[0]
    }


# =========================
# Order Management
# =========================

@router.get("/orders")
def get_orders(
    current_admin: str = Depends(get_current_admin)
):

    orders_response = (
        supabase
        .table("orders")
        .select(
            "id, customer_id, status, created_at, "
            "customers(name, phone, address, city, pincode)"
        )
        .order("created_at", desc=True)
        .execute()
    )

    orders = orders_response.data

    if not orders:
        return []

    order_ids = [
        order["id"]
        for order in orders
    ]

    items_response = (
        supabase
        .table("order_items")
        .select(
            "id, order_id, product_id, quantity, "
            "unit_price, total_price, "
            "products(name, image_url)"
        )
        .in_("order_id", order_ids)
        .execute()
    )

    items = items_response.data

    items_by_order = {}

    for item in items:

        order_id = item["order_id"]

        if order_id not in items_by_order:
            items_by_order[order_id] = []

        items_by_order[order_id].append(item)

    result = []

    for order in orders:

        order_items = items_by_order.get(
            order["id"],
            []
        )

        total_price = sum(
            float(item["total_price"])
            for item in order_items
        )

        result.append({
            "id": order["id"],
            "status": order["status"],
            "created_at": order["created_at"],
            "customer": order.get("customers"),
            "items": order_items,
            "total_price": total_price
        })

    return result


@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    order_status: OrderStatusUpdate,
    current_admin: str = Depends(get_current_admin)
):

    allowed_statuses = [
        "pending",
        "confirmed",
        "cancelled",
        "processing",
        "shipped",
        "delivered"
    ]

    if order_status.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    response = (
        supabase
        .table("orders")
        .update({
            "status": order_status.status
        })
        .eq("id", order_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return {
        "message": "Order status updated successfully",
        "order": response.data[0]
    }


# =========================
# Product Image Upload
# =========================

@router.post("/upload-image")
def upload_product_image(
    file: UploadFile = File(...),
    current_admin: str = Depends(get_current_admin)
):

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed"
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid file name"
        )

    file_extension = (
        file.filename
        .split(".")[-1]
        .lower()
    )

    file_name = (
        f"{uuid.uuid4()}.{file_extension}"
    )

    file_data = file.file.read()

    if len(file_data) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be less than 5MB"
        )

    try:

        supabase_admin.storage \
            .from_("product-images") \
            .upload(
                file_name,
                file_data,
                {
                    "content-type": file.content_type,
                    "upsert": "false"
                }
            )

        image_url = (
            supabase_admin.storage
            .from_("product-images")
            .get_public_url(file_name)
        )

        return {
            "message": "Image uploaded successfully",
            "image_url": image_url
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Image upload failed: {str(e)}"
        )