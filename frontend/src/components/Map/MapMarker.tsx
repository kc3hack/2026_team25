import { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import type { StoreWithScore } from "../../types";

interface MapMarkerProps {
  store: StoreWithScore;
}

export function MapMarker({ store }: MapMarkerProps) {
  const controls = useAnimation();
  const prevScoreRef = useRef(store.normalizedScore);

  // "Purun" animation trigger when score crosses 0.7 threshold
  useEffect(() => {
    const prevScore = prevScoreRef.current;
    const currentScore = store.normalizedScore;

    // Trigger "purun" animation when crossing 0.7 from below
    if (prevScore <= 0.7 && currentScore > 0.7) {
      controls.start({
        scale: [1, 1.3, 0.9, 1.1, 1],
        transition: {
          duration: 0.6,
          times: [0, 0.2, 0.4, 0.7, 1],
          type: "spring",
          stiffness: 300,
          damping: 10,
        },
      });
    }

    prevScoreRef.current = currentScore;
  }, [store.normalizedScore, controls]);

  const isRecommended = store.normalizedScore > 0.7;
  // 視覚的インパクトを強めるため、表示サイズを 6px〜44px に拡張
  const size = 6 + store.normalizedScore * 38;

  // Color based on score (from detail.md interpolation rules)
  const getBackgroundStyle = () => {
    if (isRecommended) {
      // Gold-to-pink gradient for recommended
      return "linear-gradient(135deg, #FFD700 0%, #FF69B4 100%)";
    }
    // Use the pinColor from store for common pins
    return store.pinColor;
  };

  // Shadow effect for recommended pins
  const getShadowStyle = () => {
    if (isRecommended) {
      return `0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 105, 180, 0.4)`;
    }
    return "0 2px 4px rgba(0, 0, 0, 0.2)";
  };

  return (
    <motion.div
      className={`map-pin ${store.visible ? "map-pin--visible" : "map-pin--hidden"} ${
        isRecommended ? "map-pin--recommended" : "map-pin--common"
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: getBackgroundStyle(),
        boxShadow: getShadowStyle(),
        // Use CSS custom property for smooth color transitions
        ["--score" as string]: store.normalizedScore,
      }}
      animate={controls}
      initial={{ scale: 1 }}
    >
      {isRecommended && (
        <div className="map-pin__icon">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            width="60%"
            height="60%"
          >
            {/* Fork */}
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7z" />
            {/* Spoon */}
            <path d="M16 6c-1.76 0-3.22 1.31-3.46 3h2.95c.24-1.69 1.7-3 3.46-3V2c-2.76 0-5 2.24-5 5v4.97c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5V13h2.5v9h2.5v-9H23v-1.5c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5V13h-2.5V7c0-2.76-2.24-5-5-5v4z" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}
