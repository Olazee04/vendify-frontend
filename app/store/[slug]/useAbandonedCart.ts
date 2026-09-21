import { useEffect, useRef } from 'react';

interface CartItem {
  product: { id: string; name: string; price: number };
  quantity: number;
}

interface AbandonedCartProps {
  cart: CartItem[];
  storeSlug: string;
  storeName: string;
  whatsAppNumber: string;
}

export function useAbandonedCart({
  cart,
  storeSlug,
  storeName,
  whatsAppNumber,
}: AbandonedCartProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownRef = useRef(false);

  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Don't show if cart is empty or already shown
    if (cart.length === 0 || hasShownRef.current) return;

    // Save cart to sessionStorage
    sessionStorage.setItem(
      `vendify_cart_${storeSlug}`,
      JSON.stringify({
        cart,
        timestamp: Date.now(),
        storeName,
        whatsAppNumber,
      })
    );

    // Set 1 hour timer (for demo: 30 seconds)
    // Change 30000 to 3600000 for real 1 hour
    timerRef.current = setTimeout(() => {
      if (cart.length > 0 && !hasShownRef.current) {
        showAbandonedCartReminder();
        hasShownRef.current = true;
      }
    }, 30000); // 30 seconds for demo

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [cart]);

  const showAbandonedCartReminder = () => {
    if (!whatsAppNumber || cart.length === 0) return;

    const total = cart.reduce(
      (sum, item) =>
        sum + item.product.price * item.quantity, 0
    );

    const items = cart.map(
      item => `${item.product.name} x${item.quantity}`
    ).join(', ');

    const message = encodeURIComponent(
      `Hi! You left these items in your cart at ` +
      `*${storeName}*:\n\n${items}\n\n` +
      `*Total: ₦${total.toLocaleString()}*\n\n` +
      `Complete your order here: ` +
      `${window.location.href}\n\n` +
      `Need help? Reply to this message! 😊`
    );

    const phone = whatsAppNumber
      .replace(/\D/g, '').replace(/^0/, '234');

    // Show browser notification
    if ('Notification' in window &&
      Notification.permission === 'granted') {
      new Notification(`${storeName} — Don't forget!`, {
        body: `You have ${cart.length} item(s) in your cart`,
        icon: '/favicon.ico',
      });
    }

    // Show in-page banner
    const banner = document.createElement('div');
    banner.id = 'abandoned-cart-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 16px 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        z-index: 9999;
        max-width: 380px;
        width: 90%;
        animation: slideUp 0.3s ease;
      ">
        <style>
          @keyframes slideUp {
            from { transform: translateX(-50%)
              translateY(100%); opacity: 0; }
            to { transform: translateX(-50%)
              translateY(0); opacity: 1; }
          }
        </style>
        <div style="display:flex;align-items:center;
          justify-content:space-between;margin-bottom:8px">
          <p style="font-weight:700;font-size:15px;
            color:#111827;margin:0">
            🛒 Still interested?
          </p>
          <button onclick="document.getElementById(
            'abandoned-cart-banner').remove()"
            style="background:none;border:none;
              cursor:pointer;font-size:18px;color:#9ca3af;
              padding:0;line-height:1">
            ×
          </button>
        </div>
        <p style="font-size:13px;color:#6b7280;margin:0 0 12px">
          You left ${cart.length} item(s) worth
          ₦${total.toLocaleString()} in your cart!
        </p>
        <a href="https://wa.me/${phone}?text=${message}"
          target="_blank"
          style="display:flex;align-items:center;
            justify-content:center;gap:8px;width:100%;
            padding:12px;background:#22c55e;color:white;
            text-decoration:none;border-radius:10px;
            font-weight:700;font-size:14px">
          💬 Complete order on WhatsApp
        </a>
      </div>
    `;
    document.body.appendChild(banner);

    // Auto remove after 10 seconds
    setTimeout(() => {
      const el = document.getElementById(
        'abandoned-cart-banner'
      );
      if (el) el.remove();
    }, 10000);
  };

  // Clear cart recovery on checkout
  const clearAbandonedCart = () => {
    sessionStorage.removeItem(
      `vendify_cart_${storeSlug}`
    );
    hasShownRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return { clearAbandonedCart };
}