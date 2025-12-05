import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from auth import hash_password
from datetime import datetime, timedelta
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_data():
    print("🌱 Seeding database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.chats.delete_many({})
    await db.messages.delete_many({})
    await db.payments.delete_many({})
    print("✅ Cleared existing data")
    
    # Create users
    users_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "Admin User",
            "email": "admin@ishukart.com",
            "mobile": "+919876543210",
            "password": hash_password("admin123"),
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
            "isPremium": True,
            "role": "admin",
            "status": "online",
            "subscriptionDate": datetime.utcnow() - timedelta(days=30),
            "validUntil": datetime.utcnow() + timedelta(days=335),
            "createdAt": datetime.utcnow() - timedelta(days=60),
            "lastActive": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Rahul Kumar",
            "email": "rahul@example.com",
            "mobile": "+919876543211",
            "password": hash_password("password123"),
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
            "isPremium": True,
            "role": "user",
            "status": "online",
            "subscriptionDate": datetime.utcnow() - timedelta(days=15),
            "validUntil": datetime.utcnow() + timedelta(days=15),
            "createdAt": datetime.utcnow() - timedelta(days=45),
            "lastActive": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Priya Sharma",
            "email": "priya@example.com",
            "mobile": "+919876543212",
            "password": hash_password("password123"),
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
            "isPremium": False,
            "role": "user",
            "status": "offline",
            "createdAt": datetime.utcnow() - timedelta(days=30),
            "lastActive": datetime.utcnow() - timedelta(minutes=10)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Amit Patel",
            "email": "amit@example.com",
            "mobile": "+919876543213",
            "password": hash_password("password123"),
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit",
            "isPremium": True,
            "role": "user",
            "status": "online",
            "subscriptionDate": datetime.utcnow() - timedelta(days=5),
            "validUntil": datetime.utcnow() + timedelta(days=25),
            "createdAt": datetime.utcnow() - timedelta(days=20),
            "lastActive": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sneha Reddy",
            "email": "sneha@example.com",
            "mobile": "+919876543214",
            "password": hash_password("password123"),
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha",
            "isPremium": False,
            "role": "user",
            "status": "offline",
            "createdAt": datetime.utcnow() - timedelta(days=25),
            "lastActive": datetime.utcnow() - timedelta(minutes=30)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Vikram Singh",
            "email": "vikram@example.com",
            "mobile": "+919876543215",
            "password": hash_password("password123"),
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
            "isPremium": True,
            "role": "user",
            "status": "online",
            "subscriptionDate": datetime.utcnow() - timedelta(days=60),
            "validUntil": datetime.utcnow() + timedelta(days=30),
            "createdAt": datetime.utcnow() - timedelta(days=90),
            "lastActive": datetime.utcnow()
        }
    ]
    
    await db.users.insert_many(users_data)
    print(f"✅ Created {len(users_data)} users")
    
    # Create group chats
    admin_id = users_data[0]["id"]
    rahul_id = users_data[1]["id"]
    amit_id = users_data[3]["id"]
    
    groups_data = [
        {
            "id": str(uuid.uuid4()),
            "type": "group",
            "name": "Team ishukart",
            "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=TI",
            "participants": [admin_id, rahul_id, amit_id, users_data[2]["id"], users_data[4]["id"]],
            "createdAt": datetime.utcnow() - timedelta(days=20),
            "lastMessage": "Great work team!",
            "lastMessageTime": datetime.utcnow() - timedelta(minutes=2)
        },
        {
            "id": str(uuid.uuid4()),
            "type": "group",
            "name": "Developers Hub",
            "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=DH",
            "participants": [rahul_id, amit_id, users_data[5]["id"]],
            "createdAt": datetime.utcnow() - timedelta(days=15),
            "lastMessage": "Anyone knows React?",
            "lastMessageTime": datetime.utcnow() - timedelta(hours=1)
        }
    ]
    
    await db.chats.insert_many(groups_data)
    print(f"✅ Created {len(groups_data)} groups")
    
    # Create sample payments
    payments_data = [
        {
            "id": str(uuid.uuid4()),
            "userId": rahul_id,
            "userName": "Rahul Kumar",
            "amount": 100,
            "currency": "INR",
            "razorpayOrderId": "order_mock123456",
            "razorpayPaymentId": "pay_mock123456",
            "status": "success",
            "date": datetime.utcnow() - timedelta(days=15)
        },
        {
            "id": str(uuid.uuid4()),
            "userId": amit_id,
            "userName": "Amit Patel",
            "amount": 100,
            "currency": "INR",
            "razorpayOrderId": "order_mock123457",
            "razorpayPaymentId": "pay_mock123457",
            "status": "success",
            "date": datetime.utcnow() - timedelta(days=5)
        },
        {
            "id": str(uuid.uuid4()),
            "userId": users_data[5]["id"],
            "userName": "Vikram Singh",
            "amount": 100,
            "currency": "INR",
            "razorpayOrderId": "order_mock123458",
            "razorpayPaymentId": "pay_mock123458",
            "status": "success",
            "date": datetime.utcnow() - timedelta(days=60)
        }
    ]
    
    await db.payments.insert_many(payments_data)
    print(f"✅ Created {len(payments_data)} payments")
    
    print("\\n🎉 Database seeded successfully!")
    print("\\n👤 Test Users:")
    print("   Admin: admin@ishukart.com or +919876543210 / admin123")
    print("   User: rahul@example.com or +919876543211 / password123")
    print("   User: priya@example.com or +919876543212 / password123")

if __name__ == "__main__":
    asyncio.run(seed_data())
