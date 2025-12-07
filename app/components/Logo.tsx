"use client";

import Image from "next/image";
import { useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { width: 40, height: 40, textSize: "text-sm" },
  md: { width: 60, height: 60, textSize: "text-base" },
  lg: { width: 80, height: 80, textSize: "text-lg" },
  xl: { width: 120, height: 120, textSize: "text-2xl" },
};

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const dimensions = sizeMap[size];
  const textSize = showText ? dimensions.textSize : "";

  // Si l'image ne charge pas, afficher un logo de fallback
  if (imageError) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div
          className="rounded-lg bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          <span className={textSize}>V</span>
        </div>
        {showText && (
          <div className="mt-2 text-center">
            <h1 className={`font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ${textSize}`}>
              VILAKAZI
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">Services Hôtellerie & Restauration</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
        <Image
          src="/logos/vilakazi-logo.png"
          alt="VILAKAZI Services Hôtellerie & Restauration"
          width={dimensions.width}
          height={dimensions.height}
          className="object-contain"
          onError={() => setImageError(true)}
          priority
        />
      </div>
      {showText && (
        <div className="mt-2 text-center">
          <h1 className={`font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ${textSize}`}>
            VILAKAZI
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">Services Hôtellerie & Restauration</p>
        </div>
      )}
    </div>
  );
}

