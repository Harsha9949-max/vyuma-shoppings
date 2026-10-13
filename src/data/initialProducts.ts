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

export const INITIAL_PRODUCTS: Product[] = [
  // MOBILES
  {
    id: 'prod-mob-01',
    title: 'Apple iPhone 15 (128 GB) - Black',
    brand: 'Apple',
    category: 'mobiles',
    subcategory: 'Smartphones',
    price: 69999,
    originalPrice: 79900,
    discountPercent: 12,
    rating: 4.7,
    ratingCount: 14200,
    reviewCount: 1850,
    image: '/assets/mobiles.png',
    images: ['/assets/mobiles.png'],
    isAssured: true,
    isDealOfTheDay: true,
    isTrending: true,
    description: 'Dynamic Island bubbles up alerts and Live Activities. 48MP Main camera with 2x Telephoto. Durable color-infused glass and aluminum design. USB-C with charging convenience.',
    highlights: [
      'Super Retina XDR Display 6.1-inch OLED',
      '48MP Main Camera with 2x Optical Quality Telephoto',
      'A16 Bionic chip with 5-core GPU',
      'All-day battery life up to 20 hours video playback',
      'Industry-leading Ceramic Shield front'
    ],
    specs: {
      'Display': '6.1-inch Super Retina XDR OLED',
      'Chipset': 'A16 Bionic Hexa Core',
      'Internal Storage': '128 GB',
      'Camera': '48MP + 12MP Dual Rear, 12MP TrueDepth Front',
      'Charging': 'USB Type-C Fast Charging'
    },
    inStock: true,
    stockCount: 45,
    fastDelivery: 'Delivery by Tomorrow, 2 PM',
    seller: 'Vyuma Retail Official',
    sku: 'IPHONE15-128-BLK',
    barcode: '194253782910',
    tags: ['Bestseller', 'Hot Deal', 'Flagship'],
    lowStockThreshold: 10,
    variants: [
      { id: 'v-ip15-128', name: '128 GB / Black', sku: 'IP15-128-BLK', price: 69999, originalPrice: 79900, stockCount: 45, attributes: { Storage: '128GB', Color: 'Black' } },
      { id: 'v-ip15-256', name: '256 GB / Blue', sku: 'IP15-256-BLU', price: 79999, originalPrice: 89900, stockCount: 20, attributes: { Storage: '256GB', Color: 'Blue' } },
      { id: 'v-ip15-512', name: '512 GB / Green', sku: 'IP15-512-GRN', price: 99999, originalPrice: 109900, stockCount: 8, attributes: { Storage: '512GB', Color: 'Green' } }
    ]
  },
  {
    id: 'prod-mob-02',
    title: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 12GB RAM, 256GB Storage)',
    brand: 'Samsung',
    category: 'mobiles',
    subcategory: 'Smartphones',
    price: 129999,
    originalPrice: 134999,
    discountPercent: 4,
    rating: 4.8,
    ratingCount: 9400,
    reviewCount: 920,
    image: '/assets/mobiles.png',
    images: ['/assets/mobiles.png'],
    isAssured: true,
    isDealOfTheDay: false,
    isTrending: true,
    description: 'Galaxy AI is here. Search like never before with Circle to Search, get real-time voice translation on calls, and edit photos with Generative AI. Built with Titanium shield and integrated S Pen.',
    highlights: [
      '6.8-inch Dynamic AMOLED 2X 120Hz display',
      'Snapdragon 8 Gen 3 for Galaxy processor',
      '200MP Quad Camera with 100x Space Zoom',
      'Built-in S Pen stylus included',
      '5000 mAh battery with 45W fast charge'
    ],
    specs: {
      'RAM': '12 GB LPDDR5X',
      'Storage': '256 GB UFS 4.0',
      'Processor': 'Snapdragon 8 Gen 3',
      'Main Camera': '200MP + 50MP + 12MP + 10MP',
      'Build': 'Titanium Frame with Gorilla Glass Armor'
    },
    inStock: true,
    stockCount: 22,
    fastDelivery: 'Delivery in 1-2 days',
    seller: 'Vyuma Prime Hub',
    sku: 'SGS24U-256-GRY',
    tags: ['Flagship', 'Galaxy AI'],
    lowStockThreshold: 5
  },
  {
    id: 'prod-mob-03',
    title: 'OnePlus 12 5G (Silky Black, 16GB RAM, 512GB Storage)',
    brand: 'OnePlus',
    category: 'mobiles',
    subcategory: 'Smartphones',
    price: 64999,
    originalPrice: 69999,
    discountPercent: 7,
    rating: 4.6,
    ratingCount: 6800,
    reviewCount: 510,
    image: '/assets/mobiles.png',
    images: ['/assets/mobiles.png'],
    isAssured: true,
    isDealOfTheDay: true,
    isTrending: true,
    description: 'Empowered by 4th Gen Hasselblad Camera for Mobile, Snapdragon 8 Gen 3, and Dual Cryo-velocity VC cooling system. 100W SUPERVOOC flash charge fuels 5400 mAh battery in 26 minutes.',
    highlights: [
      'ProXDR 2K 120 Hz AMOLED Display with Dolby Vision',
      '50MP Sony LYT-808 with OIS + 64MP 3x Periscope Telephoto',
      '5400 mAh Battery with 100W SuperVOOC & 50W Wireless',
      'Aqua Touch technology for wet finger touch tracking'
    ],
    specs: {
      'RAM': '16 GB',
      'Storage': '512 GB',
      'Battery': '5400 mAh',
      'Charging': '100W Wired + 50W Wireless'
    },
    inStock: true,
    stockCount: 38,
    fastDelivery: 'Delivery by Tomorrow',
    seller: 'Vyuma SuperStore',
    sku: 'OP12-512-BLK'
  },

  // ELECTRONICS
  {
    id: 'prod-elec-01',
    title: 'Apple MacBook Air M3 Chip (13.6-inch Liquid Retina, 8GB Unified Memory, 256GB SSD)',
    brand: 'Apple',
    category: 'electronics',
    subcategory: 'Laptops',
    price: 104900,
    originalPrice: 114900,
    discountPercent: 9,
    rating: 4.9,
    ratingCount: 3200,
    reviewCount: 420,
    image: '/assets/electronic.png',
    images: ['/assets/electronic.png'],
    isAssured: true,
    isDealOfTheDay: true,
    isTrending: true,
    description: 'Lean. Mean. M3 machine. Strikingly thin design with up to 18 hours of battery life. Silent, fanless architecture. Liquid Retina display supporting 1 billion colors.',
    highlights: [
      'Apple M3 chip with 8-core CPU and 10-core GPU',
      '13.6-inch Liquid Retina display with 500 nits brightness',
      '1080p FaceTime HD camera with 3-mic array',
      'MagSafe 3 charging port with two Thunderbolt ports',
      'Backlit Magic Keyboard with Touch ID'
    ],
    specs: {
      'Display': '13.6" Liquid Retina (2560 x 1664)',
      'Memory': '8 GB Unified Memory',
      'Storage': '256 GB PCIe SSD',
      'Weight': '1.24 kg'
    },
    inStock: true,
    stockCount: 16,
    fastDelivery: 'Delivery in 2 days',
    seller: 'Vyuma Direct',
    sku: 'MBA-M3-256-SLV'
  },
  {
    id: 'prod-elec-02',
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Over-Ear Headphones',
    brand: 'Sony',
    category: 'electronics',
    subcategory: 'Audio',
    price: 26990,
    originalPrice: 34990,
    discountPercent: 23,
    rating: 4.8,
    ratingCount: 8900,
    reviewCount: 1200,
    image: '/assets/electronic.png',
    images: ['/assets/electronic.png'],
    isAssured: true,
    isDealOfTheDay: true,
    isTrending: true,
    description: 'Two processors and 8 microphones for unprecedented noise cancellation. Integrated V1 Processor with Auto NC Optimizer. Up to 30 hours battery life with quick charging.',
    highlights: [
      'Industry-leading Noise Canceling with 8 microphones',
      'Crystal clear hands-free calling with 4 beamforming mics',
      '30-hour battery life with 3 min quick charge for 3 hours',
      'Multipoint connection to switch smoothly between devices'
    ],
    specs: {
      'Battery Life': '30 Hours with ANC ON',
      'Bluetooth': 'v5.2 with LDAC & Hi-Res Audio',
      'Weight': '250 grams'
    },
    inStock: true,
    stockCount: 50,
    fastDelivery: 'Delivery by Tomorrow',
    seller: 'Vyuma Audio World',
    sku: 'SONY-XM5-BLK'
  },
  {
    id: 'prod-elec-03',
    title: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum Case',
    brand: 'Apple',
    category: 'electronics',
    subcategory: 'Wearables',
    price: 41999,
    originalPrice: 44900,
    discountPercent: 6,
    rating: 4.7,
    ratingCount: 4100,
    reviewCount: 310,
    image: '/assets/electronic.png',
    images: ['/assets/electronic.png'],
    isAssured: true,
    isDealOfTheDay: false,
    isTrending: false,
    description: 'Smarter, brighter, and mightier. Double Tap gesture for magical hands-free controls. Advanced health sensors for blood oxygen, ECG, and sleep tracking.',
    highlights: [
      'S9 SiP with 64-bit dual-core processor',
      'Double tap gesture control',
      'Always-On Retina display up to 2000 nits',
      'ECG app and Blood Oxygen sensor'
    ],
    specs: {
      'Case Size': '45 mm',
      'Connectivity': 'GPS + Bluetooth 5.3 + Wi-Fi',
      'Water Resistance': '50 meters'
    },
    inStock: true,
    stockCount: 28,
    fastDelivery: 'Delivery in 1-2 days',
    seller: 'Vyuma Official',
    sku: 'AW9-45-MID'
  },

  // FASHION
  {
    id: 'prod-fash-01',
    title: "Nike Air Max SC Men's Lightweight Athletic Sneakers",
    brand: 'Nike',
    category: 'fashion',
    subcategory: 'Footwear',
    price: 4495,
    originalPrice: 5995,
    discountPercent: 25,
    rating: 4.5,
    ratingCount: 5600,
    reviewCount: 780,
    image: '/assets/fashion.png',
    images: ['/assets/fashion.png'],
    isAssured: true,
    isDealOfTheDay: true,
    isTrending: true,
    description: 'With its easy-going lines, heritage track look, and visible Air cushioning, the Nike Air Max SC is the perfect finish to any outfit. Rich mixture of materials adds depth.',
    highlights: [
      'Leather, textile, and mesh combine for durable construction',
      'Max Air unit delivers lightweight cushioning with every stride',
      'Foam midsole adds cushioning that lasts all day',
      'Rubber outsole provides traction and durability'
    ],
    specs: {
      'Closure': 'Lace-Up',
      'Material': 'Synthetic Leather & Breathable Mesh',
      'Sole': 'Rubber with Air Cushioning'
    },
    inStock: true,
    stockCount: 65,
    fastDelivery: 'Delivery by Tomorrow',
    seller: 'Vyuma Fashion Outlet',
    sku: 'NIKE-AMSC-WHT',
    variants: [
      { id: 'v-nike-8', name: 'Size: UK 8 / White-Black', sku: 'NIKE-SC-8', price: 4495, originalPrice: 5995, stockCount: 20, attributes: { Size: 'UK 8', Color: 'White' } },
      { id: 'v-nike-9', name: 'Size: UK 9 / White-Black', sku: 'NIKE-SC-9', price: 4495, originalPrice: 5995, stockCount: 25, attributes: { Size: 'UK 9', Color: 'White' } },
      { id: 'v-nike-10', name: 'Size: UK 10 / White-Black', sku: 'NIKE-SC-10', price: 4495, originalPrice: 5995, stockCount: 20, attributes: { Size: 'UK 10', Color: 'White' } }
    ]
  },
  {
    id: 'prod-fash-02',
    title: "Levi's Men's 511 Slim Fit Premium Stretch Denim Jeans",
    brand: "Levi's",
    category: 'fashion',
    subcategory: 'Menswear',
    price: 2199,
    originalPrice: 3599,
    discountPercent: 39,
    rating: 4.4,
    ratingCount: 8200,
    reviewCount: 1100,
    image: '/assets/fashion.png',
    images: ['/assets/fashion.png'],
    isAssured: true,
    isDealOfTheDay: false,
    isTrending: true,
    description: 'A modern slim with room to move. Added stretch for all-day comfort. Cut close through the thigh with a slim leg for a clean silhouette.',
    highlights: [
      '99% Cotton, 1% Elastane stretch denim',
      'Zip fly with metal button closure',
      'Signature 5-pocket styling with Arcuate back pocket stitching',
      'Fade-resistant indigo wash'
    ],
    specs: {
      'Fit': 'Slim Fit',
      'Fabric': 'Cotton Stretch Denim',
      'Wash Care': 'Machine Wash Cold'
    },
    inStock: true,
    stockCount: 70,
    fastDelivery: 'Delivery in 2 days',
    seller: 'Vyuma Apparel Hub',
    sku: 'LEVI-511-INDIGO'
  },

  // HOME & KITCHEN
  {
    id: 'prod-home-01',
    title: 'Philips Digital Air Fryer with Rapid Air Technology (4.1L, 1400W, Black)',
    brand: 'Philips',
    category: 'home',
    subcategory: 'Kitchen Appliances',
    price: 7999,
    originalPrice: 11995,
    discountPercent: 33,
    rating: 4.6,
    ratingCount: 11200,
    reviewCount: 1450,
    image: '/assets/home.png',
    images: ['/assets/home.png'],
    isAssured: true,
    isDealOfTheDay: true,
    isTrending: true,
    description: 'Fry with up to 90% less fat. Rapid Air Technology creates 7x faster airflow for delicious results that are crispy on the outside and tender on the inside. Touchscreen with 7 presets.',
    highlights: [
      'Rapid Air Technology with unique starfish design',
      'Digital Touch Screen with 7 pre-set cooking programs',
      'Keep warm function keeps food ready for up to 30 mins',
      'Dishwasher safe detachable non-stick basket'
    ],
    specs: {
      'Capacity': '4.1 Liters',
      'Power': '1400 Watts',
      'Temperature Range': '80°C - 200°C'
    },
    inStock: true,
    stockCount: 42,
    fastDelivery: 'Delivery by Tomorrow',
    seller: 'Vyuma Home Essentials',
    sku: 'PHI-AF-HD9252'
  },
  {
    id: 'prod-home-02',
    title: 'Prestige Iris Plus 750 Watt Mixer Grinder with 4 Stainless Steel Jars',
    brand: 'Prestige',
    category: 'home',
    subcategory: 'Kitchen Appliances',
    price: 2999,
    originalPrice: 6295,
    discountPercent: 52,
    rating: 4.3,
    ratingCount: 19800,
    reviewCount: 2400,
    image: '/assets/home.png',
    images: ['/assets/home.png'],
    isAssured: true,
    isDealOfTheDay: false,
    isTrending: true,
    description: 'Heavy duty 750 Watt motor designed for tough grinding of spices and lentils. Comes with 3 stainless steel multipurpose jars and 1 transparent juicer jar with blade extractor.',
    highlights: [
      'Powerful 750W copper winding motor',
      '4 jars: Wet (1.5L), Dry (1L), Chutney (300ml), Juicer (1.5L)',
      'Overload protection switch for motor safety',
      'Ergonomic handles with sturdy base'
    ],
    specs: {
      'Motor': '750 Watts',
      'Warranty': '2 Years Manufacturer Warranty',
      'Speed': '3 Speed Control with Pulse'
    },
    inStock: true,
    stockCount: 55,
    fastDelivery: 'Delivery in 1-2 days',
    seller: 'Vyuma SuperStore',
    sku: 'PRESTIGE-IRIS-750'
  },

  // APPLIANCES
  {
    id: 'prod-app-01',
    title: 'Dyson V8 Absolute Cordless Vacuum Cleaner with Multi-Floor Attachments',
    brand: 'Dyson',
    category: 'appliances',
    subcategory: 'Floor Care',
    price: 29900,
    originalPrice: 43900,
    discountPercent: 32,
    rating: 4.7,
    ratingCount: 3400,
    reviewCount: 490,
    image: '/assets/applinces.png',
    images: ['/assets/applinces.png'],
    isAssured: true,
    isDealOfTheDay: true,
    isTrending: true,
    description: 'Engineered for homes with pets. De-tangling Motorbar cleaner head clears wrapped hair as you clean. Powerful, versatile, and low-noise cordless cleaning up to 40 minutes.',
    highlights: [
      'Dyson Digital Motor V8 spins up to 110,000 rpm',
      'Whole-machine filtration captures 99.99% of microscopic particles',
      'Up to 40 minutes of fade-free suction',
      'Transforms to handheld with one click'
    ],
    specs: {
      'Run Time': 'Up to 40 mins',
      'Bin Volume': '0.54 Liters',
      'Weight': '2.6 kg'
    },
    inStock: true,
    stockCount: 18,
    fastDelivery: 'Delivery in 2 days',
    seller: 'Vyuma Appliances Hub',
    sku: 'DYSON-V8-ABS'
  },
  {
    id: 'prod-app-02',
    title: 'LG 322 L 3 Star Frost Free Smart Inverter Double Door Refrigerator',
    brand: 'LG',
    category: 'appliances',
    subcategory: 'Refrigerators',
    price: 36990,
    originalPrice: 47990,
    discountPercent: 23,
    rating: 4.6,
    ratingCount: 4800,
    reviewCount: 620,
    image: '/assets/applinces.png',
    images: ['/assets/applinces.png'],
    isAssured: true,
    isDealOfTheDay: false,
    isTrending: false,
    description: 'Multi Air Flow system maintains optimal temperatures. Smart Inverter Compressor provides energy efficiency and silent operation. Door Cooling+ delivers faster cooling to door shelves.',
    highlights: [
      'Capacity 322 L suitable for families with 3 to 5 members',
      '3 Star Energy Rating with annual energy consumption 242 kWh',
      'Smart Inverter Compressor with 10 year warranty',
      'Toughened Glass Shelves capable of holding heavy pots'
    ],
    specs: {
      'Capacity': '322 Liters',
      'Defrost': 'Frost Free',
      'Warranty': '1 Year Comprehensive + 10 Years Compressor'
    },
    inStock: true,
    stockCount: 12,
    fastDelivery: 'Delivery in 2-3 days (White Glove Installation)',
    seller: 'Vyuma Prime Hub',
    sku: 'LG-REF-322L-SIL'
  },

  // BEAUTY & PERSONAL CARE
  {
    id: 'prod-beau-01',
    title: 'Minimalist 10% Vitamin C Face Serum for Glowing & Even Skin Tone (30ml)',
    brand: 'Minimalist',
    category: 'beauty',
    subcategory: 'Skincare',
    price: 664,
    originalPrice: 699,
    discountPercent: 5,
    rating: 4.6,
    ratingCount: 18500,
    reviewCount: 2300,
    image: '/assets/beauty.png',
    images: ['/assets/beauty.png'],
    isAssured: true,
    isDealOfTheDay: true,
    isTrending: true,
    description: 'Formulated with Ethyl Ascorbic Acid, a stable Vitamin C derivative, combined with Centella Asiatica Water. Effectively reduces dark spots, boosts collagen, and prevents sun damage.',
    highlights: [
      'Pure 10% Vitamin C + 1% Acetyl Glucosamine',
      'Fragrance free, essential oil free, non-comedogenic',
      'Suitable for all skin types including sensitive skin',
      'Clinically tested for radiant, luminous skin in 4 weeks'
    ],
    specs: {
      'Volume': '30 ml',
      'Skin Type': 'All Skin Types',
      'Key Active': '10% Ethyl Ascorbic Acid'
    },
    inStock: true,
    stockCount: 120,
    fastDelivery: 'Delivery by Tomorrow',
    seller: 'Vyuma Beauty Essentials',
    sku: 'MIN-VITC-30ML'
  },

  // GROCERY
  {
    id: 'prod-groc-01',
    title: 'Tata Tea Gold Premium Assam & Long Leaves Blend (1 kg Pack)',
    brand: 'Tata Tea',
    category: 'grocery',
    subcategory: 'Beverages',
    price: 499,
    originalPrice: 620,
    discountPercent: 20,
    rating: 4.7,
    ratingCount: 24000,
    reviewCount: 2900,
    image: '/assets/grocery.png',
    images: ['/assets/grocery.png'],
    isAssured: true,
    isDealOfTheDay: true,
    isTrending: true,
    description: 'Exquisite tea blend of fine Assam CTC teas with 15% gently rolled long tea leaves. Delivers rich taste and an irresistible aroma in every cup.',
    highlights: [
      'Rich taste with 15% long aroma leaves',
      '100% pure Indian tea sourced from top gardens',
      'Vacuum-packed for lasting freshness'
    ],
    specs: {
      'Net Quantity': '1 kg',
      'Shelf Life': '12 Months',
      'Diet Type': 'Vegetarian'
    },
    inStock: true,
    stockCount: 150,
    fastDelivery: 'Delivery by Today Evening (Vyuma Quick)',
    seller: 'Vyuma Daily Mart',
    sku: 'TATA-GOLD-1KG'
  },
  {
    id: 'prod-groc-02',
    title: 'Fortune Sunlite Refined Sunflower Oil Pouch (1 L)',
    brand: 'Fortune',
    category: 'grocery',
    subcategory: 'Cooking Essentials',
    price: 135,
    originalPrice: 165,
    discountPercent: 18,
    rating: 4.6,
    ratingCount: 31000,
    reviewCount: 3400,
    image: '/assets/grocery.png',
    images: ['/assets/grocery.png'],
    isAssured: true,
    isDealOfTheDay: false,
    isTrending: true,
    description: 'Enriched with Vitamin A and Vitamin D. Light, healthy, and easy to digest cooking oil suitable for everyday sautéing, frying, and baking.',
    highlights: [
      'Refined Sunflower Oil fortified with Vitamins A & D',
      'Low absorb technology keeps food light and healthy',
      'High smoke point perfect for deep frying'
    ],
    specs: {
      'Volume': '1 Liter',
      'Pack Type': 'Pouch',
      'Diet Type': 'Vegetarian'
    },
    inStock: true,
    stockCount: 200,
    fastDelivery: 'Delivery by Today Evening',
    seller: 'Vyuma Daily Mart',
    sku: 'FORTUNE-SUN-1L'
  },

  // TOYS & BABY
  {
    id: 'prod-toy-01',
    title: 'LEGO Classic Medium Creative Brick Box Building Toy Set (484 Pieces)',
    brand: 'LEGO',
    category: 'toys',
    subcategory: 'Building Blocks',
    price: 2499,
    originalPrice: 3499,
    discountPercent: 29,
    rating: 4.8,
    ratingCount: 7200,
    reviewCount: 910,
    image: '/assets/toys_and_babby.png',
    images: ['/assets/toys_and_babby.png'],
    isAssured: true,
    isDealOfTheDay: true,
    isTrending: false,
    description: 'Designed with builders of all ages in mind. Includes windows, eyes, 18 tires and wheel rims to inspire creative building play. Packed in a convenient plastic storage box.',
    highlights: [
      '484 colorful LEGO bricks in 35 different colors',
      'Includes toy windows, toy eyes, wheels, and baseplate',
      'Convenient reusable storage container',
      'Encourages open-ended creativity and problem solving'
    ],
    specs: {
      'Pieces': '484 Pieces',
      'Age Range': '4 Years and Up',
      'Material': 'High-Grade ABS Plastic'
    },
    inStock: true,
    stockCount: 30,
    fastDelivery: 'Delivery in 1-2 days',
    seller: 'Vyuma Toys World',
    sku: 'LEGO-10696-MED'
  }
];
