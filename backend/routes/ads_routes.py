from fastapi import APIRouter, Depends, HTTPException
from models import AdvertisementResponse, AdImpression, AdClick
from auth import get_current_user, get_admin_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from typing import List
from datetime import datetime

router = APIRouter(prefix="/ads", tags=["Advertisements"])

@router.get("/active", response_model=List[AdvertisementResponse])
async def get_active_ads(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get active approved ads for display in chat"""
    ads = await db.advertisements.find({
        "status": "active",
        "$expr": {"$lt": ["$spent", "$budget"]}
    }).to_list(1000)
    
    return [AdvertisementResponse(**ad) for ad in ads]

@router.post("/impression")
async def record_impression(
    impression: AdImpression,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Record ad impression and charge ₹20 per impression"""
    ad = await db.advertisements.find_one({"id": impression.adId})
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    
    # Check if budget allows
    if ad["spent"] + 20 > ad["budget"]:
        # Mark as completed
        await db.advertisements.update_one(
            {"id": impression.adId},
            {"$set": {"status": "completed", "endDate": datetime.utcnow()}}
        )
        return {"message": "Ad budget exhausted"}
    
    # Increment impression and spent
    await db.advertisements.update_one(
        {"id": impression.adId},
        {
            "$inc": {"impressions": 1, "spent": 20}
        }
    )
    
    return {"message": "Impression recorded"}

@router.post("/click")
async def record_click(
    click: AdClick,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Record ad click"""
    await db.advertisements.update_one(
        {"id": click.adId},
        {"$inc": {"clicks": 1}}
    )
    
    return {"message": "Click recorded"}

@router.get("/pending", response_model=List[AdvertisementResponse])
async def get_pending_ads(
    current_user: dict = Depends(get_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Admin: Get pending ads for moderation"""
    ads = await db.advertisements.find({"status": "pending"}).to_list(1000)
    return [AdvertisementResponse(**ad) for ad in ads]

@router.put("/{ad_id}/approve")
async def approve_ad(
    ad_id: str,
    current_user: dict = Depends(get_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Admin: Approve advertisement"""
    result = await db.advertisements.update_one(
        {"id": ad_id},
        {
            "$set": {
                "status": "active",
                "startDate": datetime.utcnow(),
                "moderationNote": "Approved"
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    
    return {"message": "Advertisement approved"}

@router.put("/{ad_id}/reject")
async def reject_ad(
    ad_id: str,
    reason: str,
    current_user: dict = Depends(get_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Admin: Reject advertisement"""
    result = await db.advertisements.update_one(
        {"id": ad_id},
        {
            "$set": {
                "status": "rejected",
                "moderationNote": f"Rejected: {reason}"
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    
    return {"message": "Advertisement rejected"}
