import React from 'react';
import { Gift, HelpCircle, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#172337] text-white text-xs mt-16 border-t border-gray-800">
      {/* Upper Links Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        
        {/* ABOUT */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider mb-2">
            About Vyuma
          </p>
          <ul className="space-y-1.5 text-gray-300">
            <li><a href="#" className="hover:underline">About Us</a></li>
            <li><a href="#" className="hover:underline">Careers</a></li>
            <li><a href="#" className="hover:underline">Vyuma Stories</a></li>
            <li><a href="#" className="hover:underline">Press Releases</a></li>
            <li><a href="#" className="hover:underline">Corporate Information</a></li>
          </ul>
        </div>

        {/* HELP */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider mb-2">
            Help
          </p>
          <ul className="space-y-1.5 text-gray-300">
            <li><a href="#" className="hover:underline">Payments</a></li>
            <li><a href="#" className="hover:underline">Shipping & Delivery</a></li>
            <li><a href="#" className="hover:underline">Cancellation & Returns</a></li>
            <li><a href="#" className="hover:underline">FAQ & Troubleshooting</a></li>
            <li><a href="#" className="hover:underline">Report Infringement</a></li>
          </ul>
        </div>

        {/* CONSUMER POLICY */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider mb-2">
            Consumer Policy
          </p>
          <ul className="space-y-1.5 text-gray-300">
            <li><a href="#" className="hover:underline">Cancellation & Returns</a></li>
            <li><a href="#" className="hover:underline">Terms of Use</a></li>
            <li><a href="#" className="hover:underline">Security & Encryption</a></li>
            <li><a href="#" className="hover:underline">Privacy Policy</a></li>
            <li><a href="#" className="hover:underline">Grievance Redressal</a></li>
            <li><a href="#" className="hover:underline">EPR Compliance</a></li>
          </ul>
        </div>

        {/* STORE INFORMATION */}
        <div className="space-y-2 text-gray-400 border-l border-gray-700/60 pl-4 col-span-2 sm:col-span-1 lg:col-span-2">
          <p className="text-[11px] font-bold text-[#878787] uppercase tracking-wider mb-2">
            Store & Infrastructure:
          </p>
          <div className="leading-relaxed text-gray-300 space-y-1">
            <p className="font-semibold text-white">VYUMA Online E-Commerce Platform</p>
            <p>Direct Cloud Database: Firebase Cloud Firestore</p>
            <p>Verified Payment Partner: Razorpay Payments</p>
            <p>Customer Support: support@vyuma.in</p>
            <p className="text-[11px] text-gray-400 pt-1">
              Registered Office: Bengaluru, Karnataka, India
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Bar */}
      <div className="border-t border-gray-700/80 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-300">
          
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Gift className="w-4 h-4 text-[#ffe500]" />
              <span>Gift Cards</span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-300">
              <HelpCircle className="w-4 h-4 text-[#ffe500]" />
              <span>Help Center</span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-300">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>100% Genuine Products</span>
            </div>
          </div>

          <div className="text-gray-400">
            © 2026 VYUMA.in. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
