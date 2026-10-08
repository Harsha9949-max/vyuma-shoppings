import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategorySlug } from '../types';

interface BannerCarouselProps {
  onSelectCategory: (category: CategorySlug) => void;
}

interface BannerSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  category: CategorySlug;
  badge: string;
}

const SLIDES: BannerSlide[] = [
  {
    id: 's1',
    image: '/assets/banner_one.png',
    title: 'ELECTRONICS & GADGETS',
    subtitle: 'Explore audio, laptops, smart accessories and computing',
    category: 'electronics',
    badge: 'VYUMA STORE',
  },
  {
    id: 's2',
    image: '/assets/banner_two.png',
    title: 'SMARTPHONES & DEVICES',
    subtitle: 'Mobile devices with fast delivery and Razorpay checkout',
    category: 'mobiles',
    badge: 'VYUMA STORE',
  },
  {
    id: 's3',
    image: '/assets/banner_three.png',
    title: 'FASHION & LIFESTYLE',
    subtitle: 'Discover curated clothing, footwear and everyday styles',
    category: 'fashion',
    badge: 'VYUMA STORE',
  },
];

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ onSelectCategory }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const current = SLIDES[currentIndex];

  return (
    <div className="relative w-full overflow-hidden bg-gray-900 group shadow-sm">
      <div
        className="w-full h-48 sm:h-64 md:h-80 relative cursor-pointer"
        onClick={() => onSelectCategory(current.category)}
      >
        <img
          src={current.image}
          alt={current.title}
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out brightness-90 group-hover:scale-102"
        />

        {/* Gradient Overlay & Text */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent flex items-center px-6 sm:px-12 md:px-16">
          <div className="max-w-xl text-white space-y-2 animate-in fade-in slide-in-from-left duration-300">
            <span className="inline-block bg-[#ffe500] text-blue-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded tracking-wider uppercase">
              {current.badge}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight drop-shadow-md">
              {current.title}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-200 font-medium">
              {current.subtitle}
            </p>
            <div className="pt-2">
              <button
                type="button"
                className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-sm shadow-md transition"
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-14 bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center rounded-r shadow-md transition opacity-0 group-hover:opacity-100 cursor-pointer"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-14 bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center rounded-l shadow-md transition opacity-0 group-hover:opacity-100 cursor-pointer"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              idx === currentIndex ? 'w-6 bg-[#2874f0]' : 'w-2 bg-white/60 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
