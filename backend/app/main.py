from fastapi import FastAPI

from app.routes.products import router as products_router
from app.routes.admin import router as admin_router
from app.routes.orders import router as orders_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Business Store API",
    description="Backend API for our business e-commerce website",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://kapoor-trading-website-kw18.vercel.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router)
app.include_router(admin_router)
app.include_router(orders_router)


@app.get("/")
def home():
    return {
        "message": "Business Store API is running"
    }