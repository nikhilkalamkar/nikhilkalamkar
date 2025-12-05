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
    # Get all users
    all_users = await db.users.find().to_list(10000)
    
    # Calculate stats
    total_users = sum(1 for u in all_users if u.get("role") == "user")
    premium_users = sum(1 for u in all_users if u.get("isPremium", False) and u.get("role") == "user")
    total_advertisers = sum(1 for u in all_users if u.get("role") == "advertiser")
    
    # Active users (active in last 24 hours)
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)
    active_users = sum(1 for u in all_users if u.get("lastActive", datetime.min) > yesterday and u.get("role") == "user")
    
    # Recent signups (last 30 days)
    thirty_days_ago = now - timedelta(days=30)
    recent_signups = sum(1 for u in all_users if u.get("createdAt", datetime.min) > thirty_days_ago and u.get("role") == "user")
    
    # Get all payments
    all_payments = await db.payments.find({"status": "success"}).to_list(10000)
    total_revenue = sum(p.get("amount", 0) for p in all_payments)
    
    # Monthly revenue (last 30 days)
    monthly_payments = [p for p in all_payments if p.get("date", datetime.min) > thirty_days_ago]
    monthly_revenue = sum(p.get("amount", 0) for p in monthly_payments)
    
    # Advertisement stats
    all_ads = await db.advertisements.find().to_list(10000)
    active_ads = sum(1 for ad in all_ads if ad.get("status") == "active")
    pending_ads = sum(1 for ad in all_ads if ad.get("status") == "pending")
    ad_revenue = sum(ad.get("spent", 0) for ad in all_ads)
    
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
    users = await db.users.find({"role": "user"}).to_list(10000)
    
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
