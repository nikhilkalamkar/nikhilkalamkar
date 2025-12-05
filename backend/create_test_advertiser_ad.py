import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def create_test_ads():
    print("🎨 Creating test advertisements...")
    
    # Get all advertisers
    advertisers = await db.users.find({"role": "advertiser"}).to_list(10)
    
    if not advertisers:
        print("❌ No advertisers found. Creating one...")
        # Create test advertiser
        from auth import hash_password
        advertiser = {
            "id": str(uuid.uuid4()),
            "name": "Test Business Co.",
            "email": "testbiz@ishukart.com",
            "mobile": "+919999888877",
            "password": hash_password("business123"),
            "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=TB",
            "role": "advertiser",
            "isPremium": False,
            "status": "online",
            "createdAt": datetime.utcnow(),
            "lastActive": datetime.utcnow()
        }
        await db.users.insert_one(advertiser)
        advertisers = [advertiser]
        print(f"✅ Created advertiser: {advertiser['email']}")
    
    print(f"\n📊 Found {len(advertisers)} advertiser(s)")
    
    # Create multiple test ads
    test_ads = [
        {
            "id": str(uuid.uuid4()),
            "advertiserId": advertisers[0]["id"],
            "advertiserName": advertisers[0]["name"],
            "title": "🍕 Best Pizza in Town - 50% Off Today!",
            "description": "Freshly baked pizzas with premium ingredients. Order now and get 50% off on your first order. Free delivery available!",
            "imageUrl": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
            "targetUrl": "https://example.com/pizza-shop",
            "budget": 500,
            "spent": 0,
            "impressions": 0,
            "clicks": 0,
            "status": "pending",
            "moderationNote": None,
            "createdAt": datetime.utcnow(),
            "startDate": None,
            "endDate": None
        },
        {
            "id": str(uuid.uuid4()),
            "advertiserId": advertisers[0]["id"],
            "advertiserName": advertisers[0]["name"],
            "title": "📱 Latest Smartphones - Up to 30% Discount",
            "description": "Get the latest iPhone, Samsung, and OnePlus phones at unbeatable prices. EMI options available. Shop now!",
            "imageUrl": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
            "targetUrl": "https://example.com/mobile-store",
            "budget": 1000,
            "spent": 0,
            "impressions": 0,
            "clicks": 0,
            "status": "pending",
            "moderationNote": None,
            "createdAt": datetime.utcnow(),
            "startDate": None,
            "endDate": None
        },
        {
            "id": str(uuid.uuid4()),
            "advertiserId": advertisers[0]["id"],
            "advertiserName": advertisers[0]["name"],
            "title": "💼 Professional Web Development Services",
            "description": "Build your dream website with our expert team. Custom designs, SEO optimization, and 24/7 support. Get free consultation!",
            "imageUrl": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
            "targetUrl": "https://example.com/web-dev",
            "budget": 2000,
            "spent": 0,
            "impressions": 0,
            "clicks": 0,
            "status": "pending",
            "moderationNote": None,
            "createdAt": datetime.utcnow(),
            "startDate": None,
            "endDate": None
        }
    ]
    
    # Delete old test ads
    await db.advertisements.delete_many({"status": "pending"})
    
    # Insert new ads
    await db.advertisements.insert_many(test_ads)
    
    print(f"\n✅ Created {len(test_ads)} pending advertisements:")
    for ad in test_ads:
        print(f"   - {ad['title']}")
        print(f"     Budget: ₹{ad['budget']}, Status: {ad['status']}")
    
    print(f"\n📧 Advertiser login:")
    print(f"   Email: {advertisers[0]['email']}")
    print(f"   Password: business123")

if __name__ == "__main__":
    asyncio.run(create_test_ads())
