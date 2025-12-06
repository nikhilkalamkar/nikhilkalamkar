from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import razorpay
import os
from datetime import datetime, timezone
import uuid
from auth import get_session_token

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Razorpay configuration
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_dummy_key')  # Replace with your key
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', 'dummy_secret')  # Replace with your secret

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

class CreateBoostOrder(BaseModel):
    post_id: str
    amount: int  # Amount in paise (100 paise = 1 INR)
    reach: int  # Number of users (10000, 50000, etc.)

class VerifyPayment(BaseModel):
    order_id: str
    payment_id: str
    signature: str
    post_id: str

@router.post("/create-boost-order")
async def create_boost_order(order: CreateBoostOrder, request: Request):
    """Create Razorpay order for post boosting"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Verify post exists and belongs to user
        post = await db.posts.find_one({"post_id": order.post_id, "user_id": user_id}, {"_id": 0})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found or unauthorized")
        
        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            "amount": order.amount,  # Amount in paise
            "currency": "INR",
            "receipt": f"boost_{order.post_id}_{uuid.uuid4().hex[:8]}",
            "payment_capture": 1  # Auto capture
        })
        
        # Save order to database
        order_doc = {
            "order_id": razorpay_order["id"],
            "post_id": order.post_id,
            "user_id": user_id,
            "amount": order.amount,
            "reach": order.reach,
            "status": "created",
            "created_at": datetime.now(timezone.utc)
        }
        await db.boost_orders.insert_one(order_doc)
        
        return {
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key_id": RAZORPAY_KEY_ID
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-payment")
async def verify_payment(payment: VerifyPayment, request: Request):
    """Verify Razorpay payment and activate boost"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Verify payment signature
        params_dict = {
            'razorpay_order_id': payment.order_id,
            'razorpay_payment_id': payment.payment_id,
            'razorpay_signature': payment.signature
        }
        
        try:
            razorpay_client.utility.verify_payment_signature(params_dict)
        except:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Update order status
        order = await db.boost_orders.find_one({"order_id": payment.order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        await db.boost_orders.update_one(
            {"order_id": payment.order_id},
            {"$set": {
                "status": "paid",
                "payment_id": payment.payment_id,
                "paid_at": datetime.now(timezone.utc)
            }}
        )
        
        # Activate boost for post
        boost_duration_days = 7  # Boost lasts for 7 days
        boost_expires_at = datetime.now(timezone.utc).timestamp() + (boost_duration_days * 24 * 60 * 60)
        
        await db.posts.update_one(
            {"post_id": payment.post_id},
            {"$set": {
                "is_boosted": True,
                "boost_reach": order["reach"],
                "boost_expires_at": boost_expires_at,
                "boost_activated_at": datetime.now(timezone.utc)
            }}
        )
        
        return {
            "success": True,
            "message": f"Post boosted successfully! Reach: {order['reach']} users",
            "boost_expires_at": boost_expires_at
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/boost-status/{post_id}")
async def get_boost_status(post_id: str, request: Request):
    """Get boost status for a post"""
    try:
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        is_boosted = post.get("is_boosted", False)
        boost_expires_at = post.get("boost_expires_at", 0)
        
        # Check if boost is still active
        if is_boosted and boost_expires_at < datetime.now(timezone.utc).timestamp():
            await db.posts.update_one(
                {"post_id": post_id},
                {"$set": {"is_boosted": False}}
            )
            is_boosted = False
        
        return {
            "is_boosted": is_boosted,
            "boost_reach": post.get("boost_reach", 0),
            "boost_expires_at": boost_expires_at
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
