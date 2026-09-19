import { Link } from "react-router-dom";
import { ArrowRight, PackageOpen } from "lucide-react";

function EmptyState({
  icon: Icon = PackageOpen,
  title = "NOTHING HERE.",
  description = "There is nothing to display right now.",
  buttonText,
  buttonLink,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} strokeWidth={1.2} />
      </div>

      <p className="eyebrow">EMPTY</p>

      <h2>{title}</h2>

      <p className="empty-state-description">
        {description}
      </p>

      {buttonText && buttonLink && (
        <Link to={buttonLink} className="empty-state-button">
          {buttonText}
          <ArrowRight size={17} strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}

export default EmptyState;