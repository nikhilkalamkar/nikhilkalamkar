from fastapi import APIRouter, Depends, HTTPException
from models import PaymentOrderCreate, PaymentVerify, Payment
from auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
import uuid
import os
from datetime import datetime, timedelta
import hmac
import hashlib

router = APIRouter(prefix="/payment", tags=["Payment"])

# Razorpay configuration
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_mock_key")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "mock_secret")

@router.post("/create-order")
async def create_payment_order(
    order_data: PaymentOrderCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # In production, create actual Razorpay order
    # For now, return mock order
    order_id = f"order_mock_{uuid.uuid4().hex[:10]}"
    
    # Create payment record
    user = await db.users.find_one({"id": current_user["id"]})
    payment = Payment(
        id=str(uuid.uuid4()),
        userId=current_user["id"],
        userName=user["name"] if user else "Unknown",
        amount=order_data.amount,
        currency=order_data.currency,
        razorpayOrderId=order_id,
        status="pending"
    )
    
    await db.payments.insert_one(payment.dict())
    
    return {
        "orderId": order_id,
        "amount": order_data.amount,
        "currency": order_data.currency,
        "razorpayKeyId": RAZORPAY_KEY_ID
    }

@router.post("/verify")
async def verify_payment(
    payment_data: PaymentVerify,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Verify Razorpay signature
    # In production, verify actual signature
    # signature = hmac.new(
    #     RAZORPAY_KEY_SECRET.encode(),
    #     f"{payment_data.razorpayOrderId}|{payment_data.razorpayPaymentId}".encode(),
    #     hashlib.sha256
    # ).hexdigest()
    
    # if signature != payment_data.razorpaySignature:
    #     raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    # Update payment record
    await db.payments.update_one(
        {"razorpayOrderId": payment_data.razorpayOrderId},
        {"$set": {
            "razorpayPaymentId": payment_data.razorpayPaymentId,
            "status": "success",
            "date": datetime.utcnow()
        }}
    )
    
    # Update user to premium
    subscription_date = datetime.utcnow()
    valid_until = subscription_date + timedelta(days=30)
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "isPremium": True,
            "subscriptionDate": subscription_date,
            "validUntil": valid_until
        }}
    )
    
    return {
        "success": True,
        "subscription": {
            "isPremium": True,
            "subscriptionDate": subscription_date,
            "validUntil": valid_until
        }
    }
