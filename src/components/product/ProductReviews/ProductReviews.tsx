import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  author: string | null;
  createdAt: Date;
}

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="inline-flex gap-0.5 text-ink">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={16} aria-hidden="true" fill={n <= Math.round(rating) ? "currentColor" : "none"} className={n <= Math.round(rating) ? "" : "text-ink-subtle"} />
      ))}
    </span>
  );
}

export async function ProductReviews({ reviews }: { reviews: ReviewItem[] }) {
  const t = await getTranslations("product");
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <section aria-labelledby="reviews-title" data-reviews="" className="mt-20 border-t border-line pt-10">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <h2 id="reviews-title" className="text-step-3 leading-[1.12] text-ink">
          {t("reviewsTitle")}
        </h2>
        {count ? (
          <p className="tabular flex items-center gap-3 text-ui-sm text-ink-muted">
            <Stars rating={average} label={t("ratingLabel", { rating: average.toFixed(1) })} />
            {t("ratingSummary", { rating: average.toFixed(1), count })}
          </p>
        ) : null}
      </div>
      {count ? (
        <ul className="m-0 mt-6 grid list-none gap-x-12 p-0 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-line py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Stars rating={review.rating} label={t("ratingLabel", { rating: String(review.rating) })} />
                <time dateTime={review.createdAt.toISOString()} className="meta text-ink-muted">
                  {date.format(review.createdAt)}
                </time>
              </div>
              {review.comment ? <p className="measure mt-3 text-step-0 leading-[1.65] text-ink">{review.comment}</p> : null}
              <p className="meta mt-2 text-ink-muted">{review.author || t("reviewAnonymous")}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-ui-sm text-ink-muted">{t("noReviews")}</p>
      )}
    </section>
  );
}
