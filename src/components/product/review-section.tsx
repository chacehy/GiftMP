"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Send, Check, BadgeCheck, Store } from "lucide-react";
import { submitReview, respondToReview } from "@/actions/review.actions";
import { useSession } from "@/lib/auth-client";
import { timeAgo, getInitials } from "@/lib/utils";
import { ImageUploader } from "@/components/forms/image-uploader";

interface ReviewSectionProps {
  productId: string;
  shopOwnerId?: string;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    user: { name: string; image: string | null };
    images?: { id: string; url: string }[];
    sellerResponse?: string | null;
    sellerRespondedAt?: Date | null;
  }[];
  avgRating: number;
}

export function ReviewSection({ productId, shopOwnerId, reviews, avgRating }: ReviewSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isShopOwner = Boolean(session?.user && shopOwnerId && session.user.id === shopOwnerId);

  const histogram = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const maxCount = Math.max(1, ...histogram.map((h) => h.count));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await submitReview({ productId, rating, comment, images });

    if (result.success) {
      setSuccess(true);
      setComment("");
      setImages([]);
      router.refresh();
    } else {
      setError(result.error || "Failed to submit review.");
    }
    setLoading(false);
  };

  return (
    <section className="mt-12 pt-12 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 font-[Outfit]">
          Reviews ({reviews.length})
        </h2>

        {reviews.length > 0 && (
          <div className="flex items-center gap-6">
            <div className="text-center shrink-0">
              <p className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
              <div className="flex items-center gap-0.5 justify-center mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1 min-w-[140px]">
              {histogram.map((h) => (
                <div key={h.star} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2.5">{h.star}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${(h.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-right">{h.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Review Form */}
      {session?.user && !isShopOwner && (
        <div className="mb-8 p-5 rounded-2xl bg-gray-50 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
          {success ? (
            <p className="text-green-600 text-sm font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Review submitted!
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <ImageUploader bucket="review-images" value={images} onChange={setImages} maxFiles={4} />
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
            <ReviewCard key={review.id} review={review} isShopOwner={isShopOwner} onResponded={() => router.refresh()} />
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

function ReviewCard({
  review,
  isShopOwner,
  onResponded,
}: {
  review: ReviewSectionProps["reviews"][number];
  isShopOwner: boolean;
  onResponded: () => void;
}) {
  const [responding, setResponding] = useState(false);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await respondToReview({ reviewId: review.id, response });
    if (result.success) {
      setResponding(false);
      onResponded();
    } else {
      setError(result.error || "Failed to submit response.");
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center text-sm font-semibold text-brand shrink-0">
        {getInitials(review.user.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm text-gray-900">{review.user.name}</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-green-600 font-medium">
            <BadgeCheck className="w-3.5 h-3.5" /> Verified Purchase
          </span>
          <span className="text-xs text-gray-400">{timeAgo(review.createdAt)}</span>
        </div>
        <div className="flex items-center gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
            />
          ))}
        </div>
        {review.comment && (
          <p className="text-sm text-gray-600 leading-relaxed mb-2">{review.comment}</p>
        )}
        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mb-2">
            {review.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt=""
                className="w-16 h-16 rounded-lg object-cover border border-gray-100"
              />
            ))}
          </div>
        )}

        {review.sellerResponse ? (
          <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-gray-800 mb-1">
              <Store className="w-3.5 h-3.5 text-brand" /> Seller response
            </p>
            <p className="text-gray-600">{review.sellerResponse}</p>
          </div>
        ) : isShopOwner ? (
          responding ? (
            <form onSubmit={handleRespond} className="mt-2 space-y-2">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={2}
                required
                placeholder="Write a response to this review..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50"
                >
                  {loading ? "Posting..." : "Post response"}
                </button>
                <button
                  type="button"
                  onClick={() => setResponding(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setResponding(true)}
              className="mt-1 text-xs font-medium text-brand hover:text-brand-dark"
            >
              Respond as seller
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
