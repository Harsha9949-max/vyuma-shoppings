import { CategoryInfo, Product } from '../types';

export const CATEGORIES: CategoryInfo[] = [
  { id: 'grocery', name: 'Grocery', image: '/assets/grocery.png', bannerTitle: 'Groceries & Daily Essentials' },
  { id: 'mobiles', name: 'Mobiles', image: '/assets/mobiles.png', bannerTitle: 'Mobile Phones & Accessories' },
  { id: 'fashion', name: 'Fashion', image: '/assets/fashion.png', bannerTitle: 'Clothing & Footwear' },
  { id: 'electronics', name: 'Electronics', image: '/assets/electronic.png', bannerTitle: 'Electronics & Gadgets' },
  { id: 'home', name: 'Home & Kitchen', image: '/assets/home.png', bannerTitle: 'Home & Living' },
  { id: 'appliances', name: 'Appliances', image: '/assets/applinces.png', bannerTitle: 'Appliances' },
  { id: 'beauty', name: 'Beauty', image: '/assets/beauty.png', bannerTitle: 'Beauty & Personal Care' },
  { id: 'toys', name: 'Toys & Baby', image: '/assets/toys_and_babby.png', bannerTitle: 'Toys & Baby Products' },
];

// No fake or hardcoded products. All products must be real and stored in Firebase Firestore.
export const INITIAL_PRODUCTS: Product[] = [];
