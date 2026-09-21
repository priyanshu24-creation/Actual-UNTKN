import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import api from "../services/api";

function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      if (!productId) {
        setReviews([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/products/${productId}/reviews`);

        if (cancelled) {
          return;
        }

        const data = response?.data;

        const receivedReviews =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.reviews)
              ? data.reviews
              : [];

        setReviews(receivedReviews);
      } catch (err) {
        if (!cancelled) {
          console.error("Loading product reviews failed:", err);
          setReviews([]);
          setError(
            err?.response?.data?.message ||
              "Unable to load reviews right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    return {
      5: reviews.filter((review) => Number(review.rating) === 5).length,
      4: reviews.filter((review) => Number(review.rating) === 4).length,
      3: reviews.filter((review) => Number(review.rating) === 3).length,
      2: reviews.filter((review) => Number(review.rating) === 2).length,
      1: reviews.filter((review) => Number(review.rating) === 1).length
    };
  }, [reviews]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!rating) {
      setError("Please select a rating.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!comment.trim()) {
      setError("Please write your review.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post(`/products/${productId}/reviews`, {
        name: name.trim(),
        email: email.trim(),
        rating,
        comment: comment.trim()
      });

      const submittedReview =
        response?.data?.review ||
        response?.data?.data ||
        response?.data;

      if (submittedReview && typeof submittedReview === "object") {
        setReviews((currentReviews) => [
          submittedReview,
          ...currentReviews
        ]);
      } else {
        const refreshed = await api.get(
          `/products/${productId}/reviews`
        );

        const refreshedData = refreshed?.data;

        const refreshedReviews =
          Array.isArray(refreshedData)
            ? refreshedData
            : Array.isArray(refreshedData?.reviews)
              ? refreshedData.reviews
              : [];

        setReviews(refreshedReviews);
      }

      setRating(0);
      setName("");
      setEmail("");
      setComment("");
      setSuccess("Your review has been submitted successfully.");
      setShowForm(false);
    } catch (err) {
      console.error("Submitting product review failed:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to submit your review right now."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <section className="product-reviews">
      <div className="reviews-header">
        <div>
          <p className="eyebrow">
            CUSTOMER FEEDBACK
          </p>

          <h2>
            PRODUCT REVIEWS
          </h2>
        </div>

        <button
          type="button"
          className="write-review-button"
          onClick={() => {
            setShowForm((current) => !current);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "CLOSE" : "WRITE A REVIEW"}
        </button>
      </div>

      {success && (
        <div className="review-success">
          {success}
        </div>
      )}

      {error && (
        <div className="review-error">
          {error}
        </div>
      )}

      <div className="reviews-summary">
        <div className="overall-rating">
          <strong>
            {averageRating ? averageRating.toFixed(1) : "0.0"}
          </strong>

          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={17}
                fill={
                  star <= Math.round(averageRating)
                    ? "currentColor"
                    : "none"
                }
                strokeWidth={1.5}
              />
            ))}
          </div>

          <span>
            Based on {reviews.length}{" "}
            {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>

        <div className="rating-breakdown">
          {[5, 4, 3, 2, 1].map((ratingValue) => {
            const count = ratingCounts[ratingValue];

            const percentage =
              reviews.length > 0
                ? (count / reviews.length) * 100
                : 0;

            return (
              <div
                key={ratingValue}
                className="rating-row"
              >
                <span>
                  {ratingValue} ★
                </span>

                <div className="rating-bar">
                  <span
                    style={{
                      width: `${percentage}%`
                    }}
                  />
                </div>

                <span>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <form
          className="review-form"
          onSubmit={handleSubmit}
        >
          <p className="eyebrow">
            SHARE YOUR EXPERIENCE
          </p>

          <h3>
            WRITE A REVIEW
          </h3>

          <div className="review-form-rating">
            <span>
              YOUR RATING
            </span>

            <div>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Give ${star} stars`}
                  onClick={() => setRating(star)}
                  className={
                    star <= rating
                      ? "selected"
                      : ""
                  }
                >
                  <Star
                    size={20}
                    fill={
                      star <= rating
                        ? "currentColor"
                        : "none"
                    }
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="review-form-grid">
            <div className="review-field">
              <label htmlFor={`review-name-${productId}`}>
                NAME
              </label>

              <input
                id={`review-name-${productId}`}
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Your name"
              />
            </div>

            <div className="review-field">
              <label htmlFor={`review-email-${productId}`}>
                EMAIL
              </label>

              <input
                id={`review-email-${productId}`}
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Your email"
              />
            </div>
          </div>

          <div className="review-field">
            <label htmlFor={`review-message-${productId}`}>
              YOUR REVIEW
            </label>

            <textarea
              id={`review-message-${productId}`}
              rows="5"
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              placeholder="Tell us about your experience..."
            />
          </div>

          <button
            type="submit"
            className="submit-review-button"
            disabled={submitting}
          >
            {submitting
              ? "SUBMITTING..."
              : "SUBMIT REVIEW"}
          </button>
        </form>
      )}

      <div className="reviews-list">
        {loading ? (
          <div className="reviews-empty">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty">
            <h3>
              NO REVIEWS YET
            </h3>

            <p>
              Be the first to review this product.
            </p>
          </div>
        ) : (
          reviews.map((review) => {
            const reviewRating = Number(
              review.rating || 0
            );

            const reviewName =
              review.name ||
              review.user_name ||
              review.user?.name ||
              "Customer";

            const reviewDate =
              review.date ||
              review.created_at ||
              review.createdAt;

            const reviewComment =
              review.comment ||
              review.review ||
              review.message ||
              "";

            const verified =
              review.verified ??
              review.is_verified ??
              review.verified_purchase ??
              review.verifiedPurchase ??
              false;

            return (
              <article
                key={
                  review.id ||
                  `${reviewName}-${reviewDate}-${reviewComment}`
                }
                className="review-card"
              >
                <div className="review-card-top">
                  <div>
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          fill={
                            star <= reviewRating
                              ? "currentColor"
                              : "none"
                          }
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>

                    <h4>
                      {reviewName}
                    </h4>
                  </div>

                  <span className="review-date">
                    {formatDate(reviewDate)}
                  </span>
                </div>

                <p className="review-comment">
                  {reviewComment}
                </p>

                {verified && (
                  <span className="verified-review">
                    ✓ VERIFIED PURCHASE
                  </span>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default ProductReviews;