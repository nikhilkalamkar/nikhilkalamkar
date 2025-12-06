from fastapi import APIRouter, HTTPException, Request, File, UploadFile, Form
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime, timezone
import uuid
import shutil
from typing import List
from auth import get_session_token

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/api/posts", tags=["posts"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOAD_DIR = Path("/app/uploads/posts")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/create")
async def create_post(
    request: Request,
    images: List[UploadFile] = File(...),
    caption: str = Form(""),
    location: str = Form("")
):
    """Create a new post with images"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Save images
        image_urls = []
        post_id = f"post_{uuid.uuid4().hex[:12]}"
        
        for i, image in enumerate(images):
            # Validate file type
            if not image.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail=f"File {image.filename} is not an image")
            
            # Generate unique filename
            file_ext = image.filename.split(".")[-1]
            filename = f"{post_id}_{i}.{file_ext}"
            file_path = UPLOAD_DIR / filename
            
            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            image_urls.append(f"/api/posts/image/{filename}")
        
        # Create post document
        post = {
            "post_id": post_id,
            "user_id": user_id,
            "images": image_urls,
            "caption": caption,
            "location": location if location else None,
            "likes": 0,
            "comments": 0,
            "is_liked": False,
            "is_saved": False,
            "is_boosted": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.posts.insert_one(post)
        
        # Update user post count
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"postsCount": 1}}
        )
        
        return {
            "success": True,
            "post_id": post_id,
            "message": "Post created successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/image/{filename}")
async def get_post_image(filename: str):
    """Serve post images"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)

@router.post("/{post_id}/like")
async def like_post(
    post_id: str,
    request: Request
):
    """Like or unlike a post"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_id = session["user_id"]
        
        # Find the post
        post = await db.posts.find_one({"post_id": post_id})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Get current likes
        likes = post.get("liked_by", [])
        
        # Toggle like
        if user_id in likes:
            # Unlike
            likes.remove(user_id)
            action = "unliked"
        else:
            # Like
            likes.append(user_id)
            action = "liked"
        
        # Update post
        await db.posts.update_one(
            {"post_id": post_id},
            {
                "$set": {
                    "liked_by": likes,
                    "likes": len(likes)
                }
            }
        )
        
        return {
            "success": True,
            "action": action,
            "likes": len(likes),
            "is_liked": user_id in likes
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all")
async def get_all_posts(request: Request):
    """Get all posts for feed"""
    try:
        # Get current user
        session_token = await get_session_token(request, None)
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        session = await db.user_sessions.find_one({"session_token": session_token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        current_user_id = session["user_id"]
        
        # Get all posts sorted by creation date
        posts_cursor = db.posts.find({}).sort("created_at", -1)
        posts = await posts_cursor.to_list(length=100)
        
        # Format posts
        formatted_posts = []
        for post in posts:
            # Get user info
            user = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0})
            if not user:
                continue
            
            # Check if current user liked this post
            liked_by = post.get("liked_by", [])
            is_liked = current_user_id in liked_by
            
            # Format image URLs
            backend_url = os.getenv('BACKEND_URL', 'http://localhost:8001')
            images = []
            for img_path in post.get("images", []):
                if img_path.startswith('/api/posts/image/'):
                    images.append(f"{backend_url}{img_path}")
                else:
                    images.append(img_path)
            
            formatted_posts.append({
                "id": post["post_id"],
                "user": {
                    "id": user["user_id"],
                    "username": user["username"],
                    "avatar": user.get("avatar", ""),
                    "isVerified": user.get("isVerified", False)
                },
                "images": images,
                "caption": post.get("caption", ""),
                "location": post.get("location", ""),
                "likes": post.get("likes", 0),
                "comments": post.get("comments_count", 0),
                "createdAt": post["created_at"].isoformat() if isinstance(post["created_at"], datetime) else post["created_at"],
                "isLiked": is_liked,
                "isSaved": False
            })
        
        return {"posts": formatted_posts}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
