"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/context/CartContext';
import { useUser } from '@/components/context/UserContext';
import AuthModal from '@/components/authentication/AuthModal';
import Image from 'next/image';
import { FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    zone: '',
    area: '',
    address: '',
    note: '',
    paymentMethod: 'cash-on-delivery',
    coupon: '',
  });

  // Custom input states
  const [customCity, setCustomCity] = useState('');
  const [customZone, setCustomZone] = useState('');
  const [customArea, setCustomArea] = useState('');

  // Location data fetched from API
  const [locationData, setLocationData] = useState({});
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, { product, quantity }) => sum + (product.price || 0) * quantity,
    0
  );
  
  const shippingCost = subtotal >= 1500 ? 0 : 69;
  const discount = 0;
  const total = subtotal + shippingCost - discount;

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/');
    }
  }, [cartItems.length, router]);

  // fetch location data once
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const resp = await fetch('/api/locations');
        const json = await resp.json();
        setLocationData(json.locationData || {});
        const cityList = json.locationData ? Object.keys(json.locationData) : [];
        setCities(cityList);
      } catch (err) {
        console.error('Failed to load location data', err);
      }
    };
    fetchLocations();
  }, []);

  // Update zones when city changes
  useEffect(() => {
    if (formData.city && locationData[formData.city]) {
      const availableZones = Object.keys(locationData[formData.city].zones || {});
      setZones(availableZones);
      setFormData(prev => ({ ...prev, zone: '', area: '' }));
      setAreas([]);
    }
  }, [formData.city, locationData]);

  // Update areas when zone changes
  useEffect(() => {
    if (formData.city && formData.zone && locationData[formData.city]) {
      const availableAreas = locationData[formData.city].zones[formData.zone] || [];
      setAreas(availableAreas);
      setFormData(prev => ({ ...prev, area: '' }));
    }
  }, [formData.city, formData.zone, locationData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset custom inputs when switching back from "Other"
    if (name === 'city' && value !== 'other') {
      setCustomCity('');
    }
    if (name === 'zone' && value !== 'other') {
      setCustomZone('');
    }
    if (name === 'area' && value !== 'other') {
      setCustomArea('');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Get final values (use custom input if "other" is selected)
    const finalCity = formData.city === 'other' ? customCity : formData.city;
    const finalZone = formData.zone === 'other' ? customZone : formData.zone;
    const finalArea = formData.area === 'other' ? customArea : formData.area;

    // Validate form
    const requiredFields = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      city: finalCity,
      zone: finalZone,
      address: formData.address,
    };
    
    const missingFields = Object.entries(requiredFields).filter(([key, value]) => !value);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Create order object
    const orderData = {
      userId: user.uid,
      userEmail: user.email,
      items: cartItems.map(({ product, quantity }) => ({
        productId: product._id || product.id,
        title: product.title,
        price: product.price,
        quantity,
        image: product.images?.[0]?.url,
      })),
      billingDetails: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        city: finalCity,
        zone: finalZone,
        area: finalArea,
        address: formData.address,
        note: formData.note,
      },
      subtotal,
      shipping: shippingCost,
      discount,
      total,
      paymentMethod: formData.paymentMethod,
      couponCode: formData.coupon,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      // Send order to backend
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const result = await response.json();
      
      // Clear cart
      clearCart();
      
      // Show success toast
      toast.success('Order placed successfully! 🎉', {
        duration: 4000,
        position: 'top-center',
      });

      // Redirect to order confirmation or home
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Billing Details */}
          <div className="lg:col-span-2">
            <form onSubmit={handlePlaceOrder} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Billing Details</h2>

              {/* Name */}
              <div className="mb-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Name*"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone*"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* City, Zone, Area */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* City Dropdown */}
                <div className="relative">
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white"
                    required
                  >
                    <option value="">City*</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="other">Other (Type your own)</option>
                  </select>
                  <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  {formData.city === 'other' && (
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="Enter your city"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mt-2"
                      required
                    />
                  )}
                </div>

                {/* Zone Dropdown */}
                <div className="relative">
                  <select
                    name="zone"
                    value={formData.zone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white"
                    required
                    disabled={!formData.city || formData.city === 'other'}
                  >
                    <option value="">Zone*</option>
                    {zones.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                    <option value="other">Other (Type your own)</option>
                  </select>
                  <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  {(formData.zone === 'other' || formData.city === 'other') && (
                    <input
                      type="text"
                      value={customZone}
                      onChange={(e) => setCustomZone(e.target.value)}
                      placeholder="Enter your zone"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mt-2"
                      required
                    />
                  )}
                </div>

                {/* Area Dropdown */}
                <div className="relative">
                  <select
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white"
                    disabled={!formData.zone || formData.zone === 'other' || formData.city === 'other'}
                  >
                    <option value="">Area</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                    <option value="other">Other (Type your own)</option>
                  </select>
                  <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  {(formData.area === 'other' || formData.zone === 'other' || formData.city === 'other') && (
                    <input
                      type="text"
                      value={customArea}
                      onChange={(e) => setCustomArea(e.target.value)}
                      placeholder="Enter your area"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mt-2"
                    />
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="mb-4">
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address*"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  required
                />
              </div>

              {/* Note */}
              <div className="mb-4">
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Write a Note..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="mb-6 max-h-60 overflow-y-auto">
                {cartItems.map(({ product, quantity }) => {
                  const id = product._id || product.id;
                  const image = product.images?.[0]?.url || '/assets/placeholder.svg';
                  const title = product.title || product.name;
                  const price = product.price || 0;

                  return (
                    <div key={id} className="flex items-start gap-3 mb-4 pb-4 border-b last:border-b-0">
                      <Image
                        src={encodeURI(image)}
                        alt={title}
                        width={60}
                        height={60}
                        className="object-contain rounded"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium line-clamp-2">{title}</h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {quantity} x ৳{price}
                        </p>
                      </div>
                      <div className="text-sm font-semibold">
                        ৳{price * quantity}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Sub Total</span>
                  <span className="font-semibold">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="font-semibold">৳{shippingCost.toFixed(2)}</span>
                </div>
                {subtotal < 1500 && (
                  <p className="text-xs text-red-600">
                    Spend {(1500 - subtotal).toFixed(0)} Tk more for free delivery.{' '}
                    <Link href="/" className="text-blue-600 underline">Shop</Link>
                  </p>
                )}
                <div className="flex justify-between text-sm">
                  <span>Discount</span>
                  <span className="font-semibold">৳{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total (TK)</span>
                  <span>৳{total}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  name="coupon"
                  value={formData.coupon}
                  onChange={handleInputChange}
                  placeholder="Coupon"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
                >
                  Apply
                </button>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Payment</h3>
                
                {/* Online Payment */}
                <label className="flex items-center justify-between p-3 border border-gray-300 rounded-lg mb-3 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={formData.paymentMethod === 'online'}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <span>Online Payment</span>
                  </div>
                  <Image
                    src="https://ssl-commerz.com/wp-content/uploads/2019/11/logo_v2.png"
                    alt="Pay Online"
                    width={60}
                    height={30}
                    className="object-contain"
                  />
                </label>

                {/* bKash */}
                <label className="flex items-center justify-between p-3 border border-gray-300 rounded-lg mb-3 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bkash"
                      checked={formData.paymentMethod === 'bkash'}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <span>bkash</span>
                  </div>
                  <Image
                    src="https://download.logo.wine/logo/BKash/BKash-Logo.wine.png"
                    alt="bKash"
                    width={60}
                    height={30}
                    className="object-contain"
                  />
                </label>

                {/* Cash on Delivery */}
                <label className="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash-on-delivery"
                      checked={formData.paymentMethod === 'cash-on-delivery'}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <span>Cash on Delivery</span>
                  </div>
                  <Image
                    src="https://static.vecteezy.com/system/resources/previews/009/383/461/non_2x/cash-on-delivery-icon-clipart-cod-badge-design-illustration-free-png.png"
                    alt="Cash on Delivery"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </label>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                className="w-full bg-[#1a1a2e] text-white py-3 rounded-lg font-semibold hover:bg-[#16162a] transition"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
