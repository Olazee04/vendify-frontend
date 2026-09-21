'use client';
import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  merchantReply?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  timeAgo: string;
}

interface ReviewsData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
}

interface Props {
  productId: string;
  storeSlug: string;
}

export default function ReviewsSection({
  productId,
  storeSlug
}: Props) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    comment: '',
    orderNumber: '',
  });

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(
        `${API}/api/v1/reviews/product/${productId}`
      );
      setData(res.data.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.comment) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/v1/reviews`, {
        ...form,
        productId,
        storeSlug,
      });
      toast.success('Review submitted! Thank you 🎉');
      setShowForm(false);
      setForm({
        customerName: '', customerEmail: '',
        rating: 5, comment: '', orderNumber: '',
      });
      fetchReviews();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message
        || 'Failed to submit review'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const StarDisplay = ({
    rating,
    size = 16
  }: {
    rating: number;
    size?: number
  }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          className={star <= rating
            ? 'text-amber-400 fill-amber-400'
            : 'text-gray-300'
          }
        />
      ))}
    </div>
  );

  const StarInput = ({
    value,
    onChange
  }: {
    value: number;
    onChange: (v: number) => void
  }) => {
    const [hover, setHover] = useState(0);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform
              hover:scale-110">
            <Star
              size={28}
              className={star <= (hover || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
              }
            />
          </button>
        ))}
        <span className="text-sm text-gray-500 ml-2">
          {['', 'Poor', 'Fair', 'Good',
            'Very Good', 'Excellent'][hover || value]}
        </span>
      </div>
    );
  };

  if (loading) return (
    <div className="animate-pulse space-y-3">
      {[...Array(2)].map((_, i) => (
        <div key={i}
          className="h-20 bg-gray-100 rounded-xl"/>
      ))}
    </div>
  );

  const totalReviews = data?.totalReviews ?? 0;
  const avgRating = data?.averageRating ?? 0;

  return (
    <div className="space-y-5">

      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">
            Customer Reviews
          </h3>
          {totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarDisplay rating={Math.round(avgRating)}/>
              <span className="font-bold text-gray-900">
                {avgRating}
              </span>
              <span className="text-gray-400 text-sm">
                ({totalReviews} review{totalReviews !== 1
                  ? 's' : ''})
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2
            bg-purple-600 text-white rounded-xl text-sm
            font-medium hover:bg-purple-700
            transition-colors">
          <Star size={14}/>
          Write Review
        </button>
      </div>

      {/* Rating Breakdown */}
      {totalReviews > 0 && data?.ratingBreakdown && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = data.ratingBreakdown[star] ?? 0;
            const pct = totalReviews > 0
              ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star}
                className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-3">
                  {star}
                </span>
                <Star size={10}
                  className="text-amber-400 fill-amber-400"/>
                <div className="flex-1 h-2 bg-gray-200
                  rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full
                      transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-5">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Write Review Form */}
      {showForm && (
        <div className="bg-purple-50 border border-purple-200
          rounded-2xl p-5">
          <div className="flex items-center justify-between
            mb-4">
            <h4 className="font-bold text-gray-900">
              Write a Review
            </h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600">
              <X size={18}/>
            </button>
          </div>
          <form onSubmit={submitReview}
            className="space-y-4">
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-2">
                Your Rating *
              </label>
              <StarInput
                value={form.rating}
                onChange={(v) => setForm({
                  ...form, rating: v
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm({
                    ...form, customerName: e.target.value
                  })}
                  className="w-full px-3 py-2.5 border
                    border-gray-200 rounded-xl focus:outline-none
                    focus:ring-2 focus:ring-purple-500
                    text-gray-900 bg-white text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({
                    ...form, customerEmail: e.target.value
                  })}
                  className="w-full px-3 py-2.5 border
                    border-gray-200 rounded-xl focus:outline-none
                    focus:ring-2 focus:ring-purple-500
                    text-gray-900 bg-white text-sm"
                  placeholder="john@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Review *
              </label>
              <textarea
                required
                value={form.comment}
                onChange={(e) => setForm({
                  ...form, comment: e.target.value
                })}
                rows={3}
                className="w-full px-3 py-2.5 border
                  border-gray-200 rounded-xl focus:outline-none
                  focus:ring-2 focus:ring-purple-500
                  text-gray-900 bg-white text-sm resize-none"
                placeholder="Tell others about this product..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1.5">
                Order Number (optional — verifies purchase)
              </label>
              <input
                type="text"
                value={form.orderNumber}
                onChange={(e) => setForm({
                  ...form, orderNumber: e.target.value
                })}
                className="w-full px-3 py-2.5 border
                  border-gray-200 rounded-xl focus:outline-none
                  focus:ring-2 focus:ring-purple-500
                  text-gray-900 bg-white text-sm"
                placeholder="VND-20260101-0001"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 text-white
                py-3 rounded-xl font-semibold
                hover:bg-purple-700 disabled:opacity-50
                transition-colors">
              {submitting
                ? 'Submitting...'
                : 'Submit Review'
              }
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {totalReviews === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Star size={32}
            className="mx-auto mb-2 opacity-30"/>
          <p className="text-sm">
            No reviews yet. Be the first!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.reviews.map(review => (
            <div key={review.id}
              className="bg-white rounded-xl border
                border-gray-100 p-4">
              <div className="flex items-start
                justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-100
                    rounded-full flex items-center
                    justify-center shrink-0">
                    <span className="text-purple-600
                      font-bold text-sm">
                      {review.customerName[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900
                        text-sm">
                        {review.customerName}
                      </p>
                      {review.isVerifiedPurchase && (
                        <span className="px-1.5 py-0.5
                          bg-green-100 text-green-600 text-xs
                          rounded-full font-medium">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={review.rating}
                        size={12}/>
                      <span className="text-xs text-gray-400">
                        {review.timeAgo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed
                ml-12">
                {review.comment}
              </p>

              {/* Merchant Reply */}
              {review.merchantReply && (
                <div className="ml-12 mt-3 p-3 bg-purple-50
                  border-l-4 border-purple-400 rounded-r-xl">
                  <p className="text-xs font-bold
                    text-purple-700 mb-1">
                    🏪 Store Owner Reply
                  </p>
                  <p className="text-sm text-gray-700">
                    {review.merchantReply}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}