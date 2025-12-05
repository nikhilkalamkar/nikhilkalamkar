from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Import routes
from routes import auth_routes, user_routes, chat_routes, message_routes, payment_routes, admin_routes, advertiser_routes, ads_routes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with error handling
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'ishukart')

if not mongo_url:
    raise ValueError("MONGO_URL environment variable is required")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app without a prefix
app = FastAPI(title="ishukart API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check route
@api_router.get("/")
async def root():
    return {"message": "ishukart API is running", "status": "healthy"}

# Include all route modules
api_router.include_router(auth_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(chat_routes.router)
api_router.include_router(message_routes.router)
api_router.include_router(payment_routes.router)
api_router.include_router(admin_routes.router)
api_router.include_router(advertiser_routes.router)
api_router.include_router(ads_routes.router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Root health check for Kubernetes
@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "ishukart-api"}

# Startup event to verify MongoDB connection
@app.on_event("startup")
async def startup_db_client():
    try:
        # Ping MongoDB to verify connection
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("MongoDB connection closed")
