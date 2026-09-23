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
  const text = message.toLowerCase();

  if (
    text.includes("t-shirt") ||
    text.includes("tshirt") ||
    text.includes("tee")
  ) {
    return "We currently have graphic T-shirts such as KARMA and HISTORY. You can explore all available pieces in the Shop section.";
  }

  if (
    text.includes("size") ||
    text.includes("sizing") ||
    text.includes("fit")
  ) {
    return "UNTKN products currently offer multiple sizes depending on the product. Open a product page to check its available sizes before adding it to your bag.";
  }

  if (
    text.includes("shipping") ||
    text.includes("delivery") ||
    text.includes("deliver")
  ) {
    return "UNTKN offers free shipping on eligible orders. Check the checkout page for the latest shipping charges and delivery information.";
  }

  if (
    text.includes("buy") ||
    text.includes("recommend") ||
    text.includes("suggest") ||
    text.includes("what should")
  ) {
    return "If you're looking for a graphic statement piece, start with KARMA or HISTORY. For a heavier thermal style, check out the MISERY WORLD collection.";
  }

  if (
    text.includes("return") ||
    text.includes("refund") ||
    text.includes("exchange")
  ) {
    return "For returns, exchanges, and refunds, please check the store policy or contact the UNTKN support team for order-specific help.";
  }

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return "Hey! 👋 Welcome to UNTKN. I'm your shopping assistant. What would you like to explore?";
  }

  return "I'm here to help you explore UNTKN. You can ask me about products, sizes, shipping, returns, or what to buy.";
}

function ContactButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hey! 👋 Welcome to UNTKN.",
    },
    {
      id: 2,
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

  return (
    <>
      {/* =========================
          AI CHAT WINDOW
      ========================= */}

      {isOpen && (
        <div
          className="ai-chat-window"
          role="dialog"
          aria-label="UNTKN AI Shopping Assistant"
        >
          {/* HEADER */}

          <div className="ai-chat-header">

            <div className="ai-chat-brand">

              <div className="ai-chat-avatar">
                <Bot size={18} strokeWidth={1.8} />
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
              aria-label="Close chat"
            >
              <X size={18} />
            </button>

          </div>


          {/* MESSAGES */}

          <div className="ai-chat-messages">

            {messages.map((item) => (
              <div
                key={item.id}
                className={`ai-chat-message ${item.type}`}
              >

                {item.type === "bot" && (
                  <div className="ai-message-icon">
                    <Sparkles
                      size={13}
                      strokeWidth={1.8}
                    />
                  </div>
                )}

                {item.type === "user" && (
                  <div className="ai-message-icon user-icon">
                    <User
                      size={13}
                      strokeWidth={1.8}
                    />
                  </div>
                )}

                <div className="ai-message-content">
                  {item.text}
                </div>

              </div>
            ))}

            <div ref={messagesEndRef} />

          </div>


          {/* QUICK QUESTIONS */}

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


          {/* INPUT */}

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
              placeholder="Ask UNTKN AI..."
              aria-label="Message UNTKN AI"
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


      {/* =========================
          FLOATING BUTTON
      ========================= */}

      <button
        type="button"
        className={`contact-floating-button ${
          isOpen ? "chat-open" : ""
        }`}
        onClick={() => setIsOpen((previous) => !previous)}
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