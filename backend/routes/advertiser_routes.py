from fastapi import APIRouter, Depends, HTTPException, status
from models import AdvertiserCreate, AdvertisementCreate, Advertisement, AdvertisementResponse, AdPaymentCreate, User, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from typing import List
import uuid
from datetime import datetime

router = APIRouter(prefix="/advertiser", tags=["Advertiser"])

@router.post("/register", response_model=dict)
async def register_advertiser(advertiser_data: AdvertiserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Check if advertiser exists
    existing = await db.users.find_one({"email": advertiser_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create advertiser user
    user = User(
        id=str(uuid.uuid4()),
        name=advertiser_data.businessName,
        email=advertiser_data.email,
        mobile=advertiser_data.mobile,
        password=hash_password(advertiser_data.password),
        avatar=f"https://api.dicebear.com/7.x/initials/svg?seed={advertiser_data.businessName}",
        role="advertiser",
        status="online"
    )
    
    await db.users.insert_one(user.dict())
    
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role
    })
    
    return {
        "user": UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            mobile=user.mobile,
            avatar=user.avatar,
            isPremium=False,
            status=user.status,
            role=user.role
        ),
        "token": token
    }

@router.post("/ads", response_model=AdvertisementResponse)
async def create_advertisement(
    ad_data: AdvertisementCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    if current_user.get("role") != "advertiser":
        raise HTTPException(status_code=403, detail="Advertiser access required")
    
    if ad_data.budget < 100:
        raise HTTPException(
            status_code=400,
            detail="Minimum budget is ₹100"
        )
    
    # Get advertiser info
    user = await db.users.find_one({"id": current_user["id"]})
    
    # Create advertisement
    ad = Advertisement(
        id=str(uuid.uuid4()),
        advertiserId=current_user["id"],
        advertiserName=user["name"],
        title=ad_data.title,
        description=ad_data.description,
        imageUrl=ad_data.imageUrl,
        targetUrl=ad_data.targetUrl,
        budget=ad_data.budget,
        status="pending"
    )
    
    await db.advertisements.insert_one(ad.dict())
    
    return AdvertisementResponse(**ad.dict())

@router.get("/ads", response_model=List[AdvertisementResponse])
async def get_my_advertisements(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    if current_user.get("role") != "advertiser":
        raise HTTPException(status_code=403, detail="Advertiser access required")
    
    ads = await db.advertisements.find({"advertiserId": current_user["id"]}).to_list(1000)
    return [AdvertisementResponse(**ad) for ad in ads]

@router.get("/ads/{ad_id}", response_model=AdvertisementResponse)
async def get_advertisement(
    ad_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    ad = await db.advertisements.find_one({"id": ad_id})
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    
    if current_user.get("role") != "admin" and ad["advertiserId"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return AdvertisementResponse(**ad)

@router.put("/ads/{ad_id}/pause")
async def pause_advertisement(
    ad_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    ad = await db.advertisements.find_one({"id": ad_id, "advertiserId": current_user["id"]})
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    
    await db.advertisements.update_one(
        {"id": ad_id},
        {"$set": {"status": "paused"}}
    )
    
    return {"message": "Advertisement paused successfully"}

@router.put("/ads/{ad_id}/resume")
async def resume_advertisement(
    ad_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    ad = await db.advertisements.find_one({"id": ad_id, "advertiserId": current_user["id"]})
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    
    if ad["status"] == "approved":
        await db.advertisements.update_one(
            {"id": ad_id},
            {"$set": {"status": "active"}}
        )
        return {"message": "Advertisement resumed successfully"}
    else:
        raise HTTPException(status_code=400, detail="Advertisement not approved yet")

@router.get("/stats")
async def get_advertiser_stats(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    if current_user.get("role") != "advertiser":
        raise HTTPException(status_code=403, detail="Advertiser access required")
    
    ads = await db.advertisements.find({"advertiserId": current_user["id"]}).to_list(1000)
    
    total_spent = sum(ad.get("spent", 0) for ad in ads)
    total_impressions = sum(ad.get("impressions", 0) for ad in ads)
    total_clicks = sum(ad.get("clicks", 0) for ad in ads)
    active_ads = sum(1 for ad in ads if ad.get("status") == "active")
    
    return {
        "totalAds": len(ads),
        "activeAds": active_ads,
        "totalSpent": total_spent,
        "totalImpressions": total_impressions,
        "totalClicks": total_clicks,
        "ctr": (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
    }
