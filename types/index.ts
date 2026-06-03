export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isVerified: boolean;
  hasStore: boolean;
  storeId?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  themeId?: string;
  whatsAppNumber?: string;
  instagramHandle?: string;
  facebookPageUrl?: string;
  twitterHandle?: string;
  currency: string;
  status: string;
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  stockQuantity: number;
  trackInventory: boolean;
  isDigital: boolean;
  type: string;
  sku?: string;
  isPublished: boolean;
  tags?: string;
  salesCount: number;
  categoryId?: string;
  categoryName?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceModifier?: number;
  stockQuantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentReference?: string; 
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  notes?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  createdAt: string;
}

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantInfo?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  productCount: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  fee: number;
  type: string;
  isActive: boolean;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  deliveryEstimate?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minimumOrderAmount?: number;
  usageLimit?: number;
  usageCount: number;
  remainingUses?: number;
  expiresAt?: string;
  isActive: boolean;
  isExpired: boolean;
}

export interface Dashboard {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPercent: number;
  totalOrders: number;
  ordersThisMonth: number;
  pendingOrders: number;
  processingOrders: number;
  totalProducts: number;
  publishedProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  revenueChart: RevenueChart[];
  ordersByStatus: OrderStatus[];
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
}

export interface RevenueChart {
  label: string;
  revenue: number;
  orders: number;
}

export interface OrderStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface TopProduct {
  id: string;
  name: string;
  imageUrl?: string;
  salesCount: number;
  revenue: number;
  stockQuantity: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface InventoryItem {
  productId: string;
  productName: string;
  sku?: string;
  currentStock: number;
  trackInventory: boolean;
  stockStatus: string;
  imageUrl?: string;
  price: number;
  categoryName?: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  previewImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  category: string;
  isFree: boolean;
  isPopular: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}