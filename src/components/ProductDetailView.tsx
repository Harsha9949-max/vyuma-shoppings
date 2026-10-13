import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Zap,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  Tag,
  Sparkles,
  CheckCircle2,
  Send,
  AlertCircle,
  Percent,
  CreditCard,
} from 'lucide-react';
import { Product, ProductVariant, Review } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { subscribeToReviews, addReviewToFirestore } from '../firebase/services';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
  onBuyNow: (product: Product) => void;
  onOpenAiAssistantWithContext: (product: Product) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onBack,
  onBuyNow,
  onOpenAiAssistantWithContext,
}) => {
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    showToast,
    checkPincodeServiceability,
    coupons,
    deliveryPincode,
    setDeliveryPincode,
  } = useShop();
  const { user, setAuthModalOpen } = useAuth();
  const wishlisted = isWishlisted(product.id);

  const [activeImage, setActiveImage] = useState<string>(product.images[0] || product.image);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(product.variants?.[0] || null);

  // Pincode state
  const defaultPin = deliveryPincode || '733093';
  const [pincodeCheck, setPincodeCheck] = useState(defaultPin);
  const [pincodeResult, setPincodeResult] = useState<{
    serviceable: boolean;
    estimatedDays: string;
    codAvailable: boolean;
    city: string;
  } | null>(() => checkPincodeServiceability(defaultPin));

  // Reviews state from Firestore
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHeadline, setReviewHeadline] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    setActiveImage(product.images[0] || product.image);
    setSelectedVariant(product.variants?.[0] || null);
    const activePin = deliveryPincode || pincodeCheck || '733093';
    setPincodeResult(checkPincodeServiceability(activePin));

    // Subscribe to reviews in Firestore
    const unsub = subscribeToReviews(product.id, (revs) => {
      setReviews(revs);
    });
    return () => unsub();
  }, [product, deliveryPincode]);

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentOriginalPrice = selectedVariant ? selectedVariant.originalPrice : product.originalPrice;
  const currentStock = selectedVariant ? selectedVariant.stockCount : product.stockCount;
  const discountPercent =
    currentOriginalPrice > currentPrice
      ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
      : 0;

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = checkPincodeServiceability(pincodeCheck);
    setPincodeResult(res);
    if (res.serviceable) {
      setDeliveryPincode(pincodeCheck);
      showToast(`Pincode ${pincodeCheck} verified: ${res.city}`);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!reviewHeadline.trim() || !reviewComment.trim()) {
      showToast('Please fill out the review headline and comment.');
      return;
    }

    setIsSubmittingReview(true);
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      userId: user.uid,
      userName: user.displayName || 'Verified Buyer',
      rating: reviewRating,
      headline: reviewHeadline.trim(),
      comment: reviewComment.trim(),
      createdAt: Date.now(),
      verifiedPurchase: true,
    };

    try {
      await addReviewToFirestore(newRev);
      showToast('Thank you! Your review has been published.');
      setReviewHeadline('');
      setReviewComment('');
      setShowReviewForm(false);
    } catch (err) {
      showToast('Failed to post review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#2874f0] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <span>Home</span>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          <span>/</span>
          <span>{product.subcategory}</span>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-[200px]">
            {product.brand}
          </span>
        </div>
      </div>

      {/* Main Product Container */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Column: Image Gallery & Buy Actions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex gap-4 mb-6">
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex flex-col gap-2 shrink-0">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 p-1 rounded-lg border transition overflow-hidden cursor-pointer ${
                      activeImage === img
                        ? 'border-[#2874f0] ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumb ${idx}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="flex-1 h-96 relative border border-gray-100 rounded-xl p-6 flex items-center justify-center bg-white group">
              <img
                src={activeImage}
                alt={product.title}
                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`absolute top-4 right-4 p-2.5 rounded-full border shadow-xs transition cursor-pointer ${
                  wishlisted
                    ? 'bg-rose-50 border-rose-200 text-rose-500'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-rose-500 hover:bg-gray-50'
                }`}
                title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Action CTAs: Add to Cart & Buy Now */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <button
              onClick={() => addToCart(product, 1, selectedVariant || undefined)}
              className="bg-[#ff9f00] hover:bg-[#f29600] text-white py-3.5 px-4 rounded-lg font-bold text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer uppercase"
            >
              <ShoppingCart className="w-4 h-4 fill-white" />
              <span>Add to Cart</span>
            </button>

            <button
              onClick={() => onBuyNow({ ...product, price: currentPrice, originalPrice: currentOriginalPrice })}
              className="bg-[#fb641b] hover:bg-[#e85b16] text-white py-3.5 px-4 rounded-lg font-bold text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer uppercase"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>

        {/* Right Column: Details, Offers & Specs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* Brand & Title */}
          <div>
            <span className="text-xs font-bold text-[#2874f0] uppercase tracking-wider">
              {product.brand}
            </span>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-snug mt-1">
              {product.title}
            </h1>
          </div>

          {/* Rating, Reviews count & Vyuma Assured badge */}
          <div className="flex items-center gap-3">
            {reviews.length > 0 ? (
              <>
                <div className="flex items-center gap-1 bg-[#388e3c] text-white text-xs font-bold px-2 py-0.5 rounded">
                  <span>{(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)}</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {reviews.length} Verified Customer {reviews.length === 1 ? 'Review' : 'Reviews'}
                </span>
              </>
            ) : product.ratingCount > 0 ? (
              <>
                <div className="flex items-center gap-1 bg-[#388e3c] text-white text-xs font-bold px-2 py-0.5 rounded">
                  <span>{product.rating}</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {product.ratingCount.toLocaleString()} Ratings & {product.reviewCount} Reviews
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400 font-medium">
                Verified genuine stock
              </span>
            )}

            {product.isAssured && (
              <span className="text-xs font-extrabold italic text-[#2874f0] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                VYUMA <span className="text-[#ffe500] font-black">★</span> Assured
              </span>
            )}
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-gray-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {currentOriginalPrice > currentPrice && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    ₹{currentOriginalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-black text-green-700">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Inclusive of all taxes. Free express shipping on this order.
            </p>

            {/* Low stock notice */}
            {currentStock <= 10 && currentStock > 0 && (
              <div className="pt-2 flex items-center gap-1.5 text-xs text-amber-700 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Hurry, only {currentStock} units left in stock!</span>
              </div>
            )}
          </div>

          {/* Variants Selector (if applicable) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Select Option / Configuration:
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        isSelected
                          ? 'border-[#2874f0] bg-blue-50/80 text-[#2874f0] ring-2 ring-blue-100'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {v.name} • ₹{v.price.toLocaleString('en-IN')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Offers & Promos Accordion */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Available Deals & Coupons
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200 flex items-start gap-2 text-emerald-900">
                <Tag className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Special Promo:</span> Use code <strong className="font-mono text-emerald-700">VYUMA100</strong> for Flat ₹100 Off on orders above ₹999.
                </div>
              </div>

              <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 flex items-start gap-2 text-blue-900">
                <CreditCard className="w-4 h-4 text-[#2874f0] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Bank Offer:</span> 10% Instant Discount on All Major Credit & Debit Cards via Razorpay.
                </div>
              </div>
            </div>
          </div>

          {/* Vyuma AI Advisor Trigger */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#2874f0]" />
              <div>
                <p className="text-xs font-bold text-blue-900">Have questions about this item?</p>
                <p className="text-[11px] text-blue-700">Ask Vyuma AI for specs comparison and deal advice.</p>
              </div>
            </div>
            <button
              onClick={() => onOpenAiAssistantWithContext(product)}
              className="bg-[#2874f0] hover:bg-blue-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
            >
              Ask AI ✨
            </button>
          </div>

          {/* Pincode & Delivery check */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
              Delivery & Serviceability Check
            </h4>
            <form onSubmit={handlePincodeSubmit} className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                maxLength={6}
                value={pincodeCheck}
                onChange={(e) => setPincodeCheck(e.target.value)}
                placeholder="Enter 6-digit Pincode"
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2874f0]"
              />
              <button
                type="submit"
                className="bg-[#2874f0] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer shrink-0"
              >
                Check
              </button>
            </form>

            {pincodeResult && (
              <div className="mt-2 text-xs space-y-1">
                {pincodeResult.serviceable ? (
                  <>
                    <p className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Serviceable to {pincodeResult.city} ({pincodeCheck})
                    </p>
                    <p className="text-gray-600">
                      Estimated Delivery: <strong>{pincodeResult.estimatedDays}</strong> • Free Shipping
                    </p>
                    <p className="text-gray-500 text-[11px]">
                      Cash on Delivery: {pincodeResult.codAvailable ? 'Available' : 'Prepaid Only'}
                    </p>
                  </>
                ) : (
                  <p className="text-rose-600 font-medium">Please enter a valid 6-digit Indian PIN code.</p>
                )}
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 text-center">
            <div className="flex flex-col items-center">
              <Truck className="w-5 h-5 text-[#2874f0] mb-1" />
              <span className="text-[11px] font-semibold text-gray-800">Free Express Delivery</span>
              <span className="text-[10px] text-gray-500">{product.fastDelivery}</span>
            </div>
            <div className="flex flex-col items-center">
              <RotateCcw className="w-5 h-5 text-[#2874f0] mb-1" />
              <span className="text-[11px] font-semibold text-gray-800">7 Days Replacement</span>
              <span className="text-[10px] text-gray-500">Hassle-free pickup</span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-[#2874f0] mb-1" />
              <span className="text-[11px] font-semibold text-gray-800">100% Genuine</span>
              <span className="text-[10px] text-gray-500">{product.seller || 'Verified Brand'}</span>
            </div>
          </div>

          {/* Highlights */}
          {product.highlights && product.highlights.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
                Product Highlights
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                {product.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Specifications */}
          {product.specs && (
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">
                Specifications
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                {Object.entries(product.specs).map(([key, val], idx) => (
                  <div
                    key={key}
                    className={`grid grid-cols-3 p-2.5 ${
                      idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <span className="text-gray-500 font-medium">{key}</span>
                    <span className="col-span-2 text-gray-900 font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ratings & Customer Reviews Section (Firestore Powered) */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Ratings & Reviews</h3>
            <p className="text-xs text-gray-500">Real customer feedback synced live with Firestore</p>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs transition cursor-pointer"
          >
            {showReviewForm ? 'Cancel Review' : 'Rate Product'}
          </button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 mb-6 space-y-3"
          >
            <h4 className="text-sm font-bold text-blue-900">Write a Review for this Product</h4>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-700 font-medium">Select Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reviewRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-gray-800 ml-2">{reviewRating} Stars</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Headline</label>
              <input
                type="text"
                required
                value={reviewHeadline}
                onChange={(e) => setReviewHeadline(e.target.value)}
                placeholder="e.g. Highly Recommended! Value for money."
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#2874f0]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Your Detailed Experience</label>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell us what you liked or disliked about this product..."
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#2874f0]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="bg-[#fb641b] hover:bg-[#e85b16] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</span>
            </button>
          </form>
        )}

        {/* Existing Reviews */}
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1 bg-[#388e3c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    <span>{rev.rating}</span>
                    <Star className="w-2.5 h-2.5 fill-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-900">{rev.headline}</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed my-1.5">{rev.comment}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="font-medium text-gray-600">{rev.userName}</span>
                  {rev.verifiedPurchase && (
                    <span className="text-green-700 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Certified Buyer
                    </span>
                  )}
                  <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm font-medium">No customer reviews yet.</p>
              <p className="text-xs mt-1">Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
