"use client";

import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";

// default animation: a generic "empty box" from LottieFiles CDN
const DEFAULT_ANIMATION =
  "https://assets5.lottiefiles.com/packages/lf20_usmfx6bp.json";

export default function EmptyState({
  title = "Nothing to see here",
  description = "",
  buttonText = "Explore More",
  onButtonClick,
  className = "",
  // either supply a JSON object or a url; url takes precedence
  animationData,
  animationUrl = DEFAULT_ANIMATION,
  // allow override of Lottie container dimensions
  animationStyle = { height: 150 },
}) {
  const [data, setData] = useState(animationData);

  useEffect(() => {
    if (!animationData && animationUrl) {
      fetch(animationUrl)
        .then((r) => r.json())
        .then((json) => setData(json))
        .catch((err) => {
          console.error("Failed to load animation", err);
        });
    }
  }, [animationUrl, animationData]);

  return (
    <div className={`min-h-screen bg-gray-50 py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-2 text-center">
        {data && (
          <div className="w-full max-w-xs mx-auto mb-4" style={animationStyle}>
            <Lottie
              animationData={data}
              loop
              autoplay
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        )}
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        {description && <p className="text-gray-600 mb-8">{description}</p>}
        {buttonText && onButtonClick && (
          <button
            onClick={onButtonClick}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition"
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
