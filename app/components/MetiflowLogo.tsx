"use client";

import React from "react";

type MetiflowLogoProps = {
  size?: number;      // total height of the logo block
  textSize?: string;  // Tailwind text size for "metiflow"
  animated?: boolean; // enable subtle wave animation
};

export default function MetiflowLogo({
  size = 80,
  textSize = "text-lg",
  animated = false,
}: MetiflowLogoProps) {
  const waveClass = animated ? "animate-[wave_3s_ease_infinite]" : "";

  return (
    <div
      className="flex items-center gap-2 select-none"
      style={{ height: size }}
    >
      {/* SVG Wave Icon */}
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 140 140"
        className={waveClass}
      >
        {/* Top Wave */}
        <path
          d="M20 60 Q45 25, 70 60 T120 60"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Bottom Wave */}
        <path
          d="M20 85 Q45 50, 70 85 T120 85"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>

      {/* Text */}
      <span
        className={`font-bold ${textSize} bg-gradient-to-r 
        from-indigo-400 to-cyan-400 bg-clip-text text-transparent`}
      >
        metiflow
      </span>

      {/* Keyframes for animation */}
      {animated && (
        <style jsx>{`
          @keyframes wave {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(3px);
            }
            100% {
              transform: translateY(0px);
            }
          }
        `}</style>
      )}
    </div>
  );
}
