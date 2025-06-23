import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  const [orders, setOrders] = useState([]);

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

  const fetchOrders = async (email) => {
    try {
      const response = await axios.get(`${API}/orders?customer_email=${email}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const createOrder = async (orderRequest) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API}/orders`, orderRequest);
      setOrderData(response.data);
      setCurrentStep('success');
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const Header = () => (
    <header className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">AI Services Pro</h1>
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
          </div>
        </div>
      </div>
    </section>
  );

  const ServiceCard = ({ service }) => (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-2xl transition-all duration-300">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.name}</h3>
        <p className="text-gray-600 mb-4">{service.description}</p>
        <div className="text-4xl font-bold text-blue-600 mb-2">£{service.price}</div>
        <div className="text-green-600 font-semibold">{service.delivery_time} delivery</div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">What you get:</h4>
        <ul className="space-y-2">
          {service.features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-700">
              <span className="text-green-500 mr-2">✓</span>
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
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 transform hover:scale-105"
      >
        Order Now - £{service.price}
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
          <p className="text-xl text-gray-600">
            Professional quality, AI-powered, delivered fast
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={index} service={service} />
          ))}
        </div>
      </div>
    </section>
  );

  const OrderForm = () => {
    const [formData, setFormData] = useState({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      requirements: {}
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      const orderRequest = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        service_type: selectedService.service_type,
        requirements: formData.requirements
      };

      await createOrder(orderRequest);
    };

    const renderServiceSpecificFields = () => {
      switch (selectedService?.service_type) {
        case 'resume':
          return (
            <>
              <input
                type="text"
                placeholder="Target Role (e.g., Software Developer)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, target_role: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Industry (e.g., Technology, Healthcare)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, industry: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Experience Level (e.g., Entry-level, Mid-level, Senior)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, experience: e.target.value }
                })}
                required
              />
              <textarea
                placeholder="Key Skills (e.g., Python, JavaScript, Project Management)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, skills: e.target.value }
                })}
                required
              />
              <textarea
                placeholder="Education Background"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, education: e.target.value }
                })}
                required
              />
              <textarea
                placeholder="Work History (briefly describe your work experience)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, business_name: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Industry (e.g., Technology, Retail, Healthcare)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, industry: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Business Type (e.g., Service, Product, SaaS)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, business_type: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Target Market (e.g., Small businesses, Consumers)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, target_market: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Initial Investment (e.g., £10,000)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, business_type: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Target Audience (e.g., Young professionals, Parents)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, target_audience: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Platforms (e.g., Instagram, LinkedIn, Twitter)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, platforms: e.target.value.split(',').map(p => p.trim()) }
                })}
                required
              />
              <input
                type="text"
                placeholder="Tone (e.g., Professional, Casual, Humorous)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, business_name: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Industry (e.g., Technology, Fashion, Food)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, industry: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Style Preference (e.g., Modern, Classic, Minimalist)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, style: e.target.value }
                })}
                required
              />
              <input
                type="text"
                placeholder="Preferred Colors (e.g., Blue and white, Red and black)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Order: {selectedService?.name}
              </h2>
              <div className="text-2xl font-bold text-blue-600">£{selectedService?.price}</div>
              <div className="text-green-600 font-semibold">Delivered in {selectedService?.delivery_time}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (optional)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
                <div className="space-y-4">
                  {renderServiceSpecificFields()}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-semibold text-gray-900">Total: £{selectedService?.price}</span>
                  <span className="text-green-600 font-semibold">✓ Instant delivery</span>
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('home')}
                    className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : `Pay £${selectedService?.price} & Get Instant Delivery`}
                  </button>
                </div>
              </div>
            </form>
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Generated Content:</h3>
          
          {Object.entries(order.generated_content).map(([key, value]) => (
            <div key={key} className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2 capitalize">
                {key.replace('_', ' ')}:
              </h4>
              <div className="bg-white p-4 rounded border text-gray-700 whitespace-pre-wrap text-sm">
                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
              <p className="text-gray-600 mb-4">
                Order ID: <span className="font-mono text-blue-600">{order?.id}</span>
              </p>
              
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium">
                {order?.status === 'completed' ? (
                  <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    ✅ Completed - Ready for download!
                  </span>
                ) : order?.status === 'processing' ? (
                  <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                    ⚡ AI is generating your content...
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                    📋 Order received - Starting processing
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Service Ordered</h3>
                  <p className="text-gray-600">{selectedService?.name}</p>
                  <p className="text-2xl font-bold text-blue-600">£{order?.price}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Delivery Status</h3>
                  <p className="text-gray-600">
                    Expected delivery: {selectedService?.delivery_time}
                  </p>
                  <button
                    onClick={checkOrderStatus}
                    disabled={isChecking}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isChecking ? 'Checking...' : 'Check Status'}
                  </button>
                </div>
              </div>
            </div>

            {renderGeneratedContent()}

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-4">
                We'll email you when your content is ready!
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setCurrentStep('home')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Order Another Service
                </button>
                <button
                  onClick={() => setCurrentStep('dashboard')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">My Orders</h2>
            
            <form onSubmit={handleFetchOrders} className="mb-8">
              <div className="flex gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email to view orders"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Get Orders'}
                </button>
              </div>
            </form>

            {customerOrders.length > 0 ? (
              <div className="space-y-6">
                {customerOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <p className="text-gray-600">{order.service_type.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">£{order.price}</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
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
                              <div className="text-sm text-gray-600 bg-white p-3 rounded border mt-1 max-h-32 overflow-y-auto">
                                {typeof value === 'string' ? value.substring(0, 200) + '...' : JSON.stringify(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : customerEmail && !isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No orders found for this email address.</p>
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