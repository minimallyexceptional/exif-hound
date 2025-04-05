'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Define plan types
type PlanType = 'basic' | 'pro' | 'enterprise';

type PlanData = {
  name: string;
  price: number;
  features: string[];
};

type PlansData = {
  [key in PlanType]: PlanData;
};

export default function ClientCheckout() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('basic');
  const [loading, setLoading] = useState(false);

  // Plans data
  const plans: PlansData = {
    basic: {
      name: 'Basic',
      price: 29,
      features: [
        'Analyze unlimited images',
        'View basic EXIF data',
        'Remove metadata from your photos',
        'Community support',
        '1 year of updates'
      ],
    },
    pro: {
      name: 'Pro',
      price: 79,
      features: [
        'All Basic features',
        'Access to all metadata fields',
        'Batch processing',
        'Privacy risk detection',
        'Export reports in multiple formats',
        'Priority email support',
        '1 year of updates'
      ],
    },
    enterprise: {
      name: 'Enterprise',
      price: 199,
      features: [
        'All Pro features',
        'API access',
        'Custom integrations',
        'Advanced reporting',
        'Dedicated support',
        'Custom deployment options',
        '1 year of updates with priority fixes'
      ],
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    agreeTerms: false
  });

  // Handle plan selection from URL params on component mount
  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan) {
      const normalizedPlan = plan.toLowerCase() as PlanType;
      if (normalizedPlan in plans) {
        setSelectedPlan(normalizedPlan);
      }
    }
  }, [searchParams, plans]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Only access checked property if it's an input element
    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: e.target.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // This would be replaced with actual payment processing logic
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Redirect to success page after payment
    window.location.href = '/checkout/success';
  };

  // Calculate order summary
  const subtotal = plans[selectedPlan].price;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  // Get the current plan
  const currentPlan = plans[selectedPlan];

  return (
    <div className="flex flex-col min-h-[900px] items-start px-11 py-0 relative bg-[#fcfcfc]">
      <header className="items-center justify-between px-0 py-[18px] z-[2] flex relative self-stretch w-full flex-[0_0_auto] bg-[#fcfcfc]">
        {/* Logo */}
        <div className="inline-flex items-center gap-[46px] relative flex-[0_0_auto]">
          <Link href="/" className="inline-flex h-8 items-center gap-1 relative flex-[0_0_auto]">
            <Image
              className="relative w-[29px] h-[29px]"
              alt="Subtract"
              src="/subtract-1.svg"
              width={29}
              height={29}
            />
            <div className="relative w-fit font-bold text-[#494949] text-[28px] tracking-[-1.12px] leading-7 whitespace-nowrap">
              EXIF HOUND
            </div>
          </Link>
        </div>

        {/* Checkout Steps */}
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">1</div>
            <span className="ml-2 text-[#212121] font-medium">Checkout</span>
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">2</div>
            <span className="ml-2 text-gray-500">Confirmation</span>
          </div>
        </div>

        {/* Help Button */}
        <Link 
          href="/support" 
          className="relative font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap hover:text-black"
        >
          Need Help?
        </Link>
      </header>

      {/* Main content section */}
      <section className="flex items-start px-0 py-11 relative self-stretch w-full flex-auto z-[1]">
        <div className="flex flex-col md:flex-row gap-12 relative flex-1 grow max-w-6xl mx-auto w-full">
          {/* Checkout Form */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[#212121] mb-8">Checkout</h1>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#212121] mb-4">Customer Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">We'll send your license key and receipt to this email</p>
                </div>
              </div>
              
              {/* Billing Address */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#212121] mb-4">Billing Address</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="State/Province"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Zip/Postal Code
                      </label>
                      <input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Zip/Postal Code"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.country}
                      onChange={handleInputChange}
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Payment Information */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#212121] mb-4">Payment Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        id="cardNumber"
                        name="cardNumber"
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="•••• •••• •••• ••••"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <Image src="/visa.svg" alt="Visa" width={32} height={20} />
                        <Image src="/mastercard.svg" alt="Mastercard" width={32} height={20} />
                        <Image src="/amex.svg" alt="American Express" width={32} height={20} />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      id="cardName"
                      name="cardName"
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Name on card"
                      value={formData.cardName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        id="expiryDate"
                        name="expiryDate"
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        id="cvv"
                        name="cvv"
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Terms and Conditions */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeTerms"
                    name="agreeTerms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeTerms" className="text-gray-600">
                    I agree to the <Link href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>
                  </label>
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-medium text-lg hover:bg-blue-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Complete Purchase ($${total})`
                )}
              </button>

              <p className="text-sm text-gray-500 text-center">
                Your payment information is encrypted and secure. We do not store your card details.
              </p>
            </form>
          </div>
          
          {/* Order Summary */}
          <div className="w-full md:w-96">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
              <h2 className="text-xl font-bold text-[#212121] mb-4">Order Summary</h2>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg text-[#212121]">{currentPlan.name} Plan</span>
                  <span className="font-bold text-lg text-[#212121]">${currentPlan.price}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">One-time purchase with 1 year of updates</p>
                
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <svg 
                        className="w-5 h-5 mt-0.5 text-green-500 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-[#212121]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-[#212121]">
                  <span>Subtotal</span>
                  <span>${subtotal}</span>
                </div>
                <div className="flex justify-between text-[#212121]">
                  <span>Tax</span>
                  <span>${tax}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-[#212121] pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>${total}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Link
                  href="/pricing"
                  className="block text-blue-600 text-center font-medium hover:text-blue-800"
                >
                  Change Plan
                </Link>
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <span className="text-sm text-gray-600">Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 