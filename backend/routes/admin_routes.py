from fastapi import APIRouter, Depends, HTTPException
from models import AdminStats, AdminUser, AdminPayment
from auth import get_admin_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from typing import List
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(current_user: dict = Depends(get_admin_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)
    thirty_days_ago = now - timedelta(days=30)
    
    # Use aggregation for user stats - more efficient
    user_stats = await db.users.aggregate([
        {
            "$facet": {
                "totalUsers": [
                    {"$match": {"role": "user"}},
                    {"$count": "count"}
                ],
                "premiumUsers": [
                    {"$match": {"role": "user", "isPremium": True}},
                    {"$count": "count"}
                ],
                "totalAdvertisers": [
                    {"$match": {"role": "advertiser"}},
                    {"$count": "count"}
                ],
                "activeUsers": [
                    {"$match": {"role": "user", "lastActive": {"$gt": yesterday}}},
                    {"$count": "count"}
                ],
                "recentSignups": [
                    {"$match": {"role": "user", "createdAt": {"$gt": thirty_days_ago}}},
                    {"$count": "count"}
                ]
            }
        }
    ]).to_list(1)
    
    stats = user_stats[0] if user_stats else {}
    total_users = stats.get("totalUsers", [{}])[0].get("count", 0)
    premium_users = stats.get("premiumUsers", [{}])[0].get("count", 0)
    total_advertisers = stats.get("totalAdvertisers", [{}])[0].get("count", 0)
    active_users = stats.get("activeUsers", [{}])[0].get("count", 0)
    recent_signups = stats.get("recentSignups", [{}])[0].get("count", 0)
    
    # Payment stats with aggregation
    payment_stats = await db.payments.aggregate([
        {"$match": {"status": "success"}},
        {
            "$facet": {
                "total": [
                    {"$group": {"_id": None, "revenue": {"$sum": "$amount"}}}
                ],
                "monthly": [
                    {"$match": {"date": {"$gt": thirty_days_ago}}},
                    {"$group": {"_id": None, "revenue": {"$sum": "$amount"}}}
                ]
            }
        }
    ]).to_list(1)
    
    payment_data = payment_stats[0] if payment_stats else {}
    total_revenue = payment_data.get("total", [{}])[0].get("revenue", 0)
    monthly_revenue = payment_data.get("monthly", [{}])[0].get("revenue", 0)
    
    # Advertisement stats with aggregation
    ad_stats = await db.advertisements.aggregate([
        {
            "$facet": {
                "activeAds": [
                    {"$match": {"status": "active"}},
                    {"$count": "count"}
                ],
                "pendingAds": [
                    {"$match": {"status": "pending"}},
                    {"$count": "count"}
                ],
                "adRevenue": [
                    {"$group": {"_id": None, "revenue": {"$sum": "$spent"}}}
                ]
            }
        }
    ]).to_list(1)
    
    ad_data = ad_stats[0] if ad_stats else {}
    active_ads = ad_data.get("activeAds", [{}])[0].get("count", 0)
    pending_ads = ad_data.get("pendingAds", [{}])[0].get("count", 0)
    ad_revenue = ad_data.get("adRevenue", [{}])[0].get("revenue", 0)
    
    return AdminStats(
        totalUsers=total_users,
        premiumUsers=premium_users,
        activeUsers=active_users,
        totalRevenue=total_revenue,
        monthlyRevenue=monthly_revenue,
        recentSignups=recent_signups,
        totalAdvertisers=total_advertisers,
        activeAds=active_ads,
        pendingAds=pending_ads,
        adRevenue=ad_revenue
    )

@router.get("/users", response_model=List[AdminUser])
async def get_admin_users(current_user: dict = Depends(get_admin_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    # Use projection to fetch only required fields
    users = await db.users.find(
        {"role": "user"},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "isPremium": 1, "subscriptionDate": 1, "lastActive": 1}
    ).to_list(1000)
    
    return [AdminUser(
        id=u["id"],
        name=u["name"],
        email=u["email"],
        isPremium=u.get("isPremium", False),
        subscriptionDate=u.get("subscriptionDate"),
        lastActive=u.get("lastActive", u.get("createdAt", datetime.utcnow()))
    ) for u in users]

@router.get("/payments", response_model=List[AdminPayment])
async def get_admin_payments(current_user: dict = Depends(get_admin_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    payments = await db.payments.find({"status": "success"}).sort("date", -1).to_list(1000)
    
    return [AdminPayment(
        id=p["id"],
        userId=p["userId"],
        userName=p["userName"],
        amount=p["amount"],
        date=p["date"],
        status=p["status"],
        razorpayId=p.get("razorpayPaymentId", p.get("razorpayOrderId", "N/A"))
    ) for p in payments]
