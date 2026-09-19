import { useEffect, useState } from "react";
import logo from "../assets/images/logo.png";

function IntroAnimation() {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const closeTimer = setTimeout(() => {
      setClosing(true);
    }, 1300);

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, 1900);

    return () => {
      clearTimeout(closeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`intro-animation ${
        closing ? "intro-closing" : ""
      }`}
    >
      <div className="intro-content">

        <div className="intro-logo-wrapper">
          <img
            src={logo}
            alt="UNTKN"
            className="intro-logo"
          />
        </div>

        <h1 className="intro-title">
          UNTKN
        </h1>

        <p className="intro-subtitle">
          INDEPENDENT LABEL
        </p>

        <div className="intro-line">
          <span></span>
        </div>

      </div>
    </div>
  );
}

export default IntroAnimation;