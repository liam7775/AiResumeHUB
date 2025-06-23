import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Service data will be fetched from backend
const defaultServices = [
  {
    service_type: "resume",
    name: "Professional Resume & Cover Letter",
    description: "AI-crafted resume and cover letter tailored to your industry and role",
    price: 35,
    delivery_time: "15 minutes",
    features: [
      "ATS-optimized resume format",
      "Industry-specific keywords", 
      "Matching cover letter",
      "3 different resume styles",
      "LinkedIn profile optimization tips"
    ]
  }
];

const App = () => {
  const [services, setServices] = useState(defaultServices);
  const [selectedService, setSelectedService] = useState(null);
  const [currentStep, setCurrentStep] = useState('home'); // home, order, payment, success
  const [orderData, setOrderData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);

  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const createPaymentIntent = async (serviceType) => {
    try {
      const response = await axios.post(`${API}/create-payment-intent`, {
        service_type: serviceType
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  };

  const confirmPaymentAndOrder = async (paymentIntentId, orderRequest) => {
    try {
      const response = await axios.post(`${API}/confirm-payment`, {
        payment_intent_id: paymentIntentId,
        ...orderRequest
      });
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  };

  const Header = () => (
    <header className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">💰 AI Services Pro</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setCurrentStep('home')}
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentStep('dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              My Orders
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const Hero = () => (
    <section className="relative bg-gray-900 text-white pt-24 pb-16">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/19613394/pexels-photo-19613394.jpeg')`
        }}
      ></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Professional Services in 
            <span className="text-blue-400"> Minutes</span>
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            AI-powered resumes, business plans, social media content & logos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg">
              ⚡ Delivered in 15-30 minutes
            </div>
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg">
              💰 Starting from £35
            </div>
            <div className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold text-lg">
              🤖 AI-Powered Quality
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const ServiceCard = ({ service }) => (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-2xl transition-all duration-300 service-card">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">
          {service.service_type === 'resume' && '📄'}
          {service.service_type === 'business_plan' && '📊'}
          {service.service_type === 'social_media' && '📱'}
          {service.service_type === 'logo_design' && '🎨'}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h3>
        <p className="text-gray-600 mb-4">{service.description}</p>
        <div className="text-4xl font-bold text-blue-600 mb-2">£{service.price}</div>
        <div className="text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full inline-block">
          ⚡ {service.delivery_time} delivery
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">What you get:</h4>
        <ul className="space-y-2">
          {service.features.map((feature, index) => (
            <li key={index} className="flex items-start text-gray-700">
              <span className="text-green-500 mr-2 mt-1">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
      
      <button
        onClick={() => {
          setSelectedService(service);
          setCurrentStep('order');
        }}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        Order Now - £{service.price} 💳
      </button>
    </div>
  );

  const ServicesGrid = () => (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Service
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Professional quality, AI-powered, delivered fast
          </p>
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 inline-block">
            <p className="text-yellow-800 font-semibold">
              🔥 LAUNCH SPECIAL: All services include FREE revisions + 24/7 support!
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={index} service={service} />
          ))}
        </div>
      </div>
    </section>
  );

  // Payment Form Component
  const PaymentForm = ({ orderRequest, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    const handleSubmit = async (event) => {
      event.preventDefault();

      if (!stripe || !elements) {
        return;
      }

      setIsProcessing(true);
      setPaymentError(null);

      try {
        // Create payment intent
        const paymentIntentData = await createPaymentIntent(orderRequest.service_type);
        
        // Confirm payment
        const result = await stripe.confirmCardPayment(paymentIntentData.client_secret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: orderRequest.customer_name,
              email: orderRequest.customer_email,
            },
          }
        });

        if (result.error) {
          setPaymentError(result.error.message);
          onError(result.error);
        } else {
          // Payment succeeded, create order
          const order = await confirmPaymentAndOrder(result.paymentIntent.id, orderRequest);
          onSuccess(order);
        }
      } catch (error) {
        setPaymentError(error.message);
        onError(error);
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
          <div className="bg-white p-4 rounded border">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
          {paymentError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
              {paymentError}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-2xl font-bold text-blue-600">£{selectedService?.price}</div>
              <div className="text-sm text-gray-600">Instant delivery guaranteed</div>
            </div>
            <div className="text-right">
              <div className="text-green-600 font-semibold">🔒 Secure Payment</div>
              <div className="text-sm text-gray-500">Powered by Stripe</div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </span>
            ) : (
              `Pay £${selectedService?.price} & Get Instant Delivery 🚀`
            )}
          </button>
        </div>
      </form>
    );
  };

  const OrderForm = () => {
    const [formData, setFormData] = useState({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      requirements: {}
    });
    const [showPayment, setShowPayment] = useState(false);

    const handleFormSubmit = (e) => {
      e.preventDefault();
      setShowPayment(true);
    };

    const handlePaymentSuccess = (order) => {
      setOrderData(order);
      setCurrentStep('success');
    };

    const handlePaymentError = (error) => {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    };

    const renderServiceSpecificFields = () => {
      switch (selectedService?.service_type) {
        case 'resume':
          return (
            <>
              <input
                type="text"
                placeholder="Target Role (e.g., Software Developer)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, target_role: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Industry (e.g., Technology, Healthcare)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, industry: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Experience Level (e.g., Entry-level, Mid-level, Senior)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, experience: e.target.value }
                })}
                required
              />
              <textarea
                placeholder="Key Skills (e.g., Python, JavaScript, Project Management)"
                className="form-textarea"
                rows="3"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, skills: e.target.value }
                })}
                required
              />
              <textarea
                placeholder="Education Background"
                className="form-textarea"
                rows="2"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, education: e.target.value }
                })}
                required
              />
              <textarea
                placeholder="Work History (briefly describe your work experience)"
                className="form-textarea"
                rows="3"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, work_history: e.target.value }
                })}
                required
              />
            </>
          );
        case 'business_plan':
          return (
            <>
              <input
                type="text"
                placeholder="Business Name"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, business_name: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Industry (e.g., Technology, Retail, Healthcare)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, industry: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Business Type (e.g., Service, Product, SaaS)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, business_type: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Target Market (e.g., Small businesses, Consumers)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, target_market: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Initial Investment (e.g., £10,000)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, initial_investment: e.target.value }
                })}
                required
              />
            </>
          );
        case 'social_media':
          return (
            <>
              <input
                type="text"
                placeholder="Business Type (e.g., Restaurant, Fitness Studio)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, business_type: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Target Audience (e.g., Young professionals, Parents)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, target_audience: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Platforms (e.g., Instagram, LinkedIn, Twitter)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, platforms: e.target.value.split(',').map(p => p.trim()) }
                })}
                required
              />
              <input
                type="text"
                placeholder="Tone (e.g., Professional, Casual, Humorous)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, tone: e.target.value }
                })}
                required
              />
            </>
          );
        case 'logo_design':
          return (
            <>
              <input
                type="text"
                placeholder="Business Name"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, business_name: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Industry (e.g., Technology, Fashion, Food)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, industry: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Style Preference (e.g., Modern, Classic, Minimalist)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, style: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Preferred Colors (e.g., Blue and white, Red and black)"
                className="form-input"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, preferred_colors: e.target.value }
                })}
                required
              />
            </>
          );
        default:
          return null;
      }
    };

    const orderRequest = {
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      service_type: selectedService?.service_type,
      requirements: formData.requirements
    };

    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">
                {selectedService?.service_type === 'resume' && '📄'}
                {selectedService?.service_type === 'business_plan' && '📊'}
                {selectedService?.service_type === 'social_media' && '📱'}
                {selectedService?.service_type === 'logo_design' && '🎨'}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Order: {selectedService?.name}
              </h2>
              <div className="text-3xl font-bold text-blue-600 mb-2">£{selectedService?.price}</div>
              <div className="text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-full inline-block">
                ⚡ Delivered in {selectedService?.delivery_time}
              </div>
            </div>

            {!showPayment ? (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="form-section">
                  <h3 className="form-section-title">Contact Information</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="form-input"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="form-input"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number (optional)"
                      className="form-input"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Service Details</h3>
                  <div className="space-y-4">
                    {renderServiceSpecificFields()}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('home')}
                      className="flex-1 btn-secondary"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-primary"
                    >
                      Continue to Payment 💳
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <Elements stripe={stripePromise}>
                <PaymentForm 
                  orderRequest={orderRequest}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowPayment(false)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Back to Order Details
                  </button>
                </div>
              </Elements>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SuccessPage = () => {
    const [order, setOrder] = useState(orderData);
    const [isChecking, setIsChecking] = useState(false);

    const checkOrderStatus = async () => {
      if (!order?.id) return;
      
      setIsChecking(true);
      try {
        const response = await axios.get(`${API}/orders/${order.id}`);
        setOrder(response.data);
      } catch (error) {
        console.error('Error checking order status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    useEffect(() => {
      const interval = setInterval(checkOrderStatus, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }, [order?.id]);

    const renderGeneratedContent = () => {
      if (!order?.generated_content) return null;

      return (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📥</span>
            Your Generated Content:
          </h3>
          
          {Object.entries(order.generated_content).map(([key, value]) => (
            <div key={key} className="content-section">
              <h4 className="content-title">
                {key.replace('_', ' ')}:
              </h4>
              <div className="generated-content">
                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 font-semibold">
              💾 Content is ready for download! Check your email for the formatted files.
            </p>
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">
                Order ID: <span className="font-mono text-blue-600">{order?.id}</span>
              </p>
              
              <div className="inline-flex items-center px-6 py-3 rounded-full text-lg font-bold">
                {order?.status === 'completed' ? (
                  <span className="bg-green-100 text-green-800 px-6 py-3 rounded-full">
                    ✅ Completed - Ready for download!
                  </span>
                ) : order?.status === 'processing' ? (
                  <span className="bg-yellow-100 text-yellow-800 px-6 py-3 rounded-full animate-pulse">
                    🤖 AI is generating your content...
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-800 px-6 py-3 rounded-full">
                    📋 Payment received - Starting processing
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-t border-gray-200 pt-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">Service Ordered</h3>
                <p className="text-gray-600 mb-2">{selectedService?.name}</p>
                <p className="text-3xl font-bold text-blue-600">£{order?.price}</p>
                <p className="text-green-600 font-semibold mt-2">✅ Payment Confirmed</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">Delivery Status</h3>
                <p className="text-gray-600 mb-2">
                  Expected delivery: {selectedService?.delivery_time}
                </p>
                <button
                  onClick={checkOrderStatus}
                  disabled={isChecking}
                  className="mt-2 btn-primary"
                >
                  {isChecking ? 'Checking...' : 'Refresh Status'}
                </button>
              </div>
            </div>

            {renderGeneratedContent()}

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">What happens next?</h3>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-center justify-center">
                    <span className="mr-2">🤖</span>
                    AI is generating your premium content
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="mr-2">📧</span>
                    You'll receive an email when it's ready
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="mr-2">📥</span>
                    Download your files from this page
                  </li>
                </ul>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep('home')}
                  className="btn-secondary"
                >
                  Order Another Service
                </button>
                <button
                  onClick={() => setCurrentStep('dashboard')}
                  className="btn-primary"
                >
                  View All Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerOrders, setCustomerOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleFetchOrders = async (e) => {
      e.preventDefault();
      if (!customerEmail) return;

      setIsLoading(true);
      try {
        const response = await axios.get(`${API}/orders?customer_email=${customerEmail}`);
        setCustomerOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        alert('Error fetching orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">📊 My Orders</h2>
            
            <form onSubmit={handleFetchOrders} className="mb-8">
              <div className="flex gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email to view orders"
                  className="form-input"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? 'Loading...' : 'Get Orders'}
                </button>
              </div>
            </form>

            {customerOrders.length > 0 ? (
              <div className="space-y-6">
                {customerOrders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h3 className="order-id">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <p className="order-type">{order.service_type.replace('_', ' ')}</p>
                        <p className="order-date">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="order-price">£{order.price}</p>
                        <span className={`status-badge ${
                          order.status === 'completed' ? 'status-completed' :
                          order.status === 'processing' ? 'status-processing' :
                          order.status === 'failed' ? 'status-failed' :
                          'status-pending'
                        }`}>
                          {order.status === 'completed' && '✅ '}
                          {order.status === 'processing' && '⚡ '}
                          {order.status === 'failed' && '❌ '}
                          {order.status === 'pending' && '📋 '}
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {order.status === 'completed' && order.generated_content && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Generated Content:</h4>
                        <div className="space-y-3">
                          {Object.entries(order.generated_content).map(([key, value]) => (
                            <div key={key}>
                              <h5 className="font-medium text-gray-800 capitalize">
                                {key.replace('_', ' ')}:
                              </h5>
                              <div className="text-sm text-gray-600 bg-white p-3 rounded border mt-1 max-h-32 overflow-y-auto custom-scrollbar">
                                {typeof value === 'string' ? value.substring(0, 200) + (value.length > 200 ? '...' : '') : JSON.stringify(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <button className="btn-success">
                            📥 Download Full Content
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : customerEmail && !isLoading ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600">No orders found for this email address.</p>
                <button
                  onClick={() => setCurrentStep('home')}
                  className="mt-4 btn-primary"
                >
                  Place Your First Order
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'order':
        return <OrderForm />;
      case 'success':
        return <SuccessPage />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return (
          <>
            <Hero />
            <ServicesGrid />
          </>
        );
    }
  };

  return (
    <div className="App">
      <Header />
      {renderCurrentStep()}
    </div>
  );
};

export default App;