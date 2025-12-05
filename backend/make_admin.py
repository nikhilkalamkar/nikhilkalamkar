import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def make_admin():
    email = "kalamkarnik@gmail.com"
    
    # Find user
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"❌ User {email} not found")
        return
    
    # Update to admin
    await db.users.update_one(
        {"email": email},
        {"$set": {"role": "admin"}}
    )
    
    print(f"✅ {email} is now an admin!")
    print(f"   Name: {user['name']}")
    print(f"   Role: admin")

if __name__ == "__main__":
    asyncio.run(make_admin())
