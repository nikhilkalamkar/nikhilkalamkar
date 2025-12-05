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
    role: str = "user"
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
    name: str
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

# Admin Models
class AdminStats(BaseModel):
    totalUsers: int
    premiumUsers: int
    activeUsers: int
    totalRevenue: int
    monthlyRevenue: int
    recentSignups: int

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
