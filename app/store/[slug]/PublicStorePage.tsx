'use client';
import { useEffect, useState } from 'react';
import {
  ShoppingCart, Search, MessageCircle,
  Package,
  ChevronDown, X, Plus, Minus,
  Star, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Store, Product } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL;

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PublicStorePage({
  slug
}: { slug: string }) {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchStore();
  }, [slug]);

  const fetchStore = async () => {
    try {
      const [storeRes, productsRes] = await Promise.all([
        axios.get(`${API}/api/v1/stores/${slug}`),
        axios.get(`${API}/api/v1/products/store/${slug}`)
      ]);
      setStore(storeRes.data.data);
      setProducts(productsRes.data.data?.products ?? []);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

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
    toast.success(`${product.name} added to cart! 🛒`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(
      i => i.product.id !== productId
    ));
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      return { ...item, quantity: newQty };
    }));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity, 0
  );

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  const checkoutViaWhatsApp = () => {
    if (!store?.whatsAppNumber) {
      toast.error('Store WhatsApp not available');
      return;
    }

    const items = cart.map(item =>
      `• ${item.product.name} x${item.quantity} = ₦${
        (item.product.price * item.quantity).toLocaleString()
      }`
    ).join('\n');

    const message = encodeURIComponent(
      `Hi! I'd like to order from ${store.name}:\n\n${items}\n\n` +
      `*Total: ₦${cartTotal.toLocaleString()}*\n\n` +
      `Please confirm my order. Thank you! 🛍️`
    );

    const phone = store.whatsAppNumber
      .replace(/\D/g, '')
      .replace(/^0/, '234');

    window.open(
      `https://wa.me/${phone}?text=${message}`, '_blank'
    );
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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
            This store doesn&apos;t exist or has been removed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Store Header */}
      <header className="bg-white shadow-sm">
        {/* Banner */}
        {store.bannerUrl && (
          <div className="h-32 sm:h-48 overflow-hidden">
            <img src={store.bannerUrl} alt="Store banner"
              className="w-full h-full object-cover"/>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="w-14 h-14 bg-purple-100 rounded-xl
                flex items-center justify-center
                overflow-hidden shrink-0 shadow-sm">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name}
                    className="w-full h-full object-cover"/>
                ) : (
                  <span className="text-2xl font-bold
                    text-purple-600">
                    {store.name[0]}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {store.name}
                </h1>
                {store.description && (
                  <p className="text-sm text-gray-500 mt-0.5
                    max-w-md">
                    {store.description}
                  </p>
                )}
                {/* Social Links */}
                <div className="flex items-center gap-3 mt-1.5">
                  {store.whatsAppNumber && (
                    <a
                      href={`https://wa.me/${
                        store.whatsAppNumber
                          .replace(/\D/g, '')
                          .replace(/^0/, '234')
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1
                        text-xs text-green-600
                        hover:text-green-700">
                      <MessageCircle size={13}/>
                      WhatsApp
                    </a>
                  )}
                  {store.instagramHandle && (
                    <a
                      href={`https://instagram.com/${store.instagramHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1
                        text-xs text-pink-600
                        hover:text-pink-700">
                      <svg className="w-3.25 h-3.25" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </a>
                  )}
                  {store.facebookPageUrl && (
                    <a
                      href={`https://facebook.com/${store.facebookPageUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1
                        text-xs text-blue-600
                        hover:text-blue-700">
                      <svg className="w-3.25 h-3.25" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2
                bg-purple-600 text-white px-4 py-2.5
                rounded-xl font-medium hover:bg-purple-700
                transition-colors">
              <ShoppingCart size={18}/>
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2
                  w-5 h-5 bg-red-500 text-white text-xs
                  rounded-full flex items-center justify-center
                  font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2
            -translate-y-1/2 text-gray-400"/>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-white border
              border-gray-200 rounded-xl text-sm
              focus:outline-none focus:ring-2
              focus:ring-purple-500 shadow-sm"
          />
        </div>
      </div>

      {/* Products */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="text-gray-300
              mx-auto mb-4"/>
            <p className="text-gray-500">
              {search ? 'No products match your search'
                : 'No products available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3
            lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <div key={product.id}
                className="bg-white rounded-2xl overflow-hidden
                  shadow-sm hover:shadow-md transition-shadow
                  cursor-pointer group"
                onClick={() => setSelectedProduct(product)}>

                {/* Image */}
                <div className="aspect-square bg-gray-50
                  overflow-hidden">
                  {product.images[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover
                        group-hover:scale-105
                        transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex
                      items-center justify-center">
                      <Package size={32}
                        className="text-gray-300"/>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900
                    text-sm truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center
                    justify-between mt-2">
                    <div>
                      <p className="font-bold text-purple-600
                        text-sm">
                        ₦{product.price.toLocaleString()}
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
                        addToCart(product);
                      }}
                      disabled={product.trackInventory &&
                        product.stockQuantity === 0}
                      className="p-2 bg-purple-600 text-white
                        rounded-lg hover:bg-purple-700
                        disabled:bg-gray-300 transition-colors">
                      <Plus size={14}/>
                    </button>
                  </div>
                  {product.trackInventory &&
                    product.stockQuantity === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Out of stock
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50
          flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full
            max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {selectedProduct.images[0] && (
                <img
                  src={selectedProduct.images[0].url}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover
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

            <div className="p-5">
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
                      : `✅ In stock`
                  }
                </p>
              )}

              {selectedProduct.tags && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedProduct.tags.split(',').map(
                    (tag, i) => (
                      <span key={i} className="px-2 py-0.5
                        bg-gray-100 text-gray-500 text-xs
                        rounded-full">
                        {tag.trim()}
                      </span>
                    )
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                disabled={selectedProduct.trackInventory &&
                  selectedProduct.stockQuantity === 0}
                className="w-full mt-5 bg-purple-600 text-white
                  py-3.5 rounded-xl font-bold text-lg
                  hover:bg-purple-700 disabled:bg-gray-300
                  transition-colors flex items-center
                  justify-center gap-2">
                <ShoppingCart size={20}/>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex
          justify-end">
          <div className="absolute inset-0 bg-black/40"
            onClick={() => setShowCart(false)}/>
          <div className="relative bg-white w-full max-w-sm
            h-full flex flex-col shadow-2xl">

            {/* Cart Header */}
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

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart size={40}
                    className="text-gray-300 mx-auto mb-3"/>
                  <p className="text-gray-400 text-sm">
                    Your cart is empty
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id}
                      className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100
                        rounded-xl overflow-hidden shrink-0">
                        {item.product.images[0] ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full
                            flex items-center justify-center">
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
                        <p className="text-purple-600 font-bold
                          text-sm">
                          ₦{item.product.price.toLocaleString()}
                        </p>
                        <div className="flex items-center
                          gap-2 mt-2">
                          <button
                            onClick={() => updateQty(
                              item.product.id, -1
                            )}
                            className="w-7 h-7 bg-gray-100
                              rounded-lg flex items-center
                              justify-center hover:bg-gray-200">
                            <Minus size={12}/>
                          </button>
                          <span className="text-sm font-bold
                            w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(
                              item.product.id, 1
                            )}
                            className="w-7 h-7 bg-gray-100
                              rounded-lg flex items-center
                              justify-center hover:bg-gray-200">
                            <Plus size={12}/>
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

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-5
                space-y-4">
                <div className="flex items-center
                  justify-between">
                  <p className="font-bold text-gray-900">
                    Total
                  </p>
                  <p className="text-xl font-bold text-purple-600">
                    ₦{cartTotal.toLocaleString()}
                  </p>
                </div>

                {store.whatsAppNumber && (
                  <button
                    onClick={checkoutViaWhatsApp}
                    className="w-full bg-green-500 text-white
                      py-3.5 rounded-xl font-bold
                      hover:bg-green-600 transition-colors
                      flex items-center justify-center gap-2">
                    <MessageCircle size={18}/>
                    Order via WhatsApp
                  </button>
                )}

                <p className="text-xs text-gray-400 text-center">
                  You&apos;ll be redirected to WhatsApp to
                  complete your order
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}