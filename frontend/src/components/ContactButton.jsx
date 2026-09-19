import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

function ContactButton() {
  const navigate = useNavigate();

  const handleContact = () => {
    navigate("/contact");
  };

  return (
    <button
      type="button"
      className="contact-floating-button"
      onClick={handleContact}
      aria-label="Contact us"
      title="Contact Us"
    >
      <MessageCircle size={18} strokeWidth={1.7} />
      <span>CONTACT</span>
    </button>
  );
}

export default ContactButton;