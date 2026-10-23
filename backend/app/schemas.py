from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import re


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: Optional[str] = Field(
        default=None,
        max_length=1000
    )
    price: float = Field(gt=0)
    image_url: Optional[str] = None
    is_available: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=150
    )
    description: Optional[str] = Field(
        default=None,
        max_length=1000
    )
    price: Optional[float] = Field(
        default=None,
        gt=0
    )
    image_url: Optional[str] = None
    is_available: Optional[bool] = None


class CustomerCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    phone: str

    address: str = Field(
        min_length=5,
        max_length=500
    )

    city: str = Field(
        min_length=2,
        max_length=100
    )

    pincode: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:

        value = value.strip()

        # Indian 10-digit mobile number
        if not re.fullmatch(
            r"[6-9]\d{9}",
            value
        ):
            raise ValueError(
                "Enter a valid 10-digit Indian mobile number"
            )

        return value

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, value: str) -> str:

        value = value.strip()

        # Indian 6-digit PIN code
        if not re.fullmatch(
            r"\d{6}",
            value
        ):
            raise ValueError(
                "Enter a valid 6-digit pincode"
            )

        return value


class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(
        gt=0,
        le=100
    )


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    customer: CustomerCreate

    @field_validator("items")
    @classmethod
    def validate_items(cls, value):

        if not value:
            raise ValueError(
                "Order must contain at least one product"
            )

        if len(value) > 50:
            raise ValueError(
                "Order cannot contain more than 50 different products"
            )

        product_ids = [
            item.product_id
            for item in value
        ]

        if len(product_ids) != len(set(product_ids)):
            raise ValueError(
                "Duplicate products are not allowed"
            )

        return value


class OrderStatusUpdate(BaseModel):
    status: str