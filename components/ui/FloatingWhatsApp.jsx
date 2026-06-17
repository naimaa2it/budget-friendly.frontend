"use client";
import React, { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
// FloatingWhatsApp component to display a WhatsApp chat button
// with a floating animation and a default message.
const FloatingWhatsApp = ({
  phoneNumber = "8801631413693",
  message = "Hello! I have a query.",
  position = { bottom: 80, right: 20 },
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  const styleTag = `
    @keyframes gentleFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @media (max-width: 767px) {
      .wa-float-btn { width: 34px !important; height: 34px !important; padding: 7px !important; }
      .wa-float-btn-open { width: auto !important; }
    }
  `;

  return (
    <>
      <style>{styleTag}</style>
      <div
        style={{
          position: "fixed",
          bottom: position.bottom,
          right: position.right,
          zIndex: 50,
        }}
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={isHovered ? "wa-float-btn-open" : "wa-float-btn"}
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#25D366",
            color: "white",
            borderRadius: "50px",
            padding: isHovered ? "10px 15px 10px 10px" : "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease",
            overflow: "hidden",
            width: isHovered ? "auto" : "40px",
            height: "40px",
            textDecoration: "none",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            style={{
              animation: "gentleFloat 3s ease-in-out infinite",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FaWhatsapp style={{ fontSize: "18px" }} />
          </div>

          {isHovered && (
            <span
              style={{
                marginLeft: "8px",
                fontSize: "14px",
                fontWeight: 500,
                whiteSpace: "nowrap",
                paddingRight: "4px",
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.2s ease",
              }}
            >
              Chat with us
            </span>
          )}
        </a>
      </div>
    </>
  );
};

export default FloatingWhatsApp;
