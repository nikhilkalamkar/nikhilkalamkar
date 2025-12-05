from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime
import uuid

# User Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    mobile: Optional[str] = None

class UserLogin(BaseModel):
    identifier: str  # Can be email or mobile number
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    mobile: Optional[str] = None
    password: str
    avatar: Optional[str] = None
    isPremium: bool = False
    subscriptionDate: Optional[datetime] = None
    validUntil: Optional[datetime] = None
    role: str = "user"  # user, admin, advertiser
    status: str = "offline"
    lastActive: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    mobile: Optional[str] = None
    avatar: Optional[str] = None
    isPremium: bool
    subscriptionDate: Optional[datetime] = None
    status: str = "offline"
    lastActive: Optional[datetime] = None
    role: str = "user"

class UserPublic(BaseModel):
    id: str
    name: str
    mobile: Optional[str] = None
    avatar: Optional[str] = None
    status: str
    isPremium: bool

# Chat Models
class ChatCreate(BaseModel):
    type: Literal["direct", "group"]
    participantIds: List[str]
    name: Optional[str] = None

class Chat(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: Literal["direct", "group"]
    participants: List[str]
    name: Optional[str] = None
    avatar: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    lastMessage: Optional[str] = None
    lastMessageTime: Optional[datetime] = None

class ChatResponse(BaseModel):
    id: str
    type: str
    userId: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    lastMessage: Optional[str] = None
    lastMessageTime: Optional[datetime] = None
    unreadCount: int = 0
    members: Optional[int] = None

# Message Models
class MessageCreate(BaseModel):
    chatId: str
    text: str

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chatId: str
    senderId: str
    senderName: Optional[str] = None
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "sent"
    readBy: List[str] = []

class MessageResponse(BaseModel):
    id: str
    senderId: str
    senderName: Optional[str] = None
    text: str
    timestamp: datetime
    status: str

# Payment Models
class PaymentOrderCreate(BaseModel):
    amount: int = 100
    currency: str = "INR"

class PaymentVerify(BaseModel):
    razorpayOrderId: str
    razorpayPaymentId: str
    razorpaySignature: str

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    userName: str
    amount: int
    currency: str = "INR"
    razorpayOrderId: Optional[str] = None
    razorpayPaymentId: Optional[str] = None
    status: str = "pending"
    date: datetime = Field(default_factory=datetime.utcnow)

# Advertisement Models
class AdvertiserCreate(BaseModel):
    businessName: str
    email: EmailStr
    mobile: str
    password: str

class AdvertisementCreate(BaseModel):
    title: str
    description: str
    imageUrl: str
    targetUrl: str
    budget: int  # Minimum 100 rupees

class Advertisement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    advertiserId: str
    advertiserName: str
    title: str
    description: str
    imageUrl: str
    targetUrl: str
    budget: int
    spent: int = 0
    impressions: int = 0
    clicks: int = 0
    status: str = "pending"  # pending, approved, rejected, active, paused, completed
    moderationNote: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None

class AdvertisementResponse(BaseModel):
    id: str
    advertiserId: str
    advertiserName: str
    title: str
    description: str
    imageUrl: str
    targetUrl: str
    budget: int
    spent: int
    impressions: int
    clicks: int
    status: str
    moderationNote: Optional[str] = None
    createdAt: datetime

class AdPaymentCreate(BaseModel):
    advertisementId: str
    amount: int

class AdImpression(BaseModel):
    adId: str

class AdClick(BaseModel):
    adId: str

# Admin Models
class AdminStats(BaseModel):
    totalUsers: int
    premiumUsers: int
    activeUsers: int
    totalRevenue: int
    monthlyRevenue: int
    recentSignups: int
    totalAdvertisers: int
    activeAds: int
    pendingAds: int
    adRevenue: int

class AdminUser(BaseModel):
    id: str
    name: str
    email: str
    isPremium: bool
    subscriptionDate: Optional[datetime] = None
    lastActive: datetime

class AdminPayment(BaseModel):
    id: str
    userId: str
    userName: str
    amount: int
    date: datetime
    status: str
    razorpayId: str

# Group Models
class GroupCreate(BaseModel):
    name: str
    members: List[str]

class GroupResponse(BaseModel):
    id: str
    name: str
    avatar: Optional[str] = None
    members: List[UserPublic]


# Friend Request Models
class FriendRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    senderId: str
    senderName: str
    senderAvatar: Optional[str] = None
    receiverId: str
    receiverName: str
    receiverAvatar: Optional[str] = None
    status: str = "pending"  # pending, accepted, rejected
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    respondedAt: Optional[datetime] = None

class FriendRequestResponse(BaseModel):
    id: str
    senderId: str
    senderName: str
    senderAvatar: Optional[str] = None
    receiverId: str
    receiverName: str
    receiverAvatar: Optional[str] = None
    status: str
    createdAt: datetime
    respondedAt: Optional[datetime] = None

class FriendRequestCreate(BaseModel):
    receiverId: str
