import requests
import json
import time
import sys
from datetime import datetime

class AIServicePlatformTester:
    def __init__(self, base_url="https://959eabbd-9e57-4c6b-8cc5-fb35955f11e1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_customer = {
            "customer_name": f"Test User {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "customer_email": f"test{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
            "customer_phone": "+44 7700 900000"
        }
        self.test_card = "4242 4242 4242 4242"  # Stripe test card

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        self.tests_run += 1
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            
            print(f"Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test the API root endpoint"""
        return self.run_test(
            "API Root",
            "GET",
            "",
            200
        )

    def test_get_services(self):
        """Test getting all services"""
        return self.run_test(
            "Get All Services",
            "GET",
            "services",
            200
        )

    def test_get_service_by_type(self):
        """Test getting a specific service by type"""
        return self.run_test(
            "Get Service by Type (Resume)",
            "GET",
            "services/resume",
            200
        )

    def test_create_payment_intent(self):
        """Test creating a payment intent"""
        return self.run_test(
            "Create Payment Intent",
            "POST",
            "create-payment-intent",
            200,
            data={"service_type": "resume"}
        )

    def test_get_stripe_config(self):
        """Test getting Stripe config"""
        return self.run_test(
            "Get Stripe Config",
            "GET",
            "stripe-config",
            200
        )

    def test_create_order(self):
        """Test creating an order"""
        order_data = {
            "customer_email": self.test_customer["customer_email"],
            "customer_name": self.test_customer["customer_name"],
            "customer_phone": self.test_customer["customer_phone"],
            "service_type": "resume",
            "requirements": {
                "target_role": "Software Developer",
                "industry": "Technology",
                "experience": "Mid-level",
                "skills": "Python, JavaScript, React",
                "education": "Computer Science Degree",
                "work_history": "5 years as a developer at various tech companies"
            }
        }
        
        return self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )

    def test_get_orders_by_email(self):
        """Test getting orders by customer email"""
        return self.run_test(
            "Get Orders by Email",
            "GET",
            "orders",
            200,
            params={"customer_email": self.test_customer["customer_email"]}
        )

    def test_payment_flow(self):
        """Test the full payment flow"""
        print("\n🔄 Testing full payment flow...")
        
        # 1. Create payment intent
        success, payment_intent_data = self.run_test(
            "Payment Flow - Create Intent",
            "POST",
            "create-payment-intent",
            200,
            data={"service_type": "resume"}
        )
        
        if not success or "client_secret" not in payment_intent_data:
            print("❌ Payment flow failed at creating payment intent")
            return False, {}
        
        print(f"✅ Payment intent created: {payment_intent_data['payment_intent_id']}")
        
        # 2. In a real test, we would use Stripe.js to confirm the payment
        # Here we'll just simulate the confirmation by calling the confirm-payment endpoint
        # Note: This won't actually work in a real environment without the client-side confirmation
        # This is just to test the API endpoint structure
        
        order_data = {
            "payment_intent_id": payment_intent_data["payment_intent_id"],
            "customer_email": self.test_customer["customer_email"],
            "customer_name": self.test_customer["customer_name"],
            "customer_phone": self.test_customer["customer_phone"],
            "service_type": "resume",
            "requirements": {
                "target_role": "Software Developer",
                "industry": "Technology",
                "experience": "Mid-level",
                "skills": "Python, JavaScript, React",
                "education": "Computer Science Degree",
                "work_history": "5 years as a developer at various tech companies"
            }
        }
        
        # Note: This will likely fail since we can't actually confirm the payment without the client-side Stripe.js
        # But we're testing the API structure
        success, order_data = self.run_test(
            "Payment Flow - Confirm Payment (Expected to fail without client-side confirmation)",
            "POST",
            "confirm-payment",
            200,
            data=order_data
        )
        
        return success, order_data

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting API Tests for AI Service Arbitrage Platform")
        print(f"Base URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        print("=" * 80)
        
        # Basic API tests
        self.test_api_root()
        
        # Service tests
        success, services_data = self.test_get_services()
        if success:
            print(f"Found {len(services_data)} services:")
            for service in services_data:
                print(f"  - {service['name']} (£{service['price']})")
        
        self.test_get_service_by_type()
        
        # Payment tests
        self.test_get_stripe_config()
        self.test_create_payment_intent()
        
        # Order tests
        success, order_data = self.test_create_order()
        if success and "id" in order_data:
            order_id = order_data["id"]
            print(f"Created order with ID: {order_id}")
            
            # Test getting a specific order
            self.run_test(
                "Get Order by ID",
                "GET",
                f"orders/{order_id}",
                200
            )
            
            # Wait a bit for order processing to start
            print("Waiting 5 seconds for order processing...")
            time.sleep(5)
            
            # Check order status
            success, updated_order = self.run_test(
                "Check Order Status",
                "GET",
                f"orders/{order_id}",
                200
            )
            
            if success:
                print(f"Order status: {updated_order.get('status', 'unknown')}")
        
        self.test_get_orders_by_email()
        
        # Full payment flow test
        self.test_payment_flow()
        
        # Print test results
        print("\n" + "=" * 80)
        print(f"📊 Tests completed: {self.tests_run}")
        print(f"✅ Tests passed: {self.tests_passed}")
        print(f"❌ Tests failed: {self.tests_run - self.tests_passed}")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = AIServicePlatformTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)