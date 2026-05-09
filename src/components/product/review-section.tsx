"use client";

import { useState } from "react";
import { Star, Send, Check } from "lucide-react";
import { submitReview } from "@/actions/review.actions";
import { useSession } from "@/lib/auth-client";
import { timeAgo, getInitials } from "@/lib/utils";

interface ReviewSectionProps {
  productId: string;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    user: { name: string; image: string | null };
  }[];
  avgRating: number;
}

export function ReviewSection({ productId, reviews, avgRating }: ReviewSectionProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await submitReview({ productId, rating, comment });

    if (result.success) {
      setSuccess(true);
      setComment("");
    } else {
      setError(result.error || "Failed to submit review.");
    }
    setLoading(false);
  };

  return (
    <section className="mt-12 pt-12 border-t border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900 font-[Outfit]">
          Reviews ({reviews.length})
        </h2>
        {avgRating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(avgRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Submit Review Form */}
      {session?.user && (
        <div className="mb-8 p-5 rounded-2xl bg-gray-50 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
          {success ? (
            <p className="text-green-600 text-sm font-medium flex items-center gap-1.5"><Check className="w-4 h-4" /> Review submitted! Refresh to see it.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Star picker */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        s <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Share your experience with this product..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Review
              </button>
            </form>
          )}
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center text-sm font-semibold text-brand shrink-0">
                {getInitials(review.user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900">
                    {review.user.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {timeAgo(review.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-8">
          No reviews yet. Be the first to review this product!
        </p>
      )}
    </section>
  );
}
