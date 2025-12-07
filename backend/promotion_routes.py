from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import secrets
import razorpay
import os

promotion_router = APIRouter(prefix="/api/promotions")

razorpay_client = razorpay.Client(auth=(os.getenv('RAZORPAY_KEY_ID', 'test_key'), os.getenv('RAZORPAY_KEY_SECRET', 'test_secret')))

class CreatePromotion(BaseModel):
    story_id: str
    duration_days: int
    amount: int

class PaymentVerification(BaseModel):
    order_id: str
    payment_id: str
    signature: str
    story_id: str
    duration_days: int

@promotion_router.post("/create-order")
async def create_promotion_order(promotion: CreatePromotion):
    try:
        # Calculate amount based on duration (₹10 per day)
        amount = promotion.duration_days * 10
        
        order = razorpay_client.order.create({
            "amount": amount * 100,  # Convert to paise
            "currency": "INR",
            "payment_capture": 1,
            "notes": {
                "story_id": promotion.story_id,
                "duration_days": str(promotion.duration_days)
            }
        })
        
        return {
            "order_id": order["id"],
            "amount": amount,
            "currency": "INR",
            "key_id": os.getenv('RAZORPAY_KEY_ID', 'rzp_test_key')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@promotion_router.post("/verify-payment")
async def verify_payment(verification: PaymentVerification):
    from server import db
    try:
        # Verify payment signature
        params_dict = {
            'razorpay_order_id': verification.order_id,
            'razorpay_payment_id': verification.payment_id,
            'razorpay_signature': verification.signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Create promotion record
        promotion_id = secrets.token_urlsafe(16)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=verification.duration_days)
        
        promotion_doc = {
            "promotion_id": promotion_id,
            "story_id": verification.story_id,
            "order_id": verification.order_id,
            "payment_id": verification.payment_id,
            "duration_days": verification.duration_days,
            "status": "active",
            "created_at": now.isoformat(),
            "expires_at": expires_at.isoformat()
        }
        
        await db.promotions.insert_one(promotion_doc)
        
        # Update story as promoted
        await db.stories.update_one(
            {"story_id": verification.story_id},
            {"$set": {
                "promoted": True,
                "promotion_expires_at": expires_at.isoformat()
            }}
        )
        
        return {
            "success": True,
            "message": "Payment verified and story promoted",
            "promotion_id": promotion_id,
            "expires_at": expires_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

@promotion_router.get("/my-promotions")
async def get_my_promotions(user_id: str):
    from server import db
    # Get user's stories
    user_stories = await db.stories.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    story_ids = [s["story_id"] for s in user_stories]
    
    # Get promotions for user's stories
    promotions = await db.promotions.find(
        {"story_id": {"$in": story_ids}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return promotions
