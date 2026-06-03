'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Package, MapPin, Phone,
  Mail, CreditCard, Truck, CheckCircle,
  Clock, XCircle, RefreshCw, Copy,
  MessageCircle, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Order } from '@/types';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showTracking, setShowTracking] = useState(false);

  useEffect(() => {
    if (params.id) fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${params.id}`);
      setOrder(res.data.data);
      setTrackingNumber(res.data.data?.trackingNumber ?? '');
    } catch {
      toast.error('Order not found');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    status: number,
    label: string,
    tracking?: string
  ) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${params.id}/status`, {
        status,
        trackingNumber: tracking || undefined,
      });
      toast.success(`Order marked as ${label} ✅`);
      fetchOrder();
      setShowTracking(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm(
      'Cancel this order? Stock will be restored.'
    )) return;
    setUpdating(true);
    try {
      await api.put(`/orders/${params.id}/cancel`);
      toast.success('Order cancelled');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message
        || 'Cannot cancel this order');
    } finally {
      setUpdating(false);
    }
  };

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber);
      toast.success('Order number copied!');
    }
  };

  const whatsAppCustomer = () => {
    if (!order) return;
    const phone = order.customerPhone
      .replace(/\D/g, '')
      .replace(/^0/, '234');
    const msg = encodeURIComponent(
      `Hi ${order.customerName}! Your order *${order.orderNumber}* ` +
      `status has been updated to *${order.status}*.\n\n` +
      `${order.trackingNumber
        ? `Tracking Number: ${order.trackingNumber}`
        : ''
      }\n\nThank you for shopping with us! 🛍️`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl
            border border-gray-100 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  if (!order) return null;

  const statusConfig = {
    Pending: {
      color: 'bg-amber-100 text-amber-700',
      icon: Clock,
      step: 0
    },
    Confirmed: {
      color: 'bg-blue-100 text-blue-700',
      icon: CheckCircle,
      step: 1
    },
    Processing: {
      color: 'bg-purple-100 text-purple-700',
      icon: RefreshCw,
      step: 2
    },
    Shipped: {
      color: 'bg-indigo-100 text-indigo-700',
      icon: Truck,
      step: 3
    },
    Delivered: {
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle,
      step: 4
    },
    Cancelled: {
      color: 'bg-red-100 text-red-700',
      icon: XCircle,
      step: -1
    },
  };

  const paymentConfig = {
    Unpaid: 'bg-red-100 text-red-600',
    Paid: 'bg-green-100 text-green-600',
    Failed: 'bg-gray-100 text-gray-600',
    Refunded: 'bg-orange-100 text-orange-600',
  };

  const currentStatus = statusConfig[
    order.status as keyof typeof statusConfig
  ] ?? statusConfig.Pending;

  const StatusIcon = currentStatus.icon;

  const steps = [
    'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/orders"
            className="p-2 rounded-xl hover:bg-gray-100
              transition-colors text-gray-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {order.orderNumber}
              </h1>
              <button
                onClick={copyOrderNumber}
                className="p-1 text-gray-400
                  hover:text-purple-600 transition-colors">
                <Copy size={14} />
              </button>
            </div>
            <p className="text-gray-500 text-sm">
              {new Date(order.createdAt).toLocaleDateString(
                'en-NG', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }
              )}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {order.customerPhone && (
            <button
              onClick={whatsAppCustomer}
              className="flex items-center gap-2 px-3 py-2
                bg-green-50 text-green-600 rounded-xl text-sm
                font-medium hover:bg-green-100 transition-colors">
              <MessageCircle size={15} />
              <span className="hidden sm:inline">
                WhatsApp
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Status + Payment Badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`flex items-center gap-2 px-3 py-1.5
          rounded-full text-sm font-semibold
          ${currentStatus.color}`}>
          <StatusIcon size={14} />
          {order.status}
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm
          font-semibold ${
            paymentConfig[
              order.paymentStatus as keyof typeof paymentConfig
            ] ?? 'bg-gray-100 text-gray-600'
          }`}>
          💳 {order.paymentStatus}
        </div>
        {order.paymentMethod && (
          <div className="px-3 py-1.5 bg-gray-100 text-gray-600
            rounded-full text-sm font-medium">
            {order.paymentMethod}
          </div>
        )}
      </div>

      {/* Order Progress Bar */}
      {order.status !== 'Cancelled' && (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-5 text-sm">
            Order Progress
          </h3>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-4 right-4
              h-0.5 bg-gray-200">
              <div
                className="h-full bg-purple-500 transition-all
                  duration-500"
                style={{
                  width: `${Math.max(
                    0,
                    (currentStatus.step / 4) * 100
                  )}%`
                }}
              />
            </div>

            {/* Steps */}
            <div className="flex items-start justify-between
              relative">
              {steps.map((step, index) => {
                const isComplete =
                  currentStatus.step >= index;
                const isCurrent =
                  currentStatus.step === index;

                return (
                  <div key={step}
                    className="flex flex-col items-center
                      gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full
                      flex items-center justify-center
                      border-2 transition-all z-10
                      ${isComplete
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-white border-gray-300'
                      } ${isCurrent
                        ? 'ring-4 ring-purple-100'
                        : ''
                      }`}>
                      {isComplete && (
                        <CheckCircle size={14}
                          className="text-white" />
                      )}
                    </div>
                    <p className={`text-xs font-medium
                      text-center ${
                        isCurrent
                          ? 'text-purple-600'
                          : isComplete
                            ? 'text-gray-700'
                            : 'text-gray-400'
                      }`}>
                      {step}
                    </p>
                    {step === 'Shipped' &&
                      order.shippedAt && (
                      <p className="text-xs text-gray-400">
                        {new Date(order.shippedAt)
                          .toLocaleDateString()}
                      </p>
                    )}
                    {step === 'Delivered' &&
                      order.deliveredAt && (
                      <p className="text-xs text-gray-400">
                        {new Date(order.deliveredAt)
                          .toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Order Items */}
          <div className="bg-white rounded-2xl border
            border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">
              Order Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id}
                  className="flex items-center gap-3 p-3
                    bg-gray-50 rounded-xl">
                  <div className="w-14 h-14 bg-white rounded-xl
                    overflow-hidden flex-shrink-0 border
                    border-gray-100">
                    {item.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex
                        items-center justify-center">
                        <Package size={20}
                          className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900
                      text-sm truncate">
                      {item.productName}
                    </p>
                    {item.variantInfo && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.variantInfo}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      ₦{item.unitPrice.toLocaleString()} each
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 text-sm">
                      ₦{item.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100
              space-y-2">
              <div className="flex justify-between
                text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₦{order.subtotal.toLocaleString()}</span>
              </div>
              {order.shippingFee > 0 && (
                <div className="flex justify-between
                  text-sm text-gray-500">
                  <span>Shipping</span>
                  <span>
                    ₦{order.shippingFee.toLocaleString()}
                  </span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between
                  text-sm text-green-600">
                  <span>
                    Discount{order.couponCode
                      ? ` (${order.couponCode})` : ''}
                  </span>
                  <span>
                    -₦{order.discount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between
                font-bold text-gray-900 pt-2 border-t
                border-gray-100">
                <span>Total</span>
                <span className="text-purple-600 text-lg">
                  ₦{order.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border
            border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4
              flex items-center gap-2">
              <MapPin size={16} className="text-purple-600" />
              Delivery Address
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="font-semibold text-gray-900">
                {order.shippingAddress.fullName}
              </p>
              <p className="text-sm text-gray-600">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 &&
                  `, ${order.shippingAddress.addressLine2}`}
              </p>
              <p className="text-sm text-gray-600">
                {order.shippingAddress.city},{' '}
                {order.shippingAddress.state}
              </p>
              <p className="text-sm text-gray-600">
                {order.shippingAddress.country}
                {order.shippingAddress.postalCode &&
                  ` ${order.shippingAddress.postalCode}`}
              </p>
              <p className="text-sm text-gray-500 pt-1">
                📞 {order.shippingAddress.phoneNumber}
              </p>
            </div>

            {/* Tracking Number */}
            {order.trackingNumber && (
              <div className="mt-4 p-3 bg-indigo-50
                rounded-xl flex items-center gap-3">
                <Truck size={16} className="text-indigo-600
                  flex-shrink-0"/>
                <div>
                  <p className="text-xs text-indigo-500
                    font-medium">
                    Tracking Number
                  </p>
                  <p className="font-bold text-indigo-700">
                    {order.trackingNumber}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      order.trackingNumber!
                    );
                    toast.success('Tracking number copied!');
                  }}
                  className="ml-auto text-indigo-400
                    hover:text-indigo-600">
                  <Copy size={14}/>
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl border
              border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3">
                Customer Notes
              </h3>
              <p className="text-sm text-gray-600 bg-amber-50
                border border-amber-100 rounded-xl p-3
                italic">
                &quot;{order.notes}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Right Column — Actions + Customer */}
        <div className="space-y-5">

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border
            border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">
              Customer
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100
                  rounded-full flex items-center
                  justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">
                    {order.customerName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900
                    text-sm">
                    {order.customerName}
                  </p>
                </div>
              </div>

              <a href={`mailto:${order.customerEmail}`}
                className="flex items-center gap-2 text-sm
                  text-gray-600 hover:text-purple-600
                  transition-colors">
                <Mail size={14} className="flex-shrink-0"/>
                <span className="truncate">
                  {order.customerEmail}
                </span>
              </a>

              <a href={`tel:${order.customerPhone}`}
                className="flex items-center gap-2 text-sm
                  text-gray-600 hover:text-purple-600
                  transition-colors">
                <Phone size={14} className="flex-shrink-0"/>
                {order.customerPhone}
              </a>

              {order.customerPhone && (
                <button
                  onClick={whatsAppCustomer}
                  className="w-full flex items-center
                    justify-center gap-2 bg-green-50
                    text-green-600 py-2.5 rounded-xl text-sm
                    font-medium hover:bg-green-100
                    transition-colors mt-2">
                  <MessageCircle size={15}/>
                  Message on WhatsApp
                </button>
              )}
            </div>
          </div>

          {/* Update Status */}
          {order.status !== 'Cancelled' &&
            order.status !== 'Delivered' && (
            <div className="bg-white rounded-2xl border
              border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">
                Update Status
              </h3>
              <div className="space-y-2">

                {order.status === 'Pending' && (
                  <button
                    onClick={() => updateStatus(
                      1, 'Confirmed'
                    )}
                    disabled={updating}
                    className="w-full flex items-center
                      justify-between px-4 py-3 bg-blue-50
                      text-blue-700 rounded-xl text-sm
                      font-semibold hover:bg-blue-100
                      disabled:opacity-50 transition-colors">
                    <span className="flex items-center gap-2">
                      <CheckCircle size={15}/>
                      Confirm Order
                    </span>
                    <ChevronRight size={15}/>
                  </button>
                )}

                {(order.status === 'Confirmed' ||
                  order.status === 'Processing') && (
                  <button
                    onClick={() => updateStatus(
                      2, 'Processing'
                    )}
                    disabled={updating ||
                      order.status === 'Processing'}
                    className="w-full flex items-center
                      justify-between px-4 py-3 bg-purple-50
                      text-purple-700 rounded-xl text-sm
                      font-semibold hover:bg-purple-100
                      disabled:opacity-50 transition-colors">
                    <span className="flex items-center gap-2">
                      <RefreshCw size={15}/>
                      Mark Processing
                    </span>
                    <ChevronRight size={15}/>
                  </button>
                )}

                {(order.status === 'Confirmed' ||
                  order.status === 'Processing') && (
                  <>
                    {/* Ship with tracking */}
                    {!showTracking ? (
                      <button
                        onClick={() => setShowTracking(true)}
                        className="w-full flex items-center
                          justify-between px-4 py-3
                          bg-indigo-50 text-indigo-700
                          rounded-xl text-sm font-semibold
                          hover:bg-indigo-100 transition-colors">
                        <span className="flex items-center
                          gap-2">
                          <Truck size={15}/>
                          Mark as Shipped
                        </span>
                        <ChevronRight size={15}/>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) =>
                            setTrackingNumber(e.target.value)
                          }
                          className="w-full px-3 py-2.5 border
                            border-gray-200 rounded-xl text-sm
                            focus:outline-none focus:ring-2
                            focus:ring-purple-500"
                          placeholder="Tracking number (optional)"
                        />
                        <button
                          onClick={() => updateStatus(
                            3, 'Shipped', trackingNumber
                          )}
                          disabled={updating}
                          className="w-full bg-indigo-600
                            text-white py-2.5 rounded-xl text-sm
                            font-semibold hover:bg-indigo-700
                            disabled:opacity-50 transition-colors">
                          {updating
                            ? 'Updating...'
                            : 'Confirm Shipped'
                          }
                        </button>
                        <button
                          onClick={() => setShowTracking(false)}
                          className="w-full text-gray-500
                            text-sm hover:text-gray-700">
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}

                {order.status === 'Shipped' && (
                  <button
                    onClick={() => updateStatus(
                      4, 'Delivered'
                    )}
                    disabled={updating}
                    className="w-full flex items-center
                      justify-between px-4 py-3 bg-green-50
                      text-green-700 rounded-xl text-sm
                      font-semibold hover:bg-green-100
                      disabled:opacity-50 transition-colors">
                    <span className="flex items-center gap-2">
                      <CheckCircle size={15}/>
                      Mark as Delivered
                    </span>
                    <ChevronRight size={15}/>
                  </button>
                )}

                {/* Cancel Order */}
                {order.status !== 'Shipped' && (
                  <button
                    onClick={cancelOrder}
                    disabled={updating}
                    className="w-full flex items-center
                      justify-between px-4 py-3 bg-red-50
                      text-red-600 rounded-xl text-sm
                      font-medium hover:bg-red-100
                      disabled:opacity-50 transition-colors
                      mt-2">
                    <span className="flex items-center gap-2">
                      <XCircle size={15}/>
                      Cancel Order
                    </span>
                    <ChevronRight size={15}/>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Payment Reference */}
          {order.paymentReference && (
            <div className="bg-white rounded-2xl border
              border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3
                flex items-center gap-2">
                <CreditCard size={15}
                  className="text-purple-600"/>
                Payment Reference
              </h3>
              <div className="flex items-center gap-2
                bg-gray-50 rounded-xl p-3">
                <p className="font-mono text-xs text-gray-600
                  flex-1 break-all">
                  {order.paymentReference}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      order.paymentReference!
                    );
                    toast.success('Reference copied!');
                  }}
                  className="text-gray-400 hover:text-purple-600
                    flex-shrink-0">
                  <Copy size={13}/>
                </button>
              </div>
            </div>
          )}

          {/* Order Completed */}
          {order.status === 'Delivered' && (
            <div className="bg-green-50 border border-green-100
              rounded-2xl p-5 text-center">
              <CheckCircle size={32}
                className="text-green-500 mx-auto mb-2"/>
              <p className="font-bold text-green-800">
                Order Completed!
              </p>
              <p className="text-sm text-green-600 mt-1">
                Delivered on{' '}
                {order.deliveredAt
                  ? new Date(order.deliveredAt)
                    .toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'N/A'
                }
              </p>
            </div>
          )}

          {/* Cancelled */}
          {order.status === 'Cancelled' && (
            <div className="bg-red-50 border border-red-100
              rounded-2xl p-5 text-center">
              <XCircle size={32}
                className="text-red-400 mx-auto mb-2"/>
              <p className="font-bold text-red-700">
                Order Cancelled
              </p>
              <p className="text-sm text-red-500 mt-1">
                Stock has been restored
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}