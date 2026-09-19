import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

function ScrollToTop() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!showButton) {
    return null;
  }

  return (
    <button
      className="scroll-top-button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <ArrowUp size={18} strokeWidth={1.8} />
    </button>
  );
}

export default ScrollToTop;