"use client";

import { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Calculate scroll progress
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(Math.min(currentProgress, 100));
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="fixed bottom-4 right-4 z-50"
        >
          {/* Progress ring */}
          <div className="absolute inset-0">
            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="rgba(20, 184, 166, 0.2)"
                strokeWidth="3"
              />
              <motion.circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="rgb(20, 184, 166)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: scrollProgress / 100 }}
                transition={{ duration: 0.3 }}
              />
            </svg>
          </div>

          {/* Main button */}
          <motion.button
            onClick={scrollToTop}
            className="relative flex items-center justify-center
                       w-8 h-8 rounded-full
                       bg-gradient-to-br from-red-400 to-red-700
                       text-white shadow-2xl
                       hover:shadow-primary/30
                       transition-all duration-300
                       group"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll to top"
          >
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-full 
                           bg-secondary blur-md opacity-0 
                           group-hover:opacity-40 transition-opacity"
            />

            {/* Inner glow */}
            <div
              className="absolute inset-2 rounded-full 
                           bg-gradient-to-br from-secondary/30 to-transparent"
            />

            {/* Arrow with animation */}
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
              className="relative z-10"
            >
              <FaArrowUp className="text-sm" />
            </motion.div>
          </motion.button>

          {/* Floating particles */}
          <div className="absolute -top-2 -right-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-secondary rounded-full"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.3,
                }}
                style={{
                  left: `${i * 4}px`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
