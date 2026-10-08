import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface DealsOfTheDayProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onViewAll: () => void;
}

export const DealsOfTheDay: React.FC<DealsOfTheDayProps> = ({
  products,
  onSelectProduct,
  onViewAll,
}) => {
  const dealProducts = products.filter((p) => p.isDealOfTheDay || p.discountPercent >= 10).slice(0, 5);

  const calculateTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, midnight.getTime() - now.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeUntilMidnight);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (dealProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-xs border border-gray-100 p-4 sm:p-6 mb-6">
      {/* Deals Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Deals of the Day
          </h2>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-[#2874f0]" />
            <span>
              {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} :{' '}
              {String(timeLeft.seconds).padStart(2, '0')} Left
            </span>
          </div>
        </div>

        <button
          onClick={onViewAll}
          className="self-start sm:self-auto bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-sm shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Deal Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {dealProducts.map((prod) => (
          <ProductCard
            key={prod.id}
            product={prod}
            onSelect={onSelectProduct}
          />
        ))}
      </div>
    </div>
  );
};
