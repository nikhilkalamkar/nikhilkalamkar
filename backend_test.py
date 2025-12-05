#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for ishukart
Tests all backend endpoints with proper authentication and authorization
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from frontend .env
BACKEND_URL = "https://telegram-clone-143.preview.emergentagent.com/api"

class IshukartAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.tokens = {}
        self.users = {}
        self.chats = {}
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> tuple:
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=headers, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, headers=headers, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                return False, f"Unsupported method: {method}"
            
            return True, response
        except Exception as e:
            return False, f"Request failed: {str(e)}"
    
    def test_health_check(self):
        """Test API health check"""
        print("🔍 Testing API Health Check...")
        success, response = self.make_request("GET", "/")
        
        if not success:
            self.log_test("API Health Check", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                self.log_test("API Health Check", True, "API is healthy and running")
                return True
            else:
                self.log_test("API Health Check", False, f"Unexpected response: {data}")
                return False
        else:
            self.log_test("API Health Check", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        print("🔍 Testing User Registration...")
        
        # Test with new user
        new_user_data = {
            "name": "Test User Registration",
            "email": f"testuser_{datetime.now().timestamp()}@example.com",
            "password": "testpassword123"
        }
        
        success, response = self.make_request("POST", "/auth/register", new_user_data)
        
        if not success:
            self.log_test("User Registration", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "user" in data and "token" in data:
                self.users["test_user"] = data["user"]
                self.tokens["test_user"] = data["token"]
                self.log_test("User Registration", True, f"User registered successfully: {data['user']['name']}")
                return True
            else:
                self.log_test("User Registration", False, f"Missing user or token in response: {data}")
                return False
        else:
            self.log_test("User Registration", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_user_login(self):
        """Test user login with existing users"""
        print("🔍 Testing User Login...")
        
        # Test login with seeded users
        test_users = [
            {"email": "admin@ishukart.com", "password": "admin123", "role": "admin"},
            {"email": "rahul@example.com", "password": "password123", "role": "user"},
            {"email": "priya@example.com", "password": "password123", "role": "user"}
        ]
        
        login_success = True
        
        for user_data in test_users:
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            
            success, response = self.make_request("POST", "/auth/login", login_data)
            
            if not success:
                self.log_test(f"Login - {user_data['email']}", False, response)
                login_success = False
                continue
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "token" in data:
                    user_key = user_data["role"]
                    self.users[user_key] = data["user"]
                    self.tokens[user_key] = data["token"]
                    self.log_test(f"Login - {user_data['email']}", True, f"Login successful for {data['user']['name']}")
                else:
                    self.log_test(f"Login - {user_data['email']}", False, f"Missing user or token: {data}")
                    login_success = False
            else:
                self.log_test(f"Login - {user_data['email']}", False, f"Status code: {response.status_code}, Response: {response.text}")
                login_success = False
        
        return login_success
    
    def test_get_current_user(self):
        """Test getting current user info"""
        print("🔍 Testing Get Current User...")
        
        if "user" not in self.tokens:
            self.log_test("Get Current User", False, "No user token available")
            return False
        
        success, response = self.make_request("GET", "/users/me", token=self.tokens["user"])
        
        if not success:
            self.log_test("Get Current User", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "name" in data and "email" in data:
                self.log_test("Get Current User", True, f"Retrieved user info: {data['name']}")
                return True
            else:
                self.log_test("Get Current User", False, f"Missing required fields: {data}")
                return False
        else:
            self.log_test("Get Current User", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_get_all_users(self):
        """Test getting all users"""
        print("🔍 Testing Get All Users...")
        
        if "user" not in self.tokens:
            self.log_test("Get All Users", False, "No user token available")
            return False
        
        success, response = self.make_request("GET", "/users", token=self.tokens["user"])
        
        if not success:
            self.log_test("Get All Users", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                self.log_test("Get All Users", True, f"Retrieved {len(data)} users")
                return True
            else:
                self.log_test("Get All Users", False, f"Expected list of users, got: {data}")
                return False
        else:
            self.log_test("Get All Users", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_get_user_chats(self):
        """Test getting user's chats"""
        print("🔍 Testing Get User Chats...")
        
        if "user" not in self.tokens:
            self.log_test("Get User Chats", False, "No user token available")
            return False
        
        success, response = self.make_request("GET", "/chats", token=self.tokens["user"])
        
        if not success:
            self.log_test("Get User Chats", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get User Chats", True, f"Retrieved {len(data)} chats")
                return True
            else:
                self.log_test("Get User Chats", False, f"Expected list of chats, got: {data}")
                return False
        else:
            self.log_test("Get User Chats", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_create_chat(self):
        """Test creating a new chat"""
        print("🔍 Testing Create Chat...")
        
        if "user" not in self.tokens or "admin" not in self.users:
            self.log_test("Create Chat", False, "Missing required tokens or users")
            return False
        
        # Create a direct chat with admin
        chat_data = {
            "type": "direct",
            "participantIds": [self.users["admin"]["id"]]
        }
        
        success, response = self.make_request("POST", "/chats", chat_data, token=self.tokens["user"])
        
        if not success:
            self.log_test("Create Chat", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "type" in data:
                self.chats["test_chat"] = data
                self.log_test("Create Chat", True, f"Created chat: {data['id']}")
                return True
            else:
                self.log_test("Create Chat", False, f"Missing required fields: {data}")
                return False
        else:
            self.log_test("Create Chat", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_get_chat_messages(self):
        """Test getting messages for a chat"""
        print("🔍 Testing Get Chat Messages...")
        
        if "test_chat" not in self.chats or "user" not in self.tokens:
            self.log_test("Get Chat Messages", False, "No test chat available or missing token")
            return False
        
        chat_id = self.chats["test_chat"]["id"]
        success, response = self.make_request("GET", f"/chats/{chat_id}/messages", token=self.tokens["user"])
        
        if not success:
            self.log_test("Get Chat Messages", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Chat Messages", True, f"Retrieved {len(data)} messages")
                return True
            else:
                self.log_test("Get Chat Messages", False, f"Expected list of messages, got: {data}")
                return False
        else:
            self.log_test("Get Chat Messages", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_send_message(self):
        """Test sending a message"""
        print("🔍 Testing Send Message...")
        
        if "test_chat" not in self.chats or "user" not in self.tokens:
            self.log_test("Send Message", False, "No test chat available or missing token")
            return False
        
        message_data = {
            "chatId": self.chats["test_chat"]["id"],
            "text": f"Test message sent at {datetime.now().isoformat()}"
        }
        
        success, response = self.make_request("POST", "/messages", message_data, token=self.tokens["user"])
        
        if not success:
            self.log_test("Send Message", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "text" in data and "senderId" in data:
                self.log_test("Send Message", True, f"Message sent: {data['text'][:50]}...")
                return True
            else:
                self.log_test("Send Message", False, f"Missing required fields: {data}")
                return False
        else:
            self.log_test("Send Message", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_create_payment_order(self):
        """Test creating a payment order"""
        print("🔍 Testing Create Payment Order...")
        
        if "user" not in self.tokens:
            self.log_test("Create Payment Order", False, "No user token available")
            return False
        
        order_data = {
            "amount": 100,
            "currency": "INR"
        }
        
        success, response = self.make_request("POST", "/payment/create-order", order_data, token=self.tokens["user"])
        
        if not success:
            self.log_test("Create Payment Order", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "orderId" in data and "amount" in data and "razorpayKeyId" in data:
                self.log_test("Create Payment Order", True, f"Payment order created: {data['orderId']}")
                return True
            else:
                self.log_test("Create Payment Order", False, f"Missing required fields: {data}")
                return False
        else:
            self.log_test("Create Payment Order", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_verify_payment(self):
        """Test payment verification"""
        print("🔍 Testing Verify Payment...")
        
        if "user" not in self.tokens:
            self.log_test("Verify Payment", False, "No user token available")
            return False
        
        # Mock payment verification data
        verify_data = {
            "razorpayOrderId": "order_mock_test123",
            "razorpayPaymentId": "pay_mock_test123",
            "razorpaySignature": "mock_signature_test123"
        }
        
        success, response = self.make_request("POST", "/payment/verify", verify_data, token=self.tokens["user"])
        
        if not success:
            self.log_test("Verify Payment", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "success" in data and "subscription" in data:
                self.log_test("Verify Payment", True, f"Payment verified successfully")
                return True
            else:
                self.log_test("Verify Payment", False, f"Missing required fields: {data}")
                return False
        else:
            self.log_test("Verify Payment", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_admin_stats(self):
        """Test admin dashboard stats"""
        print("🔍 Testing Admin Stats...")
        
        if "admin" not in self.tokens:
            self.log_test("Admin Stats", False, "No admin token available")
            return False
        
        success, response = self.make_request("GET", "/admin/stats", token=self.tokens["admin"])
        
        if not success:
            self.log_test("Admin Stats", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["totalUsers", "premiumUsers", "activeUsers", "totalRevenue", "monthlyRevenue", "recentSignups"]
            if all(field in data for field in required_fields):
                self.log_test("Admin Stats", True, f"Stats retrieved: {data['totalUsers']} total users")
                return True
            else:
                self.log_test("Admin Stats", False, f"Missing required fields: {data}")
                return False
        else:
            self.log_test("Admin Stats", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_admin_users(self):
        """Test admin users list"""
        print("🔍 Testing Admin Users...")
        
        if "admin" not in self.tokens:
            self.log_test("Admin Users", False, "No admin token available")
            return False
        
        success, response = self.make_request("GET", "/admin/users", token=self.tokens["admin"])
        
        if not success:
            self.log_test("Admin Users", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                self.log_test("Admin Users", True, f"Retrieved {len(data)} users for admin")
                return True
            else:
                self.log_test("Admin Users", False, f"Expected list of users, got: {data}")
                return False
        else:
            self.log_test("Admin Users", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_admin_payments(self):
        """Test admin payments list"""
        print("🔍 Testing Admin Payments...")
        
        if "admin" not in self.tokens:
            self.log_test("Admin Payments", False, "No admin token available")
            return False
        
        success, response = self.make_request("GET", "/admin/payments", token=self.tokens["admin"])
        
        if not success:
            self.log_test("Admin Payments", False, response)
            return False
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Admin Payments", True, f"Retrieved {len(data)} payments for admin")
                return True
            else:
                self.log_test("Admin Payments", False, f"Expected list of payments, got: {data}")
                return False
        else:
            self.log_test("Admin Payments", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    
    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        print("🔍 Testing Unauthorized Access...")
        
        # Test accessing protected endpoint without token
        success, response = self.make_request("GET", "/users/me")
        
        if not success:
            self.log_test("Unauthorized Access", False, response)
            return False
        
        if response.status_code == 401 or response.status_code == 403:
            self.log_test("Unauthorized Access", True, "Properly rejected unauthorized request")
            return True
        else:
            self.log_test("Unauthorized Access", False, f"Expected 401/403, got {response.status_code}")
            return False
    
    def test_admin_authorization(self):
        """Test admin-only endpoint with regular user token"""
        print("🔍 Testing Admin Authorization...")
        
        if "user" not in self.tokens:
            self.log_test("Admin Authorization", False, "No user token available")
            return False
        
        # Try to access admin endpoint with regular user token
        success, response = self.make_request("GET", "/admin/stats", token=self.tokens["user"])
        
        if not success:
            self.log_test("Admin Authorization", False, response)
            return False
        
        if response.status_code == 403:
            self.log_test("Admin Authorization", True, "Properly rejected non-admin user")
            return True
        else:
            self.log_test("Admin Authorization", False, f"Expected 403, got {response.status_code}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting ishukart Backend API Tests")
        print("=" * 50)
        
        tests = [
            self.test_health_check,
            self.test_user_registration,
            self.test_user_login,
            self.test_get_current_user,
            self.test_get_all_users,
            self.test_get_user_chats,
            self.test_create_chat,
            self.test_get_chat_messages,
            self.test_send_message,
            self.test_create_payment_order,
            self.test_verify_payment,
            self.test_admin_stats,
            self.test_admin_users,
            self.test_admin_payments,
            self.test_unauthorized_access,
            self.test_admin_authorization
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test.__name__} - Exception: {str(e)}")
                failed += 1
        
        print("=" * 50)
        print(f"🏁 Test Results: {passed} passed, {failed} failed")
        
        if failed > 0:
            print("\n❌ CRITICAL ISSUES FOUND:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test']}: {result['details']}")
        else:
            print("\n✅ All tests passed successfully!")
        
        return failed == 0

def main():
    """Main test runner"""
    tester = IshukartAPITester()
    success = tester.run_all_tests()
    
    if not success:
        sys.exit(1)
    
    print("\n🎉 All ishukart backend APIs are working correctly!")

if __name__ == "__main__":
    main()