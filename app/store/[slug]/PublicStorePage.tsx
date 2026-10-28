'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  ShoppingCart, Search, MessageCircle,
  Package, X, Plus, Minus, ChevronDown,
  Truck, Tag, Filter, SortAsc,
  ArrowLeft, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Store, Product, Category } from '@/types';
import { useAbandonedCart } from './useAbandonedCart';
import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import { buildPaidMessage, whatsappLink } from "@/lib/whatsapp";
import ReviewsSection from './ReviewsSection';
import {
  StoredCustomerSession,
  getStoredSession,
  clearStoredSession,
} from '@/lib/customerSession';



const API = process.env.NEXT_PUBLIC_API_URL;
const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? '';
const FLUTTERWAVE_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_KEY ?? '';

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

// A delivery option as the server sends it
interface ZoneOption {
  id: string;
  name: string;
  description?: string | null;
  fee: number;
  type: string; // FlatRate, FreeShipping, Pickup, ...
  isActive?: boolean;
  deliveryEstimate?: string | null;
  state?: string | null;
  city?: string | null;
}

const normState = (s?: string | null) => {
  const v = (s ?? '').trim().toLowerCase().replace(' state', '');
  return v === 'fct' || v === 'fct abuja' || v === 'abuja' ? 'abuja' : v;
};

// Does this delivery option serve the chosen state?
const zoneCovers = (z: ZoneOption, wanted: string) => {
  const states = (z.state ?? '')
    .split(',').map(normState).filter(Boolean);
  if (states.length > 0) return states.includes(wanted);
  const n = normState(z.name);
  if (['nationwide', 'all states', 'all'].includes(n)) return true;
  return n === wanted; // older zones are named after their state
};

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

// A quantity box you can type into. Saves when you click away or press Enter.
function QtyInput({ value, max, onChange }: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const commit = () => {
    const n = parseInt(text, 10);
    if (isNaN(n) || n < 1) {
      setText(String(value));
      return;
    }
    const clamped = Math.min(n, max);
    onChange(clamped);
    setText(String(clamped));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/\D/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      aria-label="Quantity"
      className="w-14 h-10 text-center text-sm font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
    />
  );
}

// Flutterwave reports success as "successful" or "completed"
const flutterwavePaid = (r: any) => {
  const s = String(r?.status ?? '').toLowerCase();
  if (s === 'successful' || s === 'completed' || s === 'success') return true;
  return String(r?.charge_response_code ?? '') === '00';
};

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
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [cartMode, setCartMode] = useState<'normal' | 'stockpile'>('normal');
  const [stockpileBusy, setStockpileBusy] = useState(false);
  const [stockpileInfo, setStockpileInfo] = useState<{
    isEnabled: boolean;
    maxItems?: number | null;
    maxAmount?: number | null;
    maxWeightKg?: number | null;
    holdDays?: number | null;
  } | null>(null);
  const [shippingCity, setShippingCity] = useState('');
  const [storeZones, setStoreZones] = useState<ZoneOption[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout'>('cart');
  const [modalQty, setModalQty] = useState(1);
  const [customer, setCustomer] = useState<StoredCustomerSession | null>(null);
  const [cartRestored, setCartRestored] = useState(false);
  const [paidInfo, setPaidInfo] = useState<null | {
    orderNumber?: string; reference: string; link: string;
  }>(null);

  // true when the customer chose Stockpile and the store allows it
  const stockpileMode = cartMode === 'stockpile' && !!stockpileInfo?.isEnabled;

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
    useEffect(() => {
    axios.get(`${API}/api/v1/shipping/${slug}`)
      .then(res => setStoreZones(res.data.data ?? []))
      .catch(() => setStoreZones([]));
  }, [slug]);

  
  useEffect(() => {
    axios.get(`${API}/api/v1/stockpile/public/${slug}`)
      .then(res => setStockpileInfo(res.data.data ?? null))
      .catch(() => setStockpileInfo(null));
  }, [slug]);

    // Remember who is signed in (they sign in on the account page)
  useEffect(() => {
    const s = getStoredSession(slug);
    if (s) {
      setCustomer(s);
      setCustomerInfo(prev => ({
        ...prev,
        name: prev.name || s.name,
        email: prev.email || s.email,
        phone: prev.phone || s.phone,
      }));
    }
    const q = new URLSearchParams(window.location.search);
    if (q.get('cart') === '1') setShowCart(true);
    if (q.get('stockpile') === '1') setCartMode('stockpile');
  }, [slug]);

  // Put the cart back after leaving the page, using today's prices
  useEffect(() => {
    if (cartRestored || products.length === 0) return;
    try {
      const raw = localStorage.getItem(`vnd_cart_${slug}`);
      if (raw) {
        const saved: { id: string; q: number }[] = JSON.parse(raw);
        const restored: CartItem[] = [];
        saved.forEach(s => {
          const p = products.find(x => x.id === s.id);
          if (p && s.q > 0) restored.push({ product: p, quantity: s.q });
        });
        if (restored.length > 0) setCart(restored);
      }
    } catch {}
    setCartRestored(true);
  }, [products, slug, cartRestored]);

  // Keep the cart saved
  useEffect(() => {
    if (!cartRestored) return;
    try {
      localStorage.setItem(
        `vnd_cart_${slug}`,
        JSON.stringify(cart.map(i => ({ id: i.product.id, q: i.quantity })))
      );
    } catch {}
  }, [cart, cartRestored, slug]);

  // Always start on the cart screen, and reset the product-page quantity
  useEffect(() => {
    if (!showCart || cart.length === 0) setCheckoutStep('cart');
  }, [showCart, cart.length]);

  useEffect(() => {
    setModalQty(1);
  }, [selectedProduct?.id]);


  const fetchStore = async () => {
    try {
      const [storeRes, productsRes, categoriesRes] =
        await Promise.all([
          axios.get(`${API}/api/v1/stores/${slug}`),
          axios.get(`${API}/api/v1/products/store/${slug}`),
          axios.get(`${API}/api/v1/categories/${slug}`)
        ]);
      setStore(storeRes.data.data);
      setCurrency(storeRes.data.data?.currency ?? 'NGN');
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

  // How many of this product can be bought right now
  const maxFor = (product: Product) =>
    product.trackInventory ? Math.max(product.stockQuantity, 0) : 999;

  const addToCart = (product: Product, qty: number = 1) => {
    const max = maxFor(product);
    if (max === 0) {
      toast.error('Sorry, this item is out of stock');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + qty, max) }
            : i
        );
      }
      return [...prev, { product, quantity: Math.min(qty, max) }];
    });
    toast.success(`${qty > 1 ? qty + ' × ' : ''}${product.name} added! 🛒`);
  };

  // Set an exact quantity (used by the − + buttons and the typing box)
  const setQty = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      const max = maxFor(item.product);
      return { ...item, quantity: Math.max(1, Math.min(quantity, max)) };
    }));
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
  const cityOptions = useMemo(() =>
    storeZones
      .filter(z => z.city &&
        (z.state ?? '').toLowerCase() === shippingState.toLowerCase())
      .map(z => z.city as string),
    [storeZones, shippingState]
  );

  // Delivery options for the chosen state: cheapest first, pickup last
  const shippingOptions = useMemo(() => {
    const wanted = normState(shippingState);
    if (!wanted) return [];
    return storeZones
      .filter(z => z.isActive !== false && zoneCovers(z, wanted))
      .sort((a, b) => {
        const pa = a.type === 'Pickup' ? 1 : 0;
        const pb = b.type === 'Pickup' ? 1 : 0;
        if (pa !== pb) return pa - pb;
        return a.fee - b.fee;
      });
  }, [storeZones, shippingState]);

  const selectedZone = storeZones.find(z => z.id === selectedZoneId);
  const selectedIsPickup = selectedZone?.type === 'Pickup';

    const isCheckoutReady =
    customerInfo.name.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(customerInfo.email.trim()) &&
    customerInfo.phone.replace(/\D/g, '').length >= 10 &&
        (selectedIsPickup || customerInfo.address.trim().length > 4) &&
    shippingState !== '' &&
    shippingEstimate !== null;
    
  const isStockpileReady =
    customerInfo.name.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(customerInfo.email.trim()) &&
    customerInfo.phone.replace(/\D/g, '').length >= 10;

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
          city: shippingCity || undefined,
          country: 'Nigeria'
        }
      );
      setShippingEstimate(res.data.data);
      toast.success('Shipping calculated!');
        } catch (error: any) {
      setShippingEstimate(null);
      toast.error(
        error.response?.data?.message || 'Failed to calculate shipping'
      );
    } finally {
      setCheckingShipping(false);
    }
  };

    // ── Delivery options ───────────────────────────────────
  const chooseZone = (zone: ZoneOption | null) => {
    if (!zone) {
      setSelectedZoneId('');
      setShippingEstimate(null);
      return;
    }
    const fee =
      zone.type === 'FreeShipping' || zone.type === 'Pickup'
        ? 0
        : zone.fee;
    setSelectedZoneId(zone.id);
    setShippingEstimate({
      fee,
      zoneName: zone.name,
      deliveryEstimate:
        zone.type === 'Pickup'
          ? undefined
          : zone.deliveryEstimate ?? undefined,
      isFreeShipping: fee === 0,
    });
  };

  // When the state changes, clear the choice. If there is only one
  // option, choose it for the customer.
  useEffect(() => {
    setSelectedZoneId('');
    setShippingEstimate(null);
    if (shippingOptions.length === 1) chooseZone(shippingOptions[0]);
  }, [shippingState, storeZones]);

    // ── Order details (used for Paystack and Flutterwave) ──
  const buildOrderBody = () => ({
    customerName: customerInfo.name.trim(),
    customerEmail: customerInfo.email.trim(),
    customerPhone: customerInfo.phone.trim(),
    couponCode: couponApplied?.code ?? null,
    shippingZoneId: selectedZoneId || null,
    items: cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    })),
    shippingAddress: {
      fullName: customerInfo.name.trim(),
      phoneNumber: customerInfo.phone.trim(),
            addressLine1: selectedIsPickup
        ? 'Store pickup'
        : customerInfo.address.trim(),
        city: shippingState,
      state: shippingState,
      country: 'Nigeria',
    },
  });

    // ── Save the order to the backend ──────────────────────
  // paymentMethod: 0 = Paystack, 1 = Flutterwave
  const saveOrder = async (
    paymentMethod: number,
    reference: string
  ): Promise<{ ok: boolean; orderNumber?: string }> => {
    try {
      if (paymentMethod === 0 || paymentMethod === 1) {
        // The server already holds the order details
        const res = await axios.post(
          `${API}/api/v1/payments/fulfil/${encodeURIComponent(reference)}`
        );
        return { ok: true, orderNumber: res.data?.data?.orderNumber };
      }

      await axios.post(`${API}/api/v1/orders/${slug}`, {
        ...buildOrderBody(),
        paymentMethod,
        paymentReference: reference,
      });
      return { ok: true };
    } catch (err: any) {
      console.error(
        'Order creation failed:',
        err?.response?.data ?? err
      );
      return { ok: false };
    }
  };

  // ── Runs after a successful payment ────────────────────
  const finishOrder = async (
    methodName: string,
    methodCode: number,
    reference: string
  ) => {
    const total = cartTotal;
    const itemsList = cart.map(i =>
      `${i.product.name} x${i.quantity} - N${(i.product.price * i.quantity).toLocaleString()}`
    ).join('\n');

    const saved = await saveOrder(methodCode, reference);

    const phone = store?.whatsAppNumber
      ?.replace(/\D/g, '')
      .replace(/^0/, '234');

    const msg = encodeURIComponent(
      `Hi! I just paid for my order at *${store?.name}*\n\n` +
      (saved.orderNumber ? `*Order number:* ${saved.orderNumber}\n` : '') +
      `*Name:* ${customerInfo.name}\n` +
      `*Delivery:* ${customerInfo.address}, ${shippingState}\n\n` +
      `*Items:*\n${itemsList}\n\n` +
      `*Total Paid: N${total.toLocaleString()}*\n` +
      `*${methodName} reference:* ${reference}\n\n` +
      `Please confirm my order. Thank you!`
    );

    clearAbandonedCart();
    setShowCart(false);
    setShowPaymentOptions(false);
    setCart([]);
    setCouponApplied(null);

    if (saved.ok) {
      toast.success(
        saved.orderNumber
          ? `Payment successful! Your order number is ${saved.orderNumber}.`
          : 'Payment successful! Your order has been placed.',
        { duration: 8000 }
      );
    } else {
      toast.error(
        `Payment received, but we could not record your order yet. If it does not appear soon, please send reference ${reference} to the store on WhatsApp.`,
        { duration: 10000 }
      );
    }

    if (phone) {
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }
  };

   // ── Paystack ───────────────────────────────────────────
  const handlePaystackPayment = async () => {
    if (cart.length === 0) return;
    if (!isCheckoutReady) {
      toast.error('Please fill in your details and choose your state first');
      return;
    }

    const paystackKey = PAYSTACK_KEY;
    const itemsList = cart.map(i =>
      `${i.product.name} x${i.quantity}`
    ).join(', ');

    // 1. Tell the server about this order BEFORE the customer pays,
    //    so it can still record the order if the browser closes.
    let reference = '';
    try {
      const res = await axios.post(
        `${API}/api/v1/payments/intent/${slug}`,
        { kind: 'Order', payload: buildOrderBody() }
      );
      reference = res.data.data.reference;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        'Could not start the payment. Please try again.'
      );
      return;
    }

    // 2. Open Paystack using the server's reference
    await new Promise<void>((resolve) => {
      if ((window as any).PaystackPop) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

    const handler = (window as any).PaystackPop.setup({
      key: paystackKey,
      email: customerInfo.email.trim(),
      amount: Math.round(cartTotal * 100),
      currency: 'NGN',
      ref: reference,
      metadata: {
        store: store?.name,
        customer: customerInfo.name,
        items: itemsList,
      },
      callback: function (response: any) {
        finishOrder('Paystack', 0, reference);
      },
      onClose: function () {
        toast.error('Payment cancelled');
      },
    });
    handler.openIframe();
  };
  
  // ── Flutterwave ────────────────────────────────────────
  const handleFlutterwavePayment = async () => {
    if (cart.length === 0) return;
    if (!isCheckoutReady) {
      toast.error('Please fill in your details and choose your state first');
      return;
    }

    const flwKey = 'FLWPUBK_TEST-1e289717a1d2fa62557cfc173631bd5f-X';

    // 1. Tell the server about this order BEFORE the customer pays,
    //    so it can still record the order if the browser closes.
    let reference = '';
    try {
      const res = await axios.post(
        `${API}/api/v1/payments/intent/${slug}`,
        { kind: 'Order', payload: { ...buildOrderBody(), paymentMethod: 1 } }
      );
      reference = res.data.data.reference;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        'Could not start the payment. Please try again.'
      );
      return;
    }

    // 2. Open Flutterwave using the server's reference
    await new Promise<void>((resolve) => {
      if ((window as any).FlutterwaveCheckout) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

    let finished = false;
    const modal = (window as any).FlutterwaveCheckout({
      public_key: flwKey,
      tx_ref: reference,
      amount: cartTotal,
      currency: 'NGN',
      payment_options: 'card,mobilemoney,ussd,banktransfer',
      customer: {
        email: customerInfo.email.trim(),
        name: customerInfo.name.trim(),
        phone_number: customerInfo.phone.trim(),
      },
      customizations: {
        title: store?.name ?? 'Vendify Store',
        description: `Order from ${store?.name}`,
        logo: store?.logoUrl ?? '',
      },
      callback: function (response: any) {
        console.log('Flutterwave callback', response);
        if (finished) return;
        if (!flutterwavePaid(response)) {
          toast.error('The payment was not completed.');
          return;
        }
        finished = true;
        // Flutterwave never closes its own window, so we do it
        setTimeout(() => {
          try { modal?.close?.(); } catch {}
        }, 1500);
        finishOrder('Flutterwave', 1, reference);
      },
      onclose: function () {
        if (!finished) toast('Payment window closed');
      },
    });
  };

   // ── Stockpile (needs a signed-in customer) ─────────────
  // paymentMethod: 0 = Paystack, 1 = Flutterwave
  const stockpileItems = () =>
    cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

  const isSessionError = (error: any) =>
    error?.response?.status === 401 ||
    /session has expired/i.test(error?.response?.data?.message ?? '');

  const handleSessionExpired = () => {
    clearStoredSession(slug);
    setCustomer(null);
    toast.error('Your session has expired. Please sign in again.');
  };

  // Asks the server BEFORE payment if the limits allow this
  const checkStockpile = async (): Promise<boolean> => {
    try {
      await axios.post(`${API}/api/v1/stockpile/check/${slug}`, {
        token: customer?.token ?? '',
        items: stockpileItems(),
      });
      return true;
    } catch (error: any) {
      if (isSessionError(error)) {
        handleSessionExpired();
        return false;
      }
      toast.error(
        error.response?.data?.message ||
        'Could not check your stockpile. Please try again.',
        { duration: 7000 }
      );
      return false;
    }
  };

    const finishStockpile = async (
    paymentMethod: number,
    reference: string
  ) => {
    const amount = cartSubtotal;
    const itemsForMsg = cart.map(i => ({
      name: i.product.name,
      qty: i.quantity,
    }));

    let ok = false;
    let message = '';
    try {
      let res: any;
            if (paymentMethod === 0 || paymentMethod === 1) {
        // Paystack: the server already holds the stockpile details
        res = await axios.post(
          `${API}/api/v1/payments/fulfil/${encodeURIComponent(reference)}`
        );
      } else {
        res = await axios.post(
          `${API}/api/v1/stockpile/deposit/${slug}`,
          {
            token: customer?.token ?? '',
            paymentMethod,
            paymentReference: reference,
            items: stockpileItems(),
          }
        );
      }
      ok = true;
      message = res.data?.message || 'Added to your stockpile!';
    } catch (err: any) {
      console.error(
        'Stockpile deposit failed:',
        err?.response?.data ?? err
      );
      message = err?.response?.data?.message || '';
    }

    setShowCart(false);
    setCart([]);
    setCartMode('normal');

    if (ok) {
      toast.success(message, { duration: 8000 });
      setPaidInfo({
        reference,
        link: whatsappLink(
          store?.whatsAppNumber ?? '',
          buildPaidMessage({
            storeName: store?.name ?? 'the store',
            reference,
            amount,
            isStockpile: true,
            items: itemsForMsg,
          })
        ),
      });
    } else {
      toast.error(
        `Payment received, but we could not add it to your stockpile yet. ${message} ` +
        `If it does not appear soon, send reference ${reference} to the store.`,
        { duration: 12000 }
      );
    }
  };

  const handleStockpilePaystack = async () => {
    if (cart.length === 0 || !customer) return;

    setStockpileBusy(true);
    const allowed = await checkStockpile();
    if (!allowed) {
      setStockpileBusy(false);
      return;
    }

    // Tell the server about this deposit BEFORE the customer pays
    let reference = '';
    try {
      const res = await axios.post(
        `${API}/api/v1/payments/intent/${slug}`,
        {
          kind: 'StockpileDeposit',
          payload: { token: customer.token, items: stockpileItems() },
        }
      );
      reference = res.data.data.reference;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        'Could not start the payment. Please try again.'
      );
      setStockpileBusy(false);
      return;
    }
    setStockpileBusy(false);

    const paystackKey = PAYSTACK_KEY;

    await new Promise<void>((resolve) => {
      if ((window as any).PaystackPop) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

    const handler = (window as any).PaystackPop.setup({
      key: paystackKey,
      email: customer.email,
      amount: Math.round(cartSubtotal * 100),
      currency: 'NGN',
      ref: reference,
      metadata: {
        store: store?.name,
        customer: customer.name,
        type: 'stockpile',
      },
      callback: function (response: any) {
        finishStockpile(0, reference);
      },
      onClose: function () {
        toast.error('Payment cancelled');
      },
    });
    handler.openIframe();
  };

  
    const handleStockpileFlutterwave = async () => {
    if (cart.length === 0 || !customer) return;

    setStockpileBusy(true);
    const allowed = await checkStockpile();
    if (!allowed) {
      setStockpileBusy(false);
      return;
    }

    // Tell the server about this deposit BEFORE the customer pays
    let reference = '';
    try {
      const res = await axios.post(
        `${API}/api/v1/payments/intent/${slug}`,
        {
          kind: 'StockpileDeposit',
          payload: {
            token: customer.token,
            items: stockpileItems(),
            paymentMethod: 1,
          },
        }
      );
      reference = res.data.data.reference;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        'Could not start the payment. Please try again.'
      );
      setStockpileBusy(false);
      return;
    }
    setStockpileBusy(false);

    const flwKey = 'FLWPUBK_TEST-1e289717a1d2fa62557cfc173631bd5f-X';

    await new Promise<void>((resolve) => {
      if ((window as any).FlutterwaveCheckout) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

    let finished = false;
    const modal = (window as any).FlutterwaveCheckout({
      public_key: flwKey,
      tx_ref: reference,
      amount: cartSubtotal,
      currency: 'NGN',
      payment_options: 'card,mobilemoney,ussd,banktransfer',
      customer: {
        email: customer.email,
        name: customer.name,
        phone_number: customer.phone,
      },
      customizations: {
        title: store?.name ?? 'Vendify Store',
        description: `Stockpile payment to ${store?.name}`,
        logo: store?.logoUrl ?? '',
      },
      callback: function (response: any) {
        console.log('Flutterwave callback', response);
        if (finished) return;
        if (!flutterwavePaid(response)) {
          toast.error('The payment was not completed.');
          return;
        }
        finished = true;
        setTimeout(() => {
          try { modal?.close?.(); } catch {}
        }, 1500);
        finishStockpile(1, reference);
      },
      onclose: function () {
        if (!finished) toast('Payment window closed');
      },
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

            <div className="max-w-6xl mx-auto px-4 pt-4">
        <a href={`/store/${slug}/account`}
          className="flex items-center justify-between gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-800 hover:bg-purple-100 transition-colors">
          <span>
            {customer
              ? `👋 Hi, ${customer.name.split(' ')[0]}`
              : stockpileInfo?.isEnabled
                ? '📦 Stockpile items and track your orders with an account'
                : '👤 Track your orders with an account'}
          </span>
          <span className="font-semibold shrink-0">
            {customer ? 'My account →' : 'Sign in / Create account →'}
          </span>
        </a>
      </div>

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
                  {formatPrice(selectedProduct.price)}
                </p>
                {selectedProduct.compareAtPrice && (
                  <p className="text-lg text-gray-400
                    line-through">
                   {formatPrice(selectedProduct.compareAtPrice)}
                     
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

                           {/* Delivery costs */}
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-500
                  mb-2 flex items-center gap-1">
                  <Truck size={12}/> Check Delivery
                </p>
                <select
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select your state</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {shippingState && (
                  <div className="mt-2 text-sm text-gray-600">
                    {shippingOptions.length === 0 ? (
                      <p className="text-amber-600">
                        Sorry, this store does not deliver to {shippingState} yet.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {shippingOptions.map(opt => {
                          const fee =
                            opt.type === 'FreeShipping' || opt.type === 'Pickup'
                              ? 0
                              : opt.fee;
                          return (
                            <li key={opt.id} className="flex justify-between gap-3">
                              <span className="min-w-0">{opt.name}</span>
                              <strong className="text-purple-600 shrink-0">
                                {fee === 0 ? 'FREE' : `₦${fee.toLocaleString()}`}
                              </strong>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

                           {maxFor(selectedProduct) > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Quantity</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setModalQty(q => Math.max(1, q - 1))}
                      disabled={modalQty <= 1}
                      aria-label="Decrease quantity"
                      className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40">
                      <Minus size={16}/>
                    </button>
                    <QtyInput
                      value={modalQty}
                      max={maxFor(selectedProduct)}
                      onChange={setModalQty}
                    />
                    <button
                      type="button"
                      onClick={() => setModalQty(q =>
                        Math.min(maxFor(selectedProduct), q + 1)
                      )}
                      disabled={modalQty >= maxFor(selectedProduct)}
                      aria-label="Increase quantity"
                      className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40">
                      <Plus size={16}/>
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (maxFor(selectedProduct) > 0) {
                    addToCart(selectedProduct, modalQty);
                    setSelectedProduct(null);
                  }
                }}
                disabled={maxFor(selectedProduct) === 0}
                className="w-full mt-4 bg-purple-600 text-white
                  py-3.5 rounded-xl font-bold text-base
                  hover:bg-purple-700 disabled:bg-gray-300
                  transition-colors flex items-center
                  justify-center gap-2">
                <ShoppingCart size={18}/>
                {maxFor(selectedProduct) === 0
                  ? 'Out of stock'
                  : `Add ${modalQty > 1 ? modalQty + ' ' : ''}to Cart · ₦${(selectedProduct.price * modalQty).toLocaleString()}`}
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
          <div className="relative bg-white w-full sm:max-w-xl h-full flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {checkoutStep === 'checkout' && (
                  <button
                    onClick={() => setCheckoutStep('cart')}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
                    aria-label="Back to cart">
                    <ArrowLeft size={18}/>
                  </button>
                )}
                <h2 className="text-lg font-bold text-gray-900">
                  {checkoutStep === 'cart'
                    ? `Cart (${cartCount})`
                    : stockpileMode ? 'Stockpile payment' : 'Checkout'}
                </h2>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18}/>
              </button>
            </div>

            {/* ═══ SCREEN 1: THE ITEMS ═══ */}
            {checkoutStep === 'cart' && (
              <>
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
                        className="mt-3 text-purple-600 text-sm font-medium hover:underline">
                        Continue shopping
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => {
                        const max = maxFor(item.product);
                        return (
                          <div key={item.product.id}
                            className="flex gap-4 p-3 bg-gray-50 rounded-2xl">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                              {item.product.images[0] ? (
                                <img
                                  src={item.product.images[0].url}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={28} className="text-gray-400"/>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-gray-900 text-sm sm:text-base leading-snug">
                                  {item.product.name}
                                </p>
                                <button
                                  onClick={() => removeFromCart(item.product.id)}
                                  aria-label="Remove item"
                                  className="p-1.5 text-gray-400 hover:text-red-500">
                                  <Trash2 size={16}/>
                                </button>
                              </div>
                              <p className="text-purple-600 font-bold text-sm">
                                {formatPrice(item.product.price)}
                              </p>

                              <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setQty(item.product.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    aria-label="Decrease quantity"
                                    className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40">
                                    <Minus size={16}/>
                                  </button>
                                  <QtyInput
                                    value={item.quantity}
                                    max={max}
                                    onChange={(n) => setQty(item.product.id, n)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setQty(item.product.id, item.quantity + 1)}
                                    disabled={item.quantity >= max}
                                    aria-label="Increase quantity"
                                    className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40">
                                    <Plus size={16}/>
                                  </button>
                                </div>
                                <p className="font-bold text-gray-900">
                                  {formatPrice(item.product.price * item.quantity)}
                                </p>
                              </div>

                              {item.product.trackInventory && item.quantity >= max && (
                                <p className="text-xs text-amber-600 mt-1">
                                  Only {max} available
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-gray-100 p-4 space-y-3">
                    <div className="flex justify-between text-base font-bold text-gray-900">
                      <span>Subtotal</span>
                      <span className="text-purple-600">
                        {formatPrice(cartSubtotal)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Shipping and discounts are worked out on the next screen. Other currencies are approximate. You are charged in Naira (₦).
                    </p>

                    {stockpileInfo?.isEnabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setCartMode('normal')}
                          className={`p-3 rounded-xl border-2 text-left transition-colors ${
                            !stockpileMode
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white'}`}>
                          <span className="block font-semibold text-sm text-gray-900">
                            Checkout now
                          </span>
                          <span className="block text-xs text-gray-500">
                            Pay and get it delivered
                          </span>
                        </button>
                        <button
                          onClick={() => setCartMode('stockpile')}
                          className={`p-3 rounded-xl border-2 text-left transition-colors ${
                            stockpileMode
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white'}`}>
                          <span className="block font-semibold text-sm text-gray-900">
                            Stockpile
                          </span>
                          <span className="block text-xs text-gray-500">
                            Pay now, ship later
                          </span>
                        </button>
                      </div>
                    )}

                    {stockpileMode && !customer ? (
                      <div className="p-3 bg-purple-50 rounded-xl space-y-2">
                        <p className="text-sm font-semibold text-purple-900">
                          Create an account to stockpile
                        </p>
                        <p className="text-xs text-purple-800">
                          Your stockpile is kept in your account, so you can see
                          it, add to it and check it out whenever you like.
                          Your cart will be waiting when you come back.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={`/store/${slug}/account?mode=signup&next=cart-stockpile`}
                            className="text-center bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700">
                            Create account
                          </a>
                          <a
                            href={`/store/${slug}/account?mode=signin&next=cart-stockpile`}
                            className="text-center border border-purple-300 text-purple-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-100">
                            Sign in
                          </a>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCheckoutStep('checkout')}
                        className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors">
                        {stockpileMode
                          ? 'Continue to stockpile payment'
                          : 'Continue to checkout'}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ═══ SCREEN 2: CHECKOUT ═══ */}
            {checkoutStep === 'checkout' && cart.length > 0 && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* Small summary of what is being bought */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {cart.map((item) => (
                      <div key={item.product.id}
                        className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {item.product.images[0] ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={16} className="text-gray-400"/>
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-1 rounded-tl-md">
                          ×{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {cartCount} item{cartCount !== 1 ? 's' : ''} · ₦{cartSubtotal.toLocaleString()}
                  </p>
                </div>

                {stockpileMode ? (
                  /* ─── STOCKPILE PAYMENT ─── */
                  !customer ? (
                    <div className="p-3 bg-purple-50 rounded-xl space-y-2">
                      <p className="text-sm font-semibold text-purple-900">
                        Please sign in to stockpile
                      </p>
                      <a
                        href={`/store/${slug}/account?mode=signin&next=cart-stockpile`}
                        className="block text-center bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700">
                        Sign in
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-800 space-y-1">
                        <p className="font-semibold">How stockpile works</p>
                        <p>
                          Pay for your items now with no shipping fee. We keep
                          them safe for you. When you are ready, check out your
                          stockpile from your account and pay shipping once to
                          receive everything together.
                        </p>
                        <p>
                          Stockpile limit:{' '}
                          {[
                            stockpileInfo?.maxItems ? `${stockpileInfo.maxItems} items` : null,
                            stockpileInfo?.maxAmount ? `₦${stockpileInfo.maxAmount.toLocaleString()}` : null,
                            stockpileInfo?.maxWeightKg ? `${stockpileInfo.maxWeightKg} kg` : null,
                          ].filter(Boolean).join(' or ')}
                          {stockpileInfo?.holdDays
                            ? `. Held for up to ${stockpileInfo.holdDays} days.`
                            : '.'}
                        </p>
                      </div>

                      <div className="p-3 border border-gray-200 rounded-xl text-sm text-gray-600">
                        Signed in as <strong>{customer.name}</strong>
                        <span className="block text-xs text-gray-400">{customer.email}</span>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-gray-100">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Items</span>
                          <span>₦{cartSubtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Shipping</span>
                          <span>Pay when you check out</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
                          <span>Pay now</span>
                          <span className="text-purple-600 text-lg">
                            ₦{cartSubtotal.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Coupons are not available for stockpile yet.
                        </p>
                      </div>

                      <button
                        onClick={handleStockpilePaystack}
                        disabled={stockpileBusy}
                        className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {stockpileBusy ? 'Checking...' : 'Pay with Paystack'}
                      </button>
                      <button
                        onClick={handleStockpileFlutterwave}
                        disabled={stockpileBusy}
                        className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {stockpileBusy ? 'Checking...' : 'Pay with Flutterwave'}
                      </button>
                    </>
                  )
                ) : (
                  /* ─── NORMAL CHECKOUT ─── */
                  <>
                    {/* Coupon Input */}
                    {!couponApplied ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                          <Tag size={11}/> Have a coupon?
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) =>
                              setCouponCode(e.target.value.toUpperCase())
                            }
                            placeholder="Enter code"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono uppercase tracking-wider"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') validateCoupon();
                            }}
                          />
                          <button
                            onClick={validateCoupon}
                            disabled={!couponCode || validatingCoupon}
                            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
                            {validatingCoupon ? '...' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-xl">
                        <Tag size={14} className="text-green-600 shrink-0"/>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-green-700">
                            {couponApplied.code}
                          </p>
                          <p className="text-xs text-green-600">
                            -₦{couponApplied.discountAmount.toLocaleString()} saved
                          </p>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-gray-400 hover:text-red-500">
                          <X size={14}/>
                        </button>
                      </div>
                    )}

                    {/* Delivery Details */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        <Truck size={11}/> Your delivery details
                      </p>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Delivery address"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                                            <select
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select your state</option>
                        {NIGERIAN_STATES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      {shippingState && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-semibold text-gray-500">
                            Choose your delivery option
                          </p>
                          {shippingOptions.length === 0 ? (
                            <p className="text-xs text-amber-600">
                              Sorry, this store does not deliver to {shippingState} yet.
                            </p>
                          ) : (
                            shippingOptions.map(opt => {
                              const isPickup = opt.type === 'Pickup';
                              const fee =
                                opt.type === 'FreeShipping' || isPickup
                                  ? 0
                                  : opt.fee;
                              const selected = selectedZoneId === opt.id;
                              return (
                                <label
                                  key={opt.id}
                                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                                    selected
                                      ? 'border-purple-500 bg-purple-50'
                                      : 'border-gray-200 bg-white hover:border-purple-300'
                                  }`}>
                                  <input
                                    type="radio"
                                    name="delivery-option"
                                    checked={selected}
                                    onChange={() => chooseZone(opt)}
                                    className="mt-1 accent-purple-600"
                                  />
                                  <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium text-gray-900">
                                      {opt.name}
                                    </span>
                                    {opt.description && (
                                      <span className="block text-xs text-gray-500">
                                        {opt.description}
                                      </span>
                                    )}
                                    {!isPickup && opt.deliveryEstimate && (
                                      <span className="block text-xs text-gray-400">
                                        {opt.deliveryEstimate}
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-sm font-bold text-purple-600 shrink-0">
                                    {fee === 0 ? 'FREE' : `₦${fee.toLocaleString()}`}
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

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
                          <span>
                            {shippingEstimate.isFreeShipping
                              ? 'FREE'
                              : `₦${shippingFee.toLocaleString()}`}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
                        <span>Total</span>
                        <span className="text-purple-600 text-lg">
                          ₦{cartTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Payment */}
                    <div className="space-y-3">
                      {!isCheckoutReady && (
                        <p className="text-xs text-amber-700 text-center bg-amber-50 rounded-lg py-2 px-3">
                          Fill in your details and pick your state to continue
                        </p>
                      )}
                      <p className="text-xs text-gray-400 text-center font-medium">
                        Choose checkout method
                      </p>

                      {!showPaymentOptions ? (
                        <button
                          onClick={() => setShowPaymentOptions(true)}
                          disabled={!isCheckoutReady}
                          className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          💳 Pay Online
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 text-center">
                            Select a payment option
                          </p>
                          <button
                            onClick={handlePaystackPayment}
                            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors">
                            Pay with Paystack
                          </button>
                          <button
                            onClick={handleFlutterwavePayment}
                            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors">
                            Pay with Flutterwave
                          </button>
                          <button
                            onClick={() => setShowPaymentOptions(false)}
                            className="w-full text-xs text-gray-500 hover:underline">
                            ← Back
                          </button>
                        </div>
                      )}

                      <button
                        onClick={checkoutViaWhatsApp}
                        className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors">
                        Order via WhatsApp
                      </button>
                      <p className="text-xs text-gray-400 text-center">
                        Pay online with card, then confirm on WhatsApp
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <PaymentSuccessModal
        open={!!paidInfo}
        onClose={() => setPaidInfo(null)}
        link={paidInfo?.link ?? ""}
        orderNumber={paidInfo?.orderNumber}
        reference={paidInfo?.reference ?? ""}
      />
    </div>
  );
}
