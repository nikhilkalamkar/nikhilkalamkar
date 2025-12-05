# ishukart - Backend Implementation Contracts

## Current Status
✅ Frontend Complete with Mock Data
- Landing page with premium features showcase
- Chat interface (direct messages, groups, channels)
- Admin dashboard with user management and payment tracking
- Premium subscription modal (Razorpay - currently mocked)

## API Contracts

### 1. Authentication & Users

#### POST /api/auth/register
Request:
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```
Response:
```json
{
  "user": { "id": "string", "name": "string", "email": "string", "isPremium": false },
  "token": "string"
}
```

#### POST /api/auth/login
Request:
```json
{
  "email": "string",
  "password": "string"
}
```
Response:
```json
{
  "user": { "id": "string", "name": "string", "email": "string", "isPremium": boolean },
  "token": "string"
}
```

#### GET /api/users/me
Headers: `Authorization: Bearer <token>`
Response:
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "avatar": "string",
  "isPremium": boolean,
  "subscriptionDate": "date | null"
}
```

#### GET /api/users
Get all users (for contacts)
Response:
```json
[
  {
    "id": "string",
    "name": "string",
    "avatar": "string",
    "status": "online | offline",
    "isPremium": boolean
  }
]
```

### 2. Chat & Messages

#### GET /api/chats
Get all chats for logged-in user
Response:
```json
[
  {
    "id": "string",
    "type": "direct | group",
    "userId": "string (for direct)",
    "name": "string",
    "avatar": "string",
    "lastMessage": "string",
    "lastMessageTime": "date",
    "unreadCount": number
  }
]
```

#### GET /api/chats/:chatId/messages
Get messages for a specific chat
Response:
```json
[
  {
    "id": "string",
    "senderId": "string",
    "senderName": "string",
    "text": "string",
    "timestamp": "date",
    "status": "sent | delivered | read"
  }
]
```

#### POST /api/messages
Send a new message
Request:
```json
{
  "chatId": "string",
  "text": "string"
}
```
Response:
```json
{
  "id": "string",
  "senderId": "string",
  "text": "string",
  "timestamp": "date",
  "status": "sent"
}
```

### 3. Groups

#### POST /api/groups
Create a new group
Request:
```json
{
  "name": "string",
  "members": ["userId1", "userId2"]
}
```
Response:
```json
{
  "id": "string",
  "name": "string",
  "avatar": "string",
  "members": number
}
```

#### GET /api/groups/:groupId
Get group details
Response:
```json
{
  "id": "string",
  "name": "string",
  "avatar": "string",
  "members": [
    { "id": "string", "name": "string", "avatar": "string", "isPremium": boolean }
  ]
}
```

### 4. Premium Subscription

#### POST /api/payment/create-order
Create Razorpay order
Request:
```json
{
  "amount": 100,
  "currency": "INR"
}
```
Response:
```json
{
  "orderId": "string",
  "amount": 100,
  "currency": "INR",
  "razorpayKeyId": "string"
}
```

#### POST /api/payment/verify
Verify Razorpay payment
Request:
```json
{
  "razorpayOrderId": "string",
  "razorpayPaymentId": "string",
  "razorpaySignature": "string"
}
```
Response:
```json
{
  "success": true,
  "subscription": {
    "isPremium": true,
    "subscriptionDate": "date",
    "validUntil": "date"
  }
}
```

### 5. Admin Dashboard

#### GET /api/admin/stats
Get dashboard statistics (admin only)
Response:
```json
{
  "totalUsers": number,
  "premiumUsers": number,
  "activeUsers": number,
  "totalRevenue": number,
  "monthlyRevenue": number,
  "recentSignups": number
}
```

#### GET /api/admin/users
Get all users with details (admin only)
Response:
```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "isPremium": boolean,
    "subscriptionDate": "date | null",
    "lastActive": "date"
  }
]
```

#### GET /api/admin/payments
Get payment history (admin only)
Response:
```json
[
  {
    "id": "string",
    "userId": "string",
    "userName": "string",
    "amount": number,
    "date": "date",
    "status": "success | failed",
    "razorpayId": "string"
  }
]
```

## Mock Data to Replace

### Frontend Mock Data (in /app/frontend/src/mock.js):
1. **mockUsers** - Replace with GET /api/users
2. **mockGroups** - Replace with GET /api/groups (or part of /api/chats)
3. **mockChats** - Replace with GET /api/chats
4. **mockMessages** - Replace with GET /api/chats/:chatId/messages
5. **mockAdminStats** - Replace with GET /api/admin/stats
6. **mockAdminUsers** - Replace with GET /api/admin/users
7. **mockPaymentHistory** - Replace with GET /api/admin/payments

### Components to Update:
1. **ChatSidebar.jsx** - Fetch chats from API
2. **ChatWindow.jsx** - Fetch and send messages via API
3. **Landing.jsx** - No API needed (static content)
4. **Admin.jsx** - Fetch admin stats, users, and payments
5. **PremiumModal.jsx** - Integrate real Razorpay payment flow

## Backend Implementation Plan

### Database Models (MongoDB):

1. **User**
   - _id, name, email, password (hashed), avatar, isPremium, subscriptionDate, validUntil, role, createdAt, lastActive

2. **Chat**
   - _id, type (direct/group), participants[], name (for groups), avatar, createdAt

3. **Message**
   - _id, chatId, senderId, text, timestamp, status, readBy[]

4. **Payment**
   - _id, userId, amount, currency, razorpayOrderId, razorpayPaymentId, status, date

### Middleware:
- Authentication middleware (JWT token verification)
- Admin middleware (check if user is admin)

### Environment Variables Needed:
- JWT_SECRET (for token generation)
- RAZORPAY_KEY_ID (from Razorpay dashboard)
- RAZORPAY_KEY_SECRET (from Razorpay dashboard)
- ADMIN_EMAIL (to identify admin users)

## Integration Steps:

1. **Backend Setup**:
   - Create MongoDB models
   - Implement authentication (JWT)
   - Create all API endpoints
   - Add Razorpay integration

2. **Frontend Integration**:
   - Add authentication context
   - Replace mock imports with API calls
   - Update components to use real data
   - Add loading states and error handling
   - Implement Razorpay checkout in PremiumModal

3. **Testing**:
   - Test authentication flow
   - Test messaging functionality
   - Test premium upgrade flow
   - Test admin dashboard

## Notes:
- Payment integration is currently **MOCKED** - will integrate real Razorpay once API keys are provided
- All data shown in the frontend is currently static mock data
- Backend will need JWT authentication for secure API access
- Admin routes should be protected and only accessible to admin users
