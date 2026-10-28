'use client';
import { CheckCircle2, X } from 'lucide-react';

// A small pop-up shown after a successful payment.
// `link` is the WhatsApp link with the order details already written.
export default function PaymentSuccessModal({
  open,
  onClose,
  link,
  title = 'Payment successful',
  message,
  orderNumber,
}: {
  open: boolean;
  onClose: () => void;
  link?: string;
  title?: string;
  message?: string;
  orderNumber?: string;
  [key: string]: any;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center space-y-3 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
        <CheckCircle2 size={48} className="text-green-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {orderNumber && (
          <p className="text-sm text-gray-600">
            Your order number is{' '}
            <strong className="text-purple-600">{orderNumber}</strong>.
          </p>
        )}
        {message && <p className="text-sm text-gray-600">{message}</p>}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="block bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors">
            Send order details on WhatsApp
          </a>
        )}
        <button
          onClick={onClose}
          className="w-full text-sm text-gray-500 hover:underline">
          Close
        </button>
      </div>
    </div>
  );
}