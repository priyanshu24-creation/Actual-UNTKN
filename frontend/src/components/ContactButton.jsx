import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  User,
} from "lucide-react";

const quickQuestions = [
  "What should I buy?",
  "Show me T-shirts",
  "What sizes are available?",
  "Tell me about shipping",
];

function getBotResponse(message) {
  const text = message.toLowerCase().trim();

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return "Hey! 👋 Welcome to UNTKN. I'm your shopping assistant. What would you like to explore?";
  }

  if (
    text.includes("help") ||
    text.includes("support") ||
    text.includes("assistance") ||
    text.includes("customer service") ||
    text.includes("customer care") ||
    text.includes("need help") ||
    text.includes("need assistance") ||
    text.includes("problem") ||
    text.includes("issue") ||
    text.includes("complaint")
  ) {
    return "Need help? Please email us at customer@untkn.in or send your issue through the Contact page. Our support team will help you with your concern.";
  }

  if (
    text.includes("t-shirt") ||
    text.includes("tshirt") ||
    text.includes("tee") ||
    text.includes("shirt")
  ) {
    return "We currently have graphic T-shirts such as KARMA and HISTORY. You can explore all available pieces in the Shop section.";
  }

  if (
    text.includes("size") ||
    text.includes("sizing") ||
    text.includes("fit")
  ) {
    return "UNTKN products currently offer multiple sizes depending on the product. Open a product page to check the available sizes before adding an item to your bag.";
  }

  if (
    text.includes("shipping") ||
    text.includes("delivery") ||
    text.includes("deliver") ||
    text.includes("ship")
  ) {
    return "UNTKN offers free shipping on eligible orders. Please check the checkout page for the latest shipping charges and delivery information.";
  }

  if (
    text.includes("return") ||
    text.includes("refund") ||
    text.includes("exchange")
  ) {
    return "For returns, exchanges, and refunds, please check the store policy or contact the UNTKN support team for order-specific help.";
  }

  if (
    text.includes("order") &&
    (
      text.includes("track") ||
      text.includes("where") ||
      text.includes("status")
    )
  ) {
    return "For order tracking and status, please open your Account page and check your Orders section.";
  }

  if (
    text.includes("buy") ||
    text.includes("recommend") ||
    text.includes("suggest") ||
    text.includes("what should") ||
    text.includes("which product")
  ) {
    return "If you're looking for a graphic statement piece, start with KARMA or HISTORY. For a heavier thermal style, check out the MISERY WORLD collection.";
  }

  if (
    text.includes("payment") ||
    text.includes("pay") ||
    text.includes("razorpay") ||
    text.includes("card") ||
    text.includes("upi")
  ) {
    return "UNTKN supports online payments through the available payment options shown during checkout. Select your preferred payment method and complete your order securely.";
  }

  if (
    text.includes("cart") ||
    text.includes("bag")
  ) {
    return "You can add products to your bag from the Shop or product page. Open the cart icon to review your items before checkout.";
  }

  if (
    text.includes("account") ||
    text.includes("login") ||
    text.includes("sign in") ||
    text.includes("register") ||
    text.includes("signup") ||
    text.includes("sign up")
  ) {
    return "You can create an UNTKN account or sign in from the Account section. An account is required for features such as managing your orders.";
  }

  if (
    text.includes("collection") ||
    text.includes("collections")
  ) {
    return "You can explore UNTKN's latest collections through the Collections section. Browse the available pieces and open any product to see its details.";
  }

  if (
    text.includes("lookbook")
  ) {
    return "Check out the UNTKN Lookbook to explore our curated looks and collection inspiration.";
  }

  if (
    text.includes("contact") ||
    text.includes("email") ||
    text.includes("reach")
  ) {
    return "You can contact the UNTKN team through the Contact page. For shopping assistance, you can also continue chatting with me here.";
  }

  if (
    text.includes("price") ||
    text.includes("cost") ||
    text.includes("expensive") ||
    text.includes("cheap")
  ) {
    return "Product prices are displayed on each product page. Open the product you're interested in to see its current price and available options.";
  }

  if (
    text.includes("product") ||
    text.includes("products")
  ) {
    return "You can explore all available UNTKN products from the Shop section. Open any product to view its details, price, sizes, and other available options.";
  }

  return "I'm here to help you explore UNTKN. You can ask me about products, sizes, shipping, payments, orders, returns, collections, or what to buy.";
}

function ContactButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      type: "bot",
      text: "Hey! 👋 Welcome to UNTKN.",
    },
    {
      id: "welcome-2",
      type: "bot",
      text: "I'm your shopping assistant. How can I help you today?",
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, isOpen]);

  const sendMessage = useCallback((text) => {
    const cleanMessage = text.trim();

    if (!cleanMessage) {
      return;
    }

    const userMessage = {
      id: `${Date.now()}-user`,
      type: "user",
      text: cleanMessage,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setMessage("");

    setTimeout(() => {
      const botMessage = {
        id: `${Date.now()}-bot`,
        type: "bot",
        text: getBotResponse(cleanMessage),
      };

      setMessages((previous) => [
        ...previous,
        botMessage,
      ]);
    }, 600);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(message);
  };

  const handleQuickQuestion = (question) => {
    sendMessage(question);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (message.trim()) {
        sendMessage(message);
      }
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="ai-chat-window"
          role="dialog"
          aria-modal="false"
          aria-label="UNTKN AI Shopping Assistant"
        >
          <div className="ai-chat-header">
            <div className="ai-chat-brand">
              <div className="ai-chat-avatar">
                <Bot
                  size={18}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <strong>UNTKN AI</strong>

                <span>
                  SHOPPING ASSISTANT
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ai-chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close UNTKN AI"
            >
              <X
                size={18}
                strokeWidth={1.8}
              />
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`ai-chat-message ${item.type}`}
              >
                <div
                  className={`ai-message-icon ${
                    item.type === "user"
                      ? "user-icon"
                      : ""
                  }`}
                >
                  {item.type === "bot" ? (
                    <Sparkles
                      size={13}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <User
                      size={13}
                      strokeWidth={1.8}
                    />
                  )}
                </div>

                <div className="ai-message-content">
                  {item.text}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <div className="ai-quick-questions">
            <p>QUICK QUESTIONS</p>

            <div className="ai-quick-list">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() =>
                    handleQuickQuestion(question)
                  }
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <form
            className="ai-chat-input"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask UNTKN AI..."
              aria-label="Message UNTKN AI"
              autoComplete="off"
            />

            <button
              type="submit"
              aria-label="Send message"
              disabled={!message.trim()}
            >
              <Send
                size={17}
                strokeWidth={1.8}
              />
            </button>
          </form>

          <div className="ai-chat-footer">
            UNTKN AI • SHOPPING ASSISTANT
          </div>
        </div>
      )}

      <button
        type="button"
        className={`contact-floating-button ${
          isOpen ? "chat-open" : ""
        }`}
        onClick={() =>
          setIsOpen((previous) => !previous)
        }
        aria-label={
          isOpen
            ? "Close UNTKN AI"
            : "Open UNTKN AI"
        }
        aria-expanded={isOpen}
        title="UNTKN AI"
      >
        {isOpen ? (
          <X
            size={20}
            strokeWidth={1.8}
          />
        ) : (
          <Bot
            size={21}
            strokeWidth={1.8}
          />
        )}
      </button>
    </>
  );
}

export default ContactButton;