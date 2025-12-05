import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from auth import hash_password

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def reset_password():
    email = "kalamkarnik@gmail.com"
    new_password = "nikhil123"
    
    # Find user
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"❌ User {email} not found")
        return
    
    # Update password
    await db.users.update_one(
        {"email": email},
        {"$set": {"password": hash_password(new_password)}}
    )
    
    print(f"✅ Password reset successful!")
    print(f"   Email: {email}")
    print(f"   New Password: {new_password}")
    print(f"   Role: {user.get('role', 'user')}")

if __name__ == "__main__":
    asyncio.run(reset_password())
