from fastapi import APIRouter, HTTPException

from app.database import supabase
from app.schemas import OrderCreate


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.post("/")
def create_order(order: OrderCreate):

    if not order.items:
        raise HTTPException(
            status_code=400,
            detail="Cart cannot be empty"
        )

    try:

        items = [
            {
                "product_id": item.product_id,
                "quantity": item.quantity
            }
            for item in order.items
        ]

        response = supabase.rpc(
            "create_order_atomic",
            {
                "p_customer_name": order.customer.name,
                "p_customer_phone": order.customer.phone,
                "p_customer_address": order.customer.address,
                "p_customer_city": order.customer.city,
                "p_customer_pincode": order.customer.pincode,
                "p_items": items
            }
        ).execute()

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Could not create order"
            )

        created_order = response.data

        return {
            "message": "Order placed successfully",
            "order": created_order
        }

    except HTTPException:
        raise

    except Exception as e:

        error_message = str(e)

        if "unavailable" in error_message.lower():
            raise HTTPException(
                status_code=400,
                detail="One or more products are unavailable"
            )

        if "not found" in error_message.lower():
            raise HTTPException(
                status_code=404,
                detail="One or more products were not found"
            )

        if "invalid quantity" in error_message.lower():
            raise HTTPException(
                status_code=400,
                detail="Invalid product quantity"
            )

        raise HTTPException(
            status_code=500,
            detail="Could not place order"
        )