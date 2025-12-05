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

async def create_test_ad():
    print("🎨 Creating test advertisement...")
    
    # Get an advertiser (or create one)
    advertiser = await db.users.find_one({"role": "advertiser"})
    if not advertiser:
        print("❌ No advertiser found. Please create one first.")
        return
    
    # Create test ad
    test_ad = {
        "id": str(uuid.uuid4()),
        "advertiserId": advertiser["id"],
        "advertiserName": advertiser["name"],
        "title": "Premium Coffee Beans - 20% Off Limited Time!",
        "description": "Get the finest coffee beans delivered to your door. Freshly roasted, ethically sourced. Use code ISHUKART20 for 20% off your first order!",
        "imageUrl": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop",
        "targetUrl": "https://example.com/coffee",
        "budget": 500,
        "spent": 0,
        "impressions": 0,
        "clicks": 0,
        "status": "pending",
        "moderationNote": None,
        "createdAt": datetime.utcnow(),
        "startDate": None,
        "endDate": None
    }
    
    await db.advertisements.insert_one(test_ad)
    print("✅ Test advertisement created!")
    print(f"   Title: {test_ad['title']}")
    print(f"   Status: {test_ad['status']}")
    print(f"   Advertiser: {test_ad['advertiserName']}")

if __name__ == "__main__":
    asyncio.run(create_test_ad())
