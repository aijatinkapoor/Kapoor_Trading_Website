from fastapi import APIRouter
from app.database import supabase

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.get("/")
def get_products():
    response = supabase.table("products").select("*").execute()

    return response.data