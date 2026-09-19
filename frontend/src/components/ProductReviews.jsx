import { useState } from "react";
import { Star } from "lucide-react";

function ProductReviews({ productId }) {
  const [showForm, setShowForm] = useState(false);

  // Demo reviews for now.
  // Later these will come from your friend's backend API.
  const reviews = [
    {
      id: 1,
      name: "Rahul S.",
      rating: 5,
      date: "18 Sep 2026",
      verified: true,
      comment:
        "Amazing quality and the fit is perfect. Really liked the design.",
    },
    {
      id: 2,
      name: "Priya D.",
      rating: 4,
      date: "15 Sep 2026",
      verified: true,
      comment:
        "Good quality material and comfortable to wear. Size was accurate.",
    },
    {
      id: 3,
      name: "Arjun M.",
      rating: 5,
      date: "12 Sep 2026",
      verified: true,
      comment:
        "Love the design. Looks even better in person.",
    },
  ];

  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) /
    reviews.length;

  return (
    <section className="product-reviews">

      {/* ================= REVIEW HEADER ================= */}

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
          onClick={() => setShowForm((current) => !current)}
        >
          {showForm ? "CLOSE" : "WRITE A REVIEW"}
        </button>

      </div>


      {/* ================= RATING SUMMARY ================= */}

      <div className="reviews-summary">

        <div className="overall-rating">

          <strong>
            {averageRating.toFixed(1)}
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
            Based on {reviews.length} reviews
          </span>

        </div>


        {/* RATING BREAKDOWN */}

        <div className="rating-breakdown">

          {[5, 4, 3, 2, 1].map((rating) => {

            const count = reviews.filter(
              (review) => review.rating === rating
            ).length;

            const percentage =
              reviews.length > 0
                ? (count / reviews.length) * 100
                : 0;

            return (
              <div
                key={rating}
                className="rating-row"
              >

                <span>
                  {rating} ★
                </span>

                <div className="rating-bar">
                  <span
                    style={{
                      width: `${percentage}%`,
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


      {/* ================= WRITE REVIEW FORM ================= */}

      {showForm && (
        <div className="review-form">

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
                >
                  <Star
                    size={20}
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
              placeholder="Tell us about your experience..."
            />

          </div>


          <button
            type="button"
            className="submit-review-button"
            onClick={() =>
              alert(
                "Review submission will be connected to the backend later."
              )
            }
          >
            SUBMIT REVIEW
          </button>

        </div>
      )}


      {/* ================= REVIEWS LIST ================= */}

      <div className="reviews-list">

        {reviews.map((review) => (

          <article
            key={review.id}
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
                        star <= review.rating
                          ? "currentColor"
                          : "none"
                      }
                      strokeWidth={1.5}
                    />
                  ))}

                </div>

                <h4>
                  {review.name}
                </h4>

              </div>

              <span className="review-date">
                {review.date}
              </span>

            </div>


            <p className="review-comment">
              {review.comment}
            </p>


            {review.verified && (
              <span className="verified-review">
                ✓ VERIFIED PURCHASE
              </span>
            )}

          </article>

        ))}

      </div>

    </section>
  );
}

export default ProductReviews;