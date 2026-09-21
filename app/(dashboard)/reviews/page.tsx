'use client';
import { useEffect, useState } from 'react';
import { Star, MessageCircle, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  merchantReply?: string;
  isVerifiedPurchase: boolean;
  timeAgo: string;
  productName?: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews/my-store');
      setReviews(res.data.data ?? []);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const submitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/reviews/${reviewId}/reply`, {
        reply: replyText
      });
      toast.success('Reply posted! ✅');
      setReplyingTo(null);
      setReplyText('');
      fetchReviews();
    } catch {
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0)
      / reviews.length
    : 0;

  const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(star => (
        <Star key={star} size={14}
          className={star <= rating
            ? 'text-amber-400 fill-amber-400'
            : 'text-gray-300'
          }/>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reviews
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            What customers say about your products
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border
          border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-amber-500">
            {avgRating.toFixed(1)}
          </p>
          <StarDisplay rating={Math.round(avgRating)}/>
          <p className="text-xs text-gray-400 mt-1">
            Average Rating
          </p>
        </div>
        <div className="bg-white rounded-2xl border
          border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {reviews.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Total Reviews
          </p>
        </div>
        <div className="bg-white rounded-2xl border
          border-gray-100 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {reviews.filter(r =>
              r.isVerifiedPurchase
            ).length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Verified Purchases
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl
              border border-gray-100 animate-pulse h-24"/>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border
          border-gray-100 p-16 text-center">
          <Star size={48}
            className="text-gray-300 mx-auto mb-4"/>
          <h3 className="font-bold text-gray-700 mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-400 text-sm">
            Reviews will appear here when customers
            rate your products
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id}
              className="bg-white rounded-2xl border
                border-gray-100 p-5">
              <div className="flex items-start
                justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100
                    rounded-full flex items-center
                    justify-center shrink-0">
                    <span className="text-purple-600
                      font-bold">
                      {review.customerName[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {review.customerName}
                      </p>
                      {review.isVerifiedPurchase && (
                        <span className="px-2 py-0.5
                          bg-green-100 text-green-600 text-xs
                          rounded-full font-medium">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={review.rating}/>
                      <span className="text-xs text-gray-400">
                        {review.timeAgo}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="p-2 text-gray-400
                    hover:text-red-500 hover:bg-red-50
                    rounded-lg transition-colors">
                  <Trash2 size={15}/>
                </button>
              </div>

              {review.productName && (
                <p className="text-xs text-purple-500
                  mt-2 ml-13">
                  On: {review.productName}
                </p>
              )}

              <p className="text-sm text-gray-700 mt-3
                leading-relaxed">
                {review.comment}
              </p>

              {/* Merchant Reply */}
              {review.merchantReply ? (
                <div className="mt-3 p-3 bg-purple-50
                  border-l-4 border-purple-400 rounded-r-xl">
                  <p className="text-xs font-bold
                    text-purple-700 mb-1">
                    Your Reply
                  </p>
                  <p className="text-sm text-gray-700">
                    {review.merchantReply}
                  </p>
                </div>
              ) : (
                <>
                  {replyingTo === review.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) =>
                          setReplyText(e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2.5 border
                          border-gray-200 rounded-xl text-sm
                          focus:outline-none focus:ring-2
                          focus:ring-purple-500 resize-none"
                        placeholder="Write your reply..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            submitReply(review.id)
                          }
                          disabled={submitting}
                          className="flex items-center gap-1.5
                            px-4 py-2 bg-purple-600 text-white
                            rounded-lg text-sm font-medium
                            hover:bg-purple-700 disabled:opacity-50">
                          <Check size={14}/>
                          {submitting ? 'Posting...' : 'Post'}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-4 py-2 border
                            border-gray-200 text-gray-600
                            rounded-lg text-sm hover:bg-gray-50">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setReplyingTo(review.id);
                        setReplyText('');
                      }}
                      className="mt-3 flex items-center gap-1.5
                        text-sm text-purple-600 hover:underline
                        font-medium">
                      <MessageCircle size={14}/>
                      Reply to review
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}