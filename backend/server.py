from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum
import json
import openai
from openai import OpenAI
import stripe
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI setup
openai_client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

# Stripe setup
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

# Create the main app without a prefix
app = FastAPI(title="AI Service Arbitrage Platform", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class ServiceType(str, Enum):
    RESUME = "resume"
    BUSINESS_PLAN = "business_plan"
    SOCIAL_MEDIA = "social_media"
    LOGO_DESIGN = "logo_design"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# Models
class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceConfig(BaseModel):
    service_type: ServiceType
    name: str
    description: str
    price: float
    delivery_time: str
    features: List[str]

class OrderRequest(BaseModel):
    customer_email: str
    customer_name: str
    customer_phone: Optional[str] = None
    service_type: ServiceType
    requirements: Dict[str, Any]
    payment_method_id: Optional[str] = None

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    service_type: ServiceType
    requirements: Dict[str, Any]
    status: OrderStatus = OrderStatus.PENDING
    price: float
    payment_intent_id: Optional[str] = None
    generated_content: Optional[Dict[str, Any]] = None
    delivery_urls: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# Service configurations with pricing
SERVICE_CONFIGS = {
    ServiceType.RESUME: ServiceConfig(
        service_type=ServiceType.RESUME,
        name="Professional Resume & Cover Letter",
        description="AI-crafted resume and cover letter tailored to your industry and role",
        price=35.0,
        delivery_time="15 minutes",
        features=[
            "ATS-optimized resume format",
            "Industry-specific keywords",
            "Matching cover letter",
            "3 different resume styles",
            "LinkedIn profile optimization tips"
        ]
    ),
    ServiceType.BUSINESS_PLAN: ServiceConfig(
        service_type=ServiceType.BUSINESS_PLAN,
        name="Complete Business Plan",
        description="Comprehensive business plan with market analysis and financial projections",
        price=150.0,
        delivery_time="30 minutes",
        features=[
            "Executive summary",
            "Market analysis",
            "Financial projections (3 years)",
            "Marketing strategy",
            "Operational plan",
            "Risk assessment"
        ]
    ),
    ServiceType.SOCIAL_MEDIA: ServiceConfig(
        service_type=ServiceType.SOCIAL_MEDIA,
        name="Social Media Content Package",
        description="30-day social media content calendar with posts and captions",
        price=55.0,
        delivery_time="20 minutes",
        features=[
            "30 post ideas with captions",
            "Hashtag research",
            "Content calendar",
            "Platform-specific optimization",
            "Engagement strategies"
        ]
    ),
    ServiceType.LOGO_DESIGN: ServiceConfig(
        service_type=ServiceType.LOGO_DESIGN,
        name="AI Logo & Brand Package",
        description="Professional logo designs with brand guidelines",
        price=85.0,
        delivery_time="25 minutes",
        features=[
            "5 unique logo concepts",
            "Vector files (SVG, AI)",
            "PNG files (various sizes)",
            "Brand color palette",
            "Typography recommendations"
        ]
    )
}

# AI Content Generation Functions
async def generate_resume_content(requirements: Dict[str, Any]) -> Dict[str, Any]:
    """Generate resume and cover letter using OpenAI"""
    
    name = requirements.get('name', 'John Doe')
    email = requirements.get('email', 'john@example.com')
    phone = requirements.get('phone', '+44 123 456 7890')
    industry = requirements.get('industry', 'Technology')
    role = requirements.get('target_role', 'Software Developer')
    experience = requirements.get('experience', 'Mid-level')
    skills = requirements.get('skills', 'Python, JavaScript, React')
    education = requirements.get('education', 'Computer Science Degree')
    work_history = requirements.get('work_history', 'Software Developer at Tech Corp')
    
    # Generate resume
    resume_prompt = f"""
    Create a professional, ATS-optimized resume for {name} targeting a {role} position in the {industry} industry.
    
    Personal Details:
    - Name: {name}
    - Email: {email}
    - Phone: {phone}
    - Experience Level: {experience}
    - Key Skills: {skills}
    - Education: {education}
    - Work History: {work_history}
    
    Format the resume in a clean, professional structure with:
    1. Professional Summary (3-4 lines)
    2. Key Skills (bullet points)
    3. Professional Experience (with achievements and metrics)
    4. Education
    5. Additional sections as relevant
    
    Make it keyword-rich for ATS systems and compelling for human readers.
    """
    
    try:
        resume_response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert resume writer and career coach with 10+ years of experience helping people land their dream jobs."},
                {"role": "user", "content": resume_prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        
        resume_content = resume_response.choices[0].message.content
        
        # Generate cover letter
        cover_letter_prompt = f"""
        Create a compelling cover letter for {name} applying for a {role} position in the {industry} industry.
        
        Use the same personal details and work history from the resume.
        Make it:
        - Personalized and engaging
        - Highlighting key achievements
        - Showing enthusiasm for the role
        - Professional but conversational tone
        - 3-4 paragraphs maximum
        """
        
        cover_letter_response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert career coach specializing in compelling cover letters that get interviews."},
                {"role": "user", "content": cover_letter_prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        cover_letter_content = cover_letter_response.choices[0].message.content
        
        return {
            "resume": resume_content,
            "cover_letter": cover_letter_content,
            "linkedin_tips": f"Optimize your LinkedIn profile for {role} roles by including these keywords: {skills}. Update your headline to '{role} | {industry} Professional' and ensure your summary matches your resume's professional summary."
        }
        
    except Exception as e:
        logger.error(f"Error generating resume content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating resume: {str(e)}")

async def generate_business_plan(requirements: Dict[str, Any]) -> Dict[str, Any]:
    """Generate comprehensive business plan using OpenAI"""
    
    business_name = requirements.get('business_name', 'My Business')
    industry = requirements.get('industry', 'Technology')
    business_type = requirements.get('business_type', 'Service')
    target_market = requirements.get('target_market', 'Small businesses')
    initial_investment = requirements.get('initial_investment', '£10,000')
    
    business_plan_prompt = f"""
    Create a comprehensive business plan for "{business_name}" in the {industry} industry.
    
    Business Details:
    - Business Type: {business_type}
    - Target Market: {target_market}
    - Initial Investment: {initial_investment}
    
    Include these sections:
    1. Executive Summary
    2. Company Description
    3. Market Analysis
    4. Organization & Management
    5. Marketing & Sales Strategy
    6. Financial Projections (3 years)
    7. Risk Analysis
    8. Implementation Timeline
    
    Make it professional, detailed, and investor-ready with realistic financial projections in GBP.
    """
    
    try:
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a seasoned business consultant and MBA with expertise in creating winning business plans that secure funding."},
                {"role": "user", "content": business_plan_prompt}
            ],
            max_tokens=3000,
            temperature=0.6
        )
        
        return {
            "business_plan": response.choices[0].message.content,
            "executive_summary": f"Executive Summary for {business_name} - targeting {target_market} in the {industry} sector with {initial_investment} initial investment."
        }
        
    except Exception as e:
        logger.error(f"Error generating business plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating business plan: {str(e)}")

async def generate_social_media_content(requirements: Dict[str, Any]) -> Dict[str, Any]:
    """Generate social media content package using OpenAI"""
    
    business_type = requirements.get('business_type', 'General Business')
    target_audience = requirements.get('target_audience', 'Young professionals')
    platforms = requirements.get('platforms', ['Instagram', 'LinkedIn', 'Twitter'])
    tone = requirements.get('tone', 'Professional but friendly')
    
    content_prompt = f"""
    Create a 30-day social media content calendar for a {business_type} targeting {target_audience}.
    
    Platforms: {', '.join(platforms)}
    Tone: {tone}
    
    For each day, provide:
    1. Post idea/topic
    2. Caption (platform-optimized)
    3. Relevant hashtags
    4. Best posting time
    5. Engagement strategy
    
    Include a mix of:
    - Educational content (40%)
    - Behind-the-scenes (20%)
    - User-generated content ideas (20%)
    - Promotional content (20%)
    
    Make it actionable and engaging.
    """
    
    try:
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a social media marketing expert with proven success in viral content creation and audience engagement."},
                {"role": "user", "content": content_prompt}
            ],
            max_tokens=2500,
            temperature=0.8
        )
        
        return {
            "content_calendar": response.choices[0].message.content,
            "bonus_tips": f"For {business_type} targeting {target_audience}, focus on authentic storytelling and consistent engagement. Post during peak hours for your audience timezone."
        }
        
    except Exception as e:
        logger.error(f"Error generating social media content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating social media content: {str(e)}")

async def generate_logo_concepts(requirements: Dict[str, Any]) -> Dict[str, Any]:
    """Generate logo concepts and brand guidelines using OpenAI"""
    
    business_name = requirements.get('business_name', 'My Business')
    industry = requirements.get('industry', 'Technology')
    style = requirements.get('style', 'Modern and clean')
    colors = requirements.get('preferred_colors', 'Blue and white')
    
    logo_prompt = f"""
    Create detailed logo concepts and brand guidelines for "{business_name}" in the {industry} industry.
    
    Requirements:
    - Style: {style}
    - Preferred Colors: {colors}
    - Industry: {industry}
    
    Provide:
    1. 5 distinct logo concepts with detailed descriptions
    2. Brand color palette with hex codes
    3. Typography recommendations
    4. Logo usage guidelines
    5. Brand personality and voice guidelines
    
    Make each concept unique and industry-appropriate.
    """
    
    try:
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a senior brand designer with 15+ years of experience creating iconic logos for startups and Fortune 500 companies."},
                {"role": "user", "content": logo_prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        
        return {
            "logo_concepts": response.choices[0].message.content,
            "brand_guidelines": f"Brand guidelines for {business_name} - emphasizing {style} design approach in the {industry} sector.",
            "file_formats": "You will receive: SVG (vector), PNG (transparent background), JPG (web optimized) in various sizes (logo, favicon, social media formats)"
        }
        
    except Exception as e:
        logger.error(f"Error generating logo concepts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating logo concepts: {str(e)}")

# Background task for content generation
async def process_order(order_id: str):
    """Background task to generate content for an order"""
    try:
        # Get order from database
        order_data = await db.orders.find_one({"id": order_id})
        if not order_data:
            logger.error(f"Order {order_id} not found")
            return
        
        order = Order(**order_data)
        
        # Update order status to processing
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"status": OrderStatus.PROCESSING}}
        )
        
        # Generate content based on service type
        generated_content = None
        
        if order.service_type == ServiceType.RESUME:
            generated_content = await generate_resume_content(order.requirements)
        elif order.service_type == ServiceType.BUSINESS_PLAN:
            generated_content = await generate_business_plan(order.requirements)
        elif order.service_type == ServiceType.SOCIAL_MEDIA:
            generated_content = await generate_social_media_content(order.requirements)
        elif order.service_type == ServiceType.LOGO_DESIGN:
            generated_content = await generate_logo_concepts(order.requirements)
        
        if generated_content:
            # Update order with generated content and mark as completed
            await db.orders.update_one(
                {"id": order_id},
                {
                    "$set": {
                        "status": OrderStatus.COMPLETED,
                        "generated_content": generated_content,
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            logger.info(f"Order {order_id} completed successfully")
        else:
            # Mark order as failed
            await db.orders.update_one(
                {"id": order_id},
                {"$set": {"status": OrderStatus.FAILED}}
            )
            logger.error(f"Order {order_id} failed - no content generated")
            
    except Exception as e:
        logger.error(f"Error processing order {order_id}: {str(e)}")
        # Mark order as failed
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"status": OrderStatus.FAILED}}
        )

# API Routes
@api_router.get("/")
async def root():
    return {"message": "AI Service Arbitrage Platform API", "status": "active"}

@api_router.get("/services", response_model=List[ServiceConfig])
async def get_services():
    """Get all available services with pricing"""
    return list(SERVICE_CONFIGS.values())

@api_router.get("/services/{service_type}", response_model=ServiceConfig)
async def get_service(service_type: ServiceType):
    """Get specific service details"""
    if service_type not in SERVICE_CONFIGS:
        raise HTTPException(status_code=404, detail="Service not found")
    return SERVICE_CONFIGS[service_type]

@api_router.post("/orders", response_model=Order)
async def create_order(order_request: OrderRequest, background_tasks: BackgroundTasks):
    """Create a new order and start processing"""
    try:
        # Create or get customer
        customer_data = await db.customers.find_one({"email": order_request.customer_email})
        if not customer_data:
            customer = Customer(
                email=order_request.customer_email,
                name=order_request.customer_name,
                phone=order_request.customer_phone
            )
            await db.customers.insert_one(customer.dict())
            customer_id = customer.id
        else:
            customer_id = customer_data["id"]
        
        # Get service price
        service_config = SERVICE_CONFIGS[order_request.service_type]
        
        # Create order
        order = Order(
            customer_id=customer_id,
            service_type=order_request.service_type,
            requirements=order_request.requirements,
            price=service_config.price
        )
        
        # Save order to database
        await db.orders.insert_one(order.dict())
        
        # Start background processing
        background_tasks.add_task(process_order, order.id)
        
        logger.info(f"Order {order.id} created for {order_request.customer_email}")
        return order
        
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get order status and content"""
    order_data = await db.orders.find_one({"id": order_id})
    if not order_data:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order_data)

@api_router.get("/orders", response_model=List[Order])
async def get_orders(customer_email: Optional[str] = None):
    """Get orders, optionally filtered by customer email"""
    if customer_email:
        customer_data = await db.customers.find_one({"email": customer_email})
        if not customer_data:
            return []
        orders = await db.orders.find({"customer_id": customer_data["id"]}).to_list(100)
    else:
        orders = await db.orders.find().to_list(100)
    
    return [Order(**order) for order in orders]

# Payment endpoints (Stripe integration)
@api_router.post("/create-payment-intent")
async def create_payment_intent(request: dict):
    """Create Stripe payment intent"""
    try:
        service_type = ServiceType(request.get("service_type"))
        service_config = SERVICE_CONFIGS[service_type]
        
        # Create payment intent with Stripe
        intent = stripe.PaymentIntent.create(
            amount=int(service_config.price * 100),  # Convert to pence/cents
            currency='gbp',
            metadata={
                'service_type': service_type,
                'service_name': service_config.name
            }
        )
        
        return {
            "client_secret": intent.client_secret,
            "amount": service_config.price,
            "currency": "gbp",
            "service": service_config.name,
            "payment_intent_id": intent.id
        }
        
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating payment intent: {str(e)}")

@api_router.post("/confirm-payment")
async def confirm_payment(request: dict, background_tasks: BackgroundTasks):
    """Confirm payment and create order"""
    try:
        payment_intent_id = request.get("payment_intent_id")
        order_request = OrderRequest(**request)
        
        # Retrieve the payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != 'succeeded':
            raise HTTPException(status_code=400, detail="Payment not completed")
        
        # Create or get customer
        customer_data = await db.customers.find_one({"email": order_request.customer_email})
        if not customer_data:
            customer = Customer(
                email=order_request.customer_email,
                name=order_request.customer_name,
                phone=order_request.customer_phone
            )
            await db.customers.insert_one(customer.dict())
            customer_id = customer.id
        else:
            customer_id = customer_data["id"]
        
        # Get service price
        service_config = SERVICE_CONFIGS[order_request.service_type]
        
        # Create order with payment confirmation
        order = Order(
            customer_id=customer_id,
            service_type=order_request.service_type,
            requirements=order_request.requirements,
            price=service_config.price,
            payment_intent_id=payment_intent_id,
            status=OrderStatus.PENDING
        )
        
        # Save order to database
        await db.orders.insert_one(order.dict())
        
        # Start background processing
        background_tasks.add_task(process_order, order.id)
        
        logger.info(f"Order {order.id} created and paid for {order_request.customer_email}")
        return order
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except Exception as e:
        logger.error(f"Error confirming payment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing payment: {str(e)}")

@api_router.get("/stripe-config")
async def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    return {
        "publishable_key": os.environ.get('STRIPE_PUBLISHABLE_KEY')
    }

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()