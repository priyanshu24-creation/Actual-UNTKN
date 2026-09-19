import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">

        <p className="eyebrow">
          ERROR / 404
        </p>

        <h1>
          PAGE<br />
          NOT<br />
          FOUND.
        </h1>

        <p>
          The page you're looking for doesn't exist
          or may have been moved.
        </p>

        <div className="not-found-actions">

          <Link
            to="/"
            className="not-found-primary"
          >
            <ArrowLeft size={17} strokeWidth={1.5} />
            BACK HOME
          </Link>

          <Link
            to="/shop"
            className="not-found-secondary"
          >
            SHOP COLLECTION
            <ArrowRight size={17} strokeWidth={1.5} />
          </Link>

        </div>

      </div>
    </div>
  );
}

export default NotFound;