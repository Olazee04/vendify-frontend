'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  ShoppingCart, Search, MessageCircle,
  Package, X, Plus, Minus, ChevronDown,
  Truck, Tag, Filter, SortAsc
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Store, Product, Category } from '@/types';
import ReviewsSection from './ReviewsSection';
import { useAbandonedCart } from './useAbandonedCart';

const API = process.env.NEXT_PUBLIC_API_URL;

interface CartItem {
  product: Product;
  quantity: number;
}

interface ShippingEstimate {
  fee: number;
  zoneName: string;
  deliveryEstimate?: string;
  isFreeShipping: boolean;
}

export default function PublicStorePage({
  slug
}: { slug: string }) {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
const [currency, setCurrency] = useState('NGN');
const [exchangeRates] = useState<Record<string, number>>({
  NGN: 1,
  USD: 0.00065,
  GBP: 0.00051,
  EUR: 0.00060,
  GHS: 0.0079,
});

const currencySymbols: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  GHS: '₵',
};
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{
    code: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
    finalAmount: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] =
    useState(false);
  const [shippingState, setShippingState] = useState('');
  const [shippingEstimate, setShippingEstimate] =
    useState<ShippingEstimate | null>(null);
  const [checkingShipping, setCheckingShipping] =
    useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const formatPrice = (nairaAmount: number) => {
  const rate = exchangeRates[currency] ?? 1;
  const converted = nairaAmount * rate;
  const symbol = currencySymbols[currency] ?? '₦';
  return `${symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'NGN' ? 0 : 2,
    maximumFractionDigits: currency === 'NGN' ? 0 : 2,
  })}`;
};

  useEffect(() => {
    fetchStore();
  }, [slug]);

  const fetchStore = async () => {
    try {
      const [storeRes, productsRes, categoriesRes] =
        await Promise.all([
          axios.get(`${API}/api/v1/stores/${slug}`),
          axios.get(`${API}/api/v1/products/store/${slug}`),
          axios.get(`${API}/api/v1/categories/${slug}`)
        ]);
      setStore(storeRes.data.data);
      setProducts(productsRes.data.data?.products ?? []);
      setCategories(categoriesRes.data.data ?? []);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const { clearAbandonedCart } = useAbandonedCart({
  cart,
  storeSlug: slug,
  storeName: store?.name ?? '',
  whatsAppNumber: store?.whatsAppNumber ?? '',
});
  // ── Filtered + Sorted Products ─────────────────────────
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase()
          .includes(search.toLowerCase()) ||
        p.tags?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(
        p => p.categoryId === selectedCategory
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
        break;
      case 'popular':
        result.sort((a, b) => b.salesCount - a.salesCount);
        break;
    }

    return result;
  }, [products, search, selectedCategory, sortBy]);

  // ── Related Products ───────────────────────────────────
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products
      .filter(p =>
        p.id !== selectedProduct.id &&
        (p.categoryId === selectedProduct.categoryId ||
          p.tags?.split(',').some(tag =>
            selectedProduct.tags?.includes(tag.trim())
          ))
      )
      .slice(0, 4);
  }, [selectedProduct, products]);

  // ── Cart Functions ─────────────────────────────────────
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(
        i => i.product.id === product.id
      );
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} added! 🛒`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(
      i => i.product.id !== productId
    ));
    if (couponApplied) setCouponApplied(null);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      return { ...item, quantity: newQty };
    }));
  };

  const cartSubtotal = cart.reduce(
    (sum, item) =>
      sum + item.product.price * item.quantity, 0
  );

  const cartDiscount = couponApplied?.discountAmount ?? 0;

  const shippingFee = shippingEstimate?.fee ?? 0;

  const cartTotal = cartSubtotal - cartDiscount + shippingFee;

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  // ── Coupon ─────────────────────────────────────────────
  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    if (cart.length === 0) {
      toast.error('Add products to cart first');
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await axios.post(
        `${API}/api/v1/coupons/validate`,
        {
          code: couponCode.toUpperCase(),
          storeSlug: slug,
          orderAmount: cartSubtotal
        }
      );
      const data = res.data.data;
      if (data.isValid) {
        setCouponApplied({
          code: data.code,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          discountValue: data.discountValue,
          finalAmount: data.finalAmount
        });
        toast.success(
          `Coupon applied! You save ₦${
            data.discountAmount.toLocaleString()
          } 🎉`
        );
      } else {
        toast.error(data.message || 'Invalid coupon');
      }
    } catch {
      toast.error('Failed to validate coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  // ── Shipping Estimate ──────────────────────────────────
  const calculateShipping = async () => {
    if (!shippingState.trim()) return;
    setCheckingShipping(true);
    try {
      const res = await axios.post(
        `${API}/api/v1/shipping/calculate`,
        {
          storeSlug: slug,
          state: shippingState,
          country: 'Nigeria'
        }
      );
      setShippingEstimate(res.data.data);
      toast.success('Shipping calculated!');
    } catch {
      toast.error('Failed to calculate shipping');
    } finally {
      setCheckingShipping(false);
    }
  };

 const handlePaystackPayment = () => {
  if (cart.length === 0) return;

  const total = cartTotal;
  const paystackKey = 'pk_test_8d0dd243c4f86c1148c9afdd8f85621c1759ff34';

  const itemsList = cart.map(i =>
    `${i.product.name} x${i.quantity} - N${(i.product.price * i.quantity).toLocaleString()}`
  ).join('\n');

  const loadPaystack = () => {
    return new Promise<void>((resolve) => {
      if ((window as any).PaystackPop) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  const placeOrder = (reference: string) => {
    axios.post(`${API}/api/v1/orders/${slug}`, {
      customerName: 'Online Customer',
      customerEmail: 'customer@vendify.com',
      customerPhone: '00000000000',
      paymentMethod: 'Paystack',
      paymentReference: reference,
      paymentStatus: 'Paid',
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
      })),
      subtotal: cartSubtotal,
      discount: cartDiscount,
      shippingFee: shippingFee,
      total: cartTotal,
      shippingAddress: {
        fullName: 'Online Customer',
        phoneNumber: '00000000000',
        addressLine1: 'Online Order',
        city: shippingState || 'Lagos',
        state: shippingState || 'Lagos',
        country: 'Nigeria',
      },
    }).catch(err => console.error('Order creation failed:', err));

    const phone = store?.whatsAppNumber
      ?.replace(/\D/g, '')
      .replace(/^0/, '234');

    const msg = encodeURIComponent(
      `Hi! I just paid for my order at *${store?.name}*\n\n` +
      `*Items:*\n${itemsList}\n\n` +
      `*Total Paid: N${total.toLocaleString()}*\n\n` +
      `*Paystack Reference: ${reference}*\n\n` +
      `Please confirm my order. Thank you!`
    );

    setShowCart(false);
    setCart([]);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    toast.success('Payment successful! Check WhatsApp for confirmation.');
  };

  loadPaystack().then(() => {
    const handler = (window as any).PaystackPop.setup({
      key: paystackKey,
      email: 'customer@vendify.com',
      amount: total * 100,
      currency: 'NGN',
      ref: `VND-${Date.now()}`,
      metadata: {
        store: store?.name,
        items: itemsList,
      },
      callback: function(response: any) {
        placeOrder(response.reference);
      },
      onClose: function() {
        toast.error('Payment cancelled');
      },
    });
    handler.openIframe();
  });
};


  const handleFlutterwavePayment = () => {
    if (cart.length === 0) return;
    const total = cartTotal;
    const flwKey = "FLWPUBK_TEST-1e289717a1d2fa62557cfc173631bd5f-X"; // Replace with your Flutterwave public key

    const itemsList = cart.map(i =>
      `${i.product.name} x${i.quantity} - N${(i.product.price * i.quantity).toLocaleString()}`
    ).join("\n");

    const loadFlutterwave = () => {
      return new Promise<void>((resolve) => {
        if ((window as any).FlutterwaveCheckout) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.flutterwave.com/v3.js";
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    const completeOrder = (transactionId: string) => {
      axios.post(`${API}/api/v1/orders/${slug}`, {
        customerName: "Online Customer",
        customerEmail: "customer@vendify.com",
        customerPhone: "00000000000",
        paymentMethod: "Flutterwave",
        paymentReference: transactionId,
        paymentStatus: "Paid",
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
        subtotal: cartSubtotal,
        discount: cartDiscount,
        shippingFee: shippingFee,
        total: cartTotal,
        shippingAddress: {
          fullName: "Online Customer",
          phoneNumber: "00000000000",
          addressLine1: "Online Order",
          city: shippingState || "Lagos",
          state: shippingState || "Lagos",
          country: "Nigeria",
        },
      }).catch(err => console.error("Order creation failed:", err));

      const phone = store?.whatsAppNumber?.replace(/\D/g, "").replace(/^0/, "234");
      const msg = encodeURIComponent(
        `Hi! I just paid for my order at *${store?.name}*\n\n` +
        `*Items:*\n${itemsList}\n\n` +
        `*Total Paid: N${total.toLocaleString()}*\n\n` +
        `*Flutterwave Reference: ${transactionId}*\n\n` +
        `Please confirm my order. Thank you!`
      );
      setShowCart(false);
      setCart([]);
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
      toast.success("Payment successful!");
    };

    loadFlutterwave().then(() => {
      (window as any).FlutterwaveCheckout({
        public_key: flwKey,
        tx_ref: `VND-FLW-${Date.now()}`,
        amount: total,
        currency: "NGN",
        payment_options: "card,mobilemoney,ussd,banktransfer",
        customer: {
          email: "customer@vendify.com",
          name: "Online Customer",
        },
        customizations: {
          title: store?.name ?? "Vendify Store",
          description: `Order from ${store?.name}`,
          logo: store?.logoUrl ?? "",
        },
        callback: function(response: any) {
          if (response.status === "successful") {
            completeOrder(response.transaction_id);
          }
        },
        onclose: function() {
          toast("Payment window closed");
        },
      });
    });
  };
  // ── WhatsApp Checkout ──────────────────────────────────
 const checkoutViaWhatsApp = () => {
  clearAbandonedCart();
    if (!store?.whatsAppNumber) {
      toast.error('Store WhatsApp not available');
      return;
    }

    const items = cart.map(item =>
      `• ${item.product.name} x${item.quantity} = ₦${
        (item.product.price * item.quantity).toLocaleString()
      }`
    ).join('\n');

    const couponLine = couponApplied
      ? `\nCoupon (${couponApplied.code}): -₦${
          couponApplied.discountAmount.toLocaleString()
        }`
      : '';

    const shippingLine = shippingEstimate
      ? `\nShipping (${shippingEstimate.zoneName}): ₦${
          shippingEstimate.fee.toLocaleString()
        }`
      : '';

    const message = encodeURIComponent(
      `Hi! I want to order from *${store.name}*:\n\n` +
      `${items}${couponLine}${shippingLine}\n\n` +
      `*Total: ₦${cartTotal.toLocaleString()}*\n\n` +
      `Please confirm my order. Thank you! 🛍️`
    );

    const phone = store.whatsAppNumber
      .replace(/\D/g, '').replace(/^0/, '234');

    window.open(
      `https://wa.me/${phone}?text=${message}`, '_blank'
    );

    
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center
        justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-600
            border-t-transparent rounded-full animate-spin
            mx-auto mb-3"/>
          <p className="text-gray-500 text-sm">
            Loading store...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen flex items-center
        justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-6xl mb-4">🏪</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Store not found
          </h1>
          <p className="text-gray-500">
            This store does not exist
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Store Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        {store.bannerUrl && (
          <div className="h-24 sm:h-36 overflow-hidden">
            <img src={store.bannerUrl} alt="Banner"
              className="w-full h-full object-cover"/>
          </div>
        )}
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl
                flex items-center justify-center
                overflow-hidden shrink-0">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name}
                    className="w-full h-full object-cover"/>
                ) : (
                  <span className="text-xl font-bold
                    text-purple-600">
                    {store.name[0]}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {store.name}
                </h1>
                <div className="flex items-center gap-3">
                  {store.whatsAppNumber && (
                    <a href={`https://wa.me/${
                      store.whatsAppNumber
                        .replace(/\D/g, '')
                        .replace(/^0/, '234')
                    }`}
                      target="_blank" rel="noreferrer"
                      className="text-xs text-green-600
                        flex items-center gap-1">
                      <MessageCircle size={11}/>
                      WhatsApp
                    </a>
                  )}
                  {store.instagramHandle && (
                    <a href={`https://instagram.com/${store.instagramHandle}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs text-pink-600">
                      📸 IG
                    </a>
                  )}
                  <div className="flex items-center gap-1 ml-2">
  <select
    value={currency}
    onChange={(e) => setCurrency(e.target.value)}
    className="text-xs border border-gray-200 rounded-lg
      px-2 py-1 bg-white text-gray-600
      focus:outline-none focus:ring-2
      focus:ring-purple-500 cursor-pointer">
    <option value="NGN">🇳🇬 NGN</option>
    <option value="USD">🇺🇸 USD</option>
    <option value="GBP">🇬🇧 GBP</option>
    <option value="EUR">🇪🇺 EUR</option>
    <option value="GHS">🇬🇭 GHS</option>
  </select>
</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2
                bg-purple-600 text-white px-4 py-2.5
                rounded-xl font-medium hover:bg-purple-700
                transition-colors">
              <ShoppingCart size={18}/>
              <span className="hidden sm:inline text-sm">
                Cart
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5
                  h-5 bg-red-500 text-white text-xs rounded-full
                  flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Search + Filters */}
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3
              top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border
                border-gray-200 rounded-xl text-sm
                focus:outline-none focus:ring-2
                focus:ring-purple-500 shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5
              rounded-xl text-sm font-medium border
              transition-colors shadow-sm
              ${showFilters
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-600 border-gray-200'
              }`}>
            <Filter size={15}/>
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border
            border-gray-200 p-4 space-y-4 shadow-sm">

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500
                  uppercase mb-2">
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm
                      font-medium transition-colors
                      ${selectedCategory === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setSelectedCategory(cat.id)
                      }
                      className={`px-3 py-1.5 rounded-lg
                        text-sm font-medium transition-colors
                        ${selectedCategory === cat.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                      {cat.name}
                      {cat.productCount > 0 && (
                        <span className="ml-1 opacity-70">
                          ({cat.productCount})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <p className="text-xs font-semibold text-gray-500
                uppercase mb-2">
                Sort By
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'default', label: 'Default' },
                  { value: 'newest', label: 'Newest' },
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'price-asc', label: 'Price: Low to High' },
                  { value: 'price-desc', label: 'Price: High to Low' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm
                      font-medium transition-colors
                      ${sortBy === opt.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-gray-500">
          {filteredProducts.length === products.length
            ? `${products.length} products`
            : `${filteredProducts.length} of ${products.length} products`
          }
          {search && (
            <span> for &quot;<strong>{search}</strong>&quot;</span>
          )}
          {selectedCategory !== 'all' && (
            <span> in{' '}
              <strong>
                {categories.find(
                  c => c.id === selectedCategory
                )?.name}
              </strong>
            </span>
          )}
        </p>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48}
              className="text-gray-300 mx-auto mb-4"/>
            <p className="text-gray-500 font-medium">
              {search
                ? `No products found for "${search}"`
                : 'No products in this category'
              }
            </p>
            {(search || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="mt-4 text-purple-600
                  hover:underline text-sm font-medium">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3
            lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden
                  shadow-sm hover:shadow-md transition-shadow
                  cursor-pointer group"
                onClick={() => setSelectedProduct(product)}>
                <div className="aspect-square bg-gray-50
                  overflow-hidden relative">
                  {product.images[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover
                        group-hover:scale-105 transition-transform
                        duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex
                      items-center justify-center">
                      <Package size={32}
                        className="text-gray-300"/>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {product.discountPercentage && (
                    <div className="absolute top-2 left-2
                      px-2 py-0.5 bg-red-500 text-white text-xs
                      font-bold rounded-lg">
                      -{product.discountPercentage}%
                    </div>
                  )}

                  {/* Out of stock overlay */}
                  {product.trackInventory &&
                    product.stockQuantity === 0 && (
                    <div className="absolute inset-0 bg-black/40
                      flex items-center justify-center">
                      <span className="bg-white text-gray-700
                        text-xs font-bold px-2 py-1 rounded-lg">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-semibold text-gray-900
                    text-sm truncate mb-1">
                    {product.name}
                    {product.averageRating && product.averageRating > 0 && (
  <div className="flex items-center gap-1 mb-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        width={10}
        height={10}
        viewBox="0 0 24 24"
        className={
          star <= Math.round(product.averageRating ?? 0)
            ? 'text-amber-400 fill-amber-400'
            : 'text-gray-300 fill-gray-300'
        }>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ))}
    <span className="text-xs text-gray-400">
      ({product.reviewCount ?? 0})
    </span>
  </div>
)}
                  </h3>
                  
                  {product.categoryName && (
                    <p className="text-xs text-purple-500 mb-1">
                      {product.categoryName}
                    </p>
                  )}
                  <div className="flex items-center
                    justify-between">
                    <div>
                      <p className="font-bold text-purple-600
                        text-sm">
                        {formatPrice(product.price)}
                      </p>
                      {product.compareAtPrice && (
                        <p className="text-xs text-gray-400
                          line-through">
                          ₦{product.compareAtPrice
                            .toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!product.trackInventory ||
                          product.stockQuantity > 0) {
                          addToCart(product);
                        }
                      }}
                      disabled={
                        product.trackInventory &&
                        product.stockQuantity === 0
                      }
                      className="p-2 bg-purple-600 text-white
                        rounded-lg hover:bg-purple-700
                        disabled:bg-gray-300
                        transition-colors">
                      <Plus size={14}/>
                    </button>
                  </div>
                  {product.trackInventory &&
                    product.stockQuantity > 0 &&
                    product.stockQuantity <= 5 && (
                    <p className="text-xs text-amber-500 mt-1">
                      Only {product.stockQuantity} left!
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50
          flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg
            max-h-[90vh] overflow-y-auto">

            <div className="relative">
              {selectedProduct.images[0] && (
                <img
                  src={selectedProduct.images[0].url}
                  alt={selectedProduct.name}
                  className="w-full h-56 object-cover
                    rounded-t-2xl"
                />
              )}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-2
                  bg-white/90 backdrop-blur-sm rounded-full
                  text-gray-600 hover:bg-white shadow-md">
                <X size={18}/>
              </button>
              {selectedProduct.discountPercentage && (
                <div className="absolute top-3 left-3 px-2
                  py-1 bg-red-500 text-white text-xs
                  font-bold rounded-lg">
                  -{selectedProduct.discountPercentage}% OFF
                </div>
              )}
            </div>

            {/* Multiple images */}
            {selectedProduct.images.length > 1 && (
              <div className="flex gap-2 px-5 pt-3
                overflow-x-auto">
                {selectedProduct.images.map((img, i) => (
                  <img key={i} src={img.url}
                    alt=""
                    className="w-14 h-14 rounded-lg
                      object-cover shrink-0
                      border-2 border-gray-100
                      cursor-pointer hover:border-purple-400"/>
                ))}
              </div>
            )}

            <div className="p-5">
              {selectedProduct.categoryName && (
                <p className="text-xs text-purple-500
                  font-medium mb-1">
                  {selectedProduct.categoryName}
                </p>
              )}
              <h2 className="text-xl font-bold text-gray-900">
                {selectedProduct.name}
              </h2>


              <div className="flex items-center gap-3 mt-2">
                <p className="text-2xl font-bold
                  text-purple-600">
                  ₦{selectedProduct.price.toLocaleString()}
                </p>
                {selectedProduct.compareAtPrice && (
                  <p className="text-lg text-gray-400
                    line-through">
                    ₦{selectedProduct.compareAtPrice
                      .toLocaleString()}
                  </p>
                )}
              </div>

              {selectedProduct.description && (
                <p className="text-gray-600 text-sm mt-3
                  leading-relaxed">
                  {selectedProduct.description}
                </p>
              )}

              {selectedProduct.trackInventory && (
                <p className={`text-sm mt-2 font-medium ${
                  selectedProduct.stockQuantity === 0
                    ? 'text-red-500'
                    : selectedProduct.stockQuantity <= 5
                      ? 'text-amber-500'
                      : 'text-green-600'
                }`}>
                  {selectedProduct.stockQuantity === 0
                    ? '❌ Out of stock'
                    : selectedProduct.stockQuantity <= 5
                      ? `⚠️ Only ${selectedProduct.stockQuantity} left`
                      : '✅ In stock'
                  }
                </p>
              )}

              {selectedProduct.tags && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedProduct.tags.split(',').map(
                    (tag, i) => (
                      <span key={i}
                        className="px-2 py-0.5 bg-gray-100
                          text-gray-500 text-xs rounded-full">
                        {tag.trim()}
                      </span>
                    )
                  )}
                </div>
              )}

              {/* Shipping Estimate on Product */}
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-500
                  mb-2 flex items-center gap-1">
                  <Truck size={12}/> Check Delivery
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shippingState}
                    onChange={(e) =>
                      setShippingState(e.target.value)
                    }
                    placeholder="Enter your state e.g Lagos"
                    className="flex-1 px-3 py-2 border
                      border-gray-200 rounded-lg text-sm
                      focus:outline-none focus:ring-2
                      focus:ring-purple-500 bg-white"
                  />
                  <button
                    onClick={calculateShipping}
                    disabled={checkingShipping}
                    className="px-3 py-2 bg-purple-600 text-white
                      rounded-lg text-sm font-medium
                      hover:bg-purple-700 disabled:opacity-50
                      transition-colors">
                    {checkingShipping ? '...' : 'Check'}
                  </button>
                </div>
                {shippingEstimate && (
                  <div className="mt-2 text-sm text-gray-600">
                    {shippingEstimate.isFreeShipping ? (
                      <p className="text-green-600 font-medium">
                        ✅ Free delivery to {shippingState}!
                      </p>
                    ) : (
                      <p>
                        Delivery to {shippingState}:{' '}
                        <strong className="text-purple-600">
                          ₦{shippingEstimate.fee.toLocaleString()}
                        </strong>
                        {shippingEstimate.deliveryEstimate && (
                          <span className="text-gray-400 ml-1">
                            · {shippingEstimate.deliveryEstimate}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (!selectedProduct.trackInventory ||
                    selectedProduct.stockQuantity > 0) {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }
                }}
                disabled={
                  selectedProduct.trackInventory &&
                  selectedProduct.stockQuantity === 0
                }
                className="w-full mt-4 bg-purple-600 text-white
                  py-3.5 rounded-xl font-bold text-base
                  hover:bg-purple-700 disabled:bg-gray-300
                  transition-colors flex items-center
                  justify-center gap-2">
                <ShoppingCart size={18}/>
                Add to Cart
              </button>

<div className="px-5 pb-5 border-t border-gray-100 pt-4">
  <ReviewsSection
    productId={selectedProduct.id}
    storeSlug={slug}
  />
</div>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="mt-5 pt-4 border-t
                  border-gray-100">
                  <p className="font-bold text-gray-900 mb-3
                    text-sm">
                    Related Products
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {relatedProducts.map(related => (
                      <div
                        key={related.id}
                        onClick={() =>
                          setSelectedProduct(related)
                        }
                        className="flex gap-2 p-2 bg-gray-50
                          rounded-xl cursor-pointer
                          hover:bg-purple-50 transition-colors">
                        <div className="w-12 h-12 bg-gray-200
                          rounded-lg overflow-hidden shrink-0">
                          {related.images[0] ? (
                            <img
                              src={related.images[0].url}
                              alt={related.name}
                              className="w-full h-full
                                object-cover"
                            />
                          ) : (
                            <div className="w-full h-full
                              flex items-center justify-center">
                              <Package size={16}
                                className="text-gray-400"/>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium
                            text-gray-800 truncate">
                            {related.name}
                          </p>
                          <p className="text-xs font-bold
                            text-purple-600">
                            ₦{related.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCart(false)}/>
          <div className="relative bg-white w-full max-w-sm
            h-full flex flex-col shadow-2xl">

            <div className="flex items-center justify-between
              px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Cart ({cartCount})
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart size={40}
                    className="text-gray-300 mx-auto mb-3"/>
                  <p className="text-gray-400 text-sm">
                    Your cart is empty
                  </p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="mt-3 text-purple-600 text-sm
                      font-medium hover:underline">
                    Continue shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id}
                      className="flex gap-3 p-2 bg-gray-50
                        rounded-xl">
                      <div className="w-16 h-16 bg-gray-100
                        rounded-xl overflow-hidden shrink-0">
                        {item.product.images[0] ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-full h-full
                              object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex
                            items-center justify-center">
                            <Package size={20}
                              className="text-gray-400"/>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900
                          text-sm truncate">
                          {item.product.name}
                        </p>
                        <p className="text-purple-600
                          font-bold text-sm">
                          ₦{item.product.price.toLocaleString()}
                        </p>
                        <div className="flex items-center
                          gap-2 mt-1.5">
                          <button
                            onClick={() => updateQty(
                              item.product.id, -1
                            )}
                            className="w-7 h-7 bg-white
                              rounded-lg border border-gray-200
                              flex items-center justify-center
                              hover:bg-gray-100 text-sm font-bold">
                            −
                          </button>
                          <span className="text-sm font-bold
                            w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(
                              item.product.id, 1
                            )}
                            className="w-7 h-7 bg-white
                              rounded-lg border border-gray-200
                              flex items-center justify-center
                              hover:bg-gray-100 text-sm font-bold">
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(
                              item.product.id
                            )}
                            className="ml-auto text-red-400
                              hover:text-red-600">
                            <X size={14}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-4
                space-y-3">

                {/* Coupon Input */}
                {!couponApplied ? (
                  <div>
                    <p className="text-xs font-semibold
                      text-gray-500 mb-2 flex items-center gap-1">
                      <Tag size={11}/> Have a coupon?
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value
                            .toUpperCase())
                        }
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border
                          border-gray-200 rounded-lg text-sm
                          focus:outline-none focus:ring-2
                          focus:ring-purple-500 font-mono
                          uppercase tracking-wider"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            validateCoupon();
                        }}
                      />
                      <button
                        onClick={validateCoupon}
                        disabled={
                          !couponCode || validatingCoupon
                        }
                        className="px-3 py-2 bg-purple-600
                          text-white rounded-lg text-sm
                          font-medium hover:bg-purple-700
                          disabled:opacity-50 transition-colors">
                        {validatingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2
                    p-2 bg-green-50 rounded-xl">
                    <Tag size={14}
                      className="text-green-600 shrink-0"/>
                    <div className="flex-1">
                      <p className="text-sm font-bold
                        text-green-700">
                        {couponApplied.code}
                      </p>
                      <p className="text-xs text-green-600">
                        -₦{couponApplied.discountAmount
                          .toLocaleString()} saved
                      </p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-gray-400
                      hover:text-red-500">
                      <X size={14}/>
                    </button>
                  </div>
                )}
                {/* Order Summary */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>₦{cartSubtotal.toLocaleString()}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₦{cartDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {shippingEstimate && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Shipping</span>
                      <span>{shippingEstimate.isFreeShipping ? "FREE" : `₦${shippingFee.toLocaleString()}`}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-purple-600 text-lg">₦{cartTotal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                  <p className="text-xs text-gray-400 text-center font-medium">Choose checkout method</p>
                  <button onClick={handlePaystackPayment} className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors">
                    💳 Pay Online
                  </button>
                  <button onClick={checkoutViaWhatsApp} className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors">
                    Order via WhatsApp
                  </button>
                  <p className="text-xs text-gray-400 text-center">Pay online with card, then confirm on WhatsApp</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
