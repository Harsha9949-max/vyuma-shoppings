import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Building,
  Banknote,
  ShieldCheck,
  Plus,
  Lock,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { Address, PaymentMethod } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const {
    cart,
    cartFinalPayable,
    cartTotalSavings,
    placeOrder,
    deliveryPincode,
    checkPincodeServiceability,
  } = useShop();

  const { addresses, addAddress, selectedAddress, setSelectedAddress, user, setAuthModalOpen } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiOption, setUpiOption] = useState<'gpay' | 'phonepe' | 'paytm' | 'id'>('gpay');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);

  // Address form modal/toggle
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [newMobile, setNewMobile] = useState('');
  const [newPincode, setNewPincode] = useState(deliveryPincode || '733093');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newType, setNewType] = useState<'HOME' | 'WORK'>('HOME');

  useEffect(() => {
    if (addresses.length === 0) {
      setIsAddingAddress(true);
    } else {
      setIsAddingAddress(false);
    }
  }, [addresses.length]);

  // Auto-resolve City & State when 6-digit PIN is entered
  useEffect(() => {
    const pin = newPincode.trim();
    if (pin.length === 6) {
      const res = checkPincodeServiceability(pin);
      if (res.serviceable) {
        if (!newCity || newCity === 'Raiganj' || newCity === 'Bengaluru' || newCity === 'Delhi') {
          if (pin.startsWith('733')) {
            setNewCity('Raiganj');
            setNewState('West Bengal');
          } else if (pin.startsWith('734')) {
            setNewCity('Siliguri');
            setNewState('West Bengal');
          } else if (pin.startsWith('700') || pin.startsWith('711')) {
            setNewCity('Kolkata');
            setNewState('West Bengal');
          } else if (pin.startsWith('560')) {
            setNewCity('Bengaluru');
            setNewState('Karnataka');
          } else if (pin.startsWith('110') || pin.startsWith('122')) {
            setNewCity('New Delhi');
            setNewState('Delhi');
          } else if (pin.startsWith('400')) {
            setNewCity('Mumbai');
            setNewState('Maharashtra');
          } else {
            setNewCity('District Centre');
            setNewState('India');
          }
        }
      }
    }
  }, [newPincode]);

  if (!isOpen) return null;

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMobile.trim() || !newAddressLine.trim() || !newPincode.trim() || !newCity.trim() || !newState.trim()) {
      alert('Please fill out all address fields.');
      return;
    }
    await addAddress({
      fullName: newName.trim(),
      mobile: newMobile.trim(),
      pincode: newPincode.trim(),
      addressLine: newAddressLine.trim(),
      city: newCity.trim(),
      state: newState.trim(),
      type: newType,
      isDefault: true,
    });
    setNewName('');
    setNewMobile('');
    setNewPincode('');
    setNewAddressLine('');
    setNewCity('');
    setNewState('');
    setIsAddingAddress(false);
  };

  const handleRazorpayPayment = async () => {
    const addressToUse = selectedAddress || addresses[0];
    if (!addressToUse) {
      alert('Please provide and save a delivery address before proceeding.');
      setIsAddingAddress(true);
      return;
    }

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Razorpay payment verification
      await new Promise((res) => setTimeout(res, 1000));

      const rzpPaymentId = `pay_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const rzpOrderId = `order_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      const order = await placeOrder(paymentMethod, addressToUse, {
        paymentId: rzpPaymentId,
        orderId: rzpOrderId,
      });

      setIsProcessing(false);
      onOrderSuccess(order.id);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      alert('Payment processing failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden my-6 border border-gray-100 flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Razorpay Gateway Branded Top Header */}
        <div className="bg-[#0c2340] text-white px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#1a3860] px-2.5 py-1 rounded text-xs font-black tracking-wider text-[#3395ff]">
              <Lock className="w-3.5 h-3.5 text-green-400" />
              <span>Razorpay</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-white tracking-wide">
                Razorpay Trusted Checkout
              </span>
              <span className="text-[10px] text-gray-300 block">
                Official Payment Partner for VYUMA • 256-Bit SSL Secured
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-gray-300 uppercase block font-semibold">Total Payable</span>
              <span className="text-base font-black text-white">
                ₹{cartFinalPayable.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1 hover:bg-white/10 rounded-full transition text-gray-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto">
          
          {/* Main Steps (8 cols) */}
          <div className="md:col-span-8 space-y-5">
            
            {/* Step 1: Delivery Address */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#2874f0] text-white text-xs font-bold rounded-full flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    Delivery Address
                  </h3>
                </div>

                {!isAddingAddress && addresses.length > 0 && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="text-xs text-[#2874f0] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {isAddingAddress ? (
                <form onSubmit={handleAddNewAddress} className="space-y-3 bg-gray-50 p-4 rounded-lg text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:border-[#2874f0]"
                        placeholder="Enter recipient name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">10-Digit Mobile *</label>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={newMobile}
                        onChange={(e) => setNewMobile(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:border-[#2874f0]"
                        placeholder="Mobile number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">PIN Code *</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:border-[#2874f0]"
                        placeholder="6-digit PIN"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:border-[#2874f0]"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:border-[#2874f0]"
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Street Address, House/Flat No. *</label>
                    <textarea
                      required
                      rows={2}
                      value={newAddressLine}
                      onChange={(e) => setNewAddressLine(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:border-[#2874f0]"
                      placeholder="Detailed address"
                    />
                  </div>

                  <div className="flex gap-4 items-center pt-1">
                    <span className="font-semibold text-gray-700">Address Type:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={newType === 'HOME'}
                        onChange={() => setNewType('HOME')}
                      />
                      <span>Home</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={newType === 'WORK'}
                        onChange={() => setNewType('WORK')}
                      />
                      <span>Work</span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="bg-[#2874f0] text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition cursor-pointer"
                    >
                      Save & Use This Address
                    </button>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddress?.id === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddress(addr)}
                        className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition ${
                          isSelected
                            ? 'border-[#3395ff] bg-blue-50/50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={isSelected}
                          onChange={() => setSelectedAddress(addr)}
                          className="mt-1 text-[#3395ff]"
                        />
                        <div className="text-xs">
                          <div className="flex items-center gap-2 font-bold text-gray-900">
                            <span>{addr.fullName}</span>
                            <span className="bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded text-[10px]">
                              {addr.type}
                            </span>
                            <span className="font-normal text-gray-600">{addr.mobile}</span>
                          </div>
                          <p className="text-gray-700 mt-1">
                            {addr.addressLine}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Razorpay Payment Modes */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#0c2340] text-white text-xs font-bold rounded-full flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    Select Payment Mode (Razorpay)
                  </h3>
                </div>
                <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  Instant Verification
                </span>
              </div>

              <div className="space-y-2.5">
                {/* 1. Razorpay UPI */}
                <div
                  className={`border rounded-lg p-3 cursor-pointer transition ${
                    paymentMethod === 'UPI' ? 'border-[#3395ff] bg-blue-50/30' : 'border-gray-200'
                  }`}
                  onClick={() => setPaymentMethod('UPI')}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                      className="text-[#3395ff]"
                    />
                    <QrCode className="w-4 h-4 text-[#3395ff]" />
                    <span className="text-xs font-bold text-gray-900">
                      Razorpay UPI (Google Pay, PhonePe, Paytm, Any UPI)
                    </span>
                    <span className="ml-auto text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded">
                      FASTEST
                    </span>
                  </div>

                  {paymentMethod === 'UPI' && (
                    <div className="mt-3 pl-6 space-y-2 text-xs">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'gpay', label: 'Google Pay' },
                          { id: 'phonepe', label: 'PhonePe' },
                          { id: 'paytm', label: 'Paytm UPI' },
                          { id: 'id', label: 'Enter UPI ID' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setUpiOption(opt.id as any)}
                            className={`px-3 py-1.5 rounded border text-xs font-semibold cursor-pointer ${
                              upiOption === opt.id
                                ? 'border-[#3395ff] bg-[#3395ff] text-white'
                                : 'border-gray-300 text-gray-700 bg-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {upiOption === 'id' && (
                        <div className="pt-2">
                          <input
                            type="text"
                            placeholder="username@upi / mobile@upi"
                            value={upiIdInput}
                            onChange={(e) => setUpiIdInput(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-[#3395ff]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Razorpay Cards */}
                <div
                  className={`border rounded-lg p-3 cursor-pointer transition ${
                    paymentMethod === 'CARD' ? 'border-[#3395ff] bg-blue-50/30' : 'border-gray-200'
                  }`}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'CARD'}
                      onChange={() => setPaymentMethod('CARD')}
                      className="text-[#3395ff]"
                    />
                    <CreditCard className="w-4 h-4 text-[#3395ff]" />
                    <span className="text-xs font-bold text-gray-900">
                      Credit / Debit Card (Visa, Mastercard, RuPay)
                    </span>
                  </div>

                  {paymentMethod === 'CARD' && (
                    <div className="mt-3 pl-6 space-y-2 text-xs">
                      <input
                        type="text"
                        placeholder="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:border-[#3395ff]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="MM / YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="p-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:border-[#3395ff]"
                        />
                        <input
                          type="password"
                          placeholder="CVV"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="p-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:border-[#3395ff]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Razorpay Net Banking */}
                <div
                  className={`border rounded-lg p-3 cursor-pointer transition ${
                    paymentMethod === 'NETBANKING' ? 'border-[#3395ff] bg-blue-50/30' : 'border-gray-200'
                  }`}
                  onClick={() => setPaymentMethod('NETBANKING')}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'NETBANKING'}
                      onChange={() => setPaymentMethod('NETBANKING')}
                      className="text-[#3395ff]"
                    />
                    <Building className="w-4 h-4 text-[#3395ff]" />
                    <span className="text-xs font-bold text-gray-900">
                      Net Banking (HDFC, SBI, ICICI, Axis, Kotak)
                    </span>
                  </div>

                  {paymentMethod === 'NETBANKING' && (
                    <div className="mt-3 pl-6 text-xs">
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded bg-white"
                      >
                        <option>HDFC Bank</option>
                        <option>State Bank of India</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                        <option>Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 4. Cash on Delivery */}
                <div
                  className={`border rounded-lg p-3 cursor-pointer transition ${
                    paymentMethod === 'COD' ? 'border-[#3395ff] bg-blue-50/30' : 'border-gray-200'
                  }`}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="text-[#3395ff]"
                    />
                    <Banknote className="w-4 h-4 text-[#3395ff]" />
                    <span className="text-xs font-bold text-gray-900">Cash on Delivery (COD)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Sidebar (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-xs">
              <h4 className="font-bold text-gray-900 uppercase tracking-wide pb-2 border-b border-gray-200">
                Payment Summary
              </h4>

              <div className="space-y-2 py-3 border-b border-gray-200 text-gray-600">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-semibold text-gray-900">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Discount:</span>
                  <span className="font-semibold text-green-700">
                    ₹{cartTotalSavings.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges:</span>
                  <span className="font-semibold text-green-700">FREE</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-3 text-sm font-bold text-gray-900">
                <span>Final Payable:</span>
                <span className="text-lg font-black text-[#0c2340]">
                  ₹{cartFinalPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={handleRazorpayPayment}
              disabled={isProcessing}
              className="w-full bg-[#3395ff] hover:bg-[#1a7de8] text-white py-3.5 rounded font-bold text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Razorpay...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay ₹{cartFinalPayable.toLocaleString('en-IN')} via Razorpay</span>
                </>
              )}
            </button>

            <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 space-y-1 text-[11px] text-gray-600">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Razorpay Secured Checkout</span>
              </div>
              <p>256-bit encrypted checkout with direct Firestore persistence.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
