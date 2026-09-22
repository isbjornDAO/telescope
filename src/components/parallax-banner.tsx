"use client";

import React, { useState, useRef, useEffect } from "react";

interface ParallaxLayerConfig {
  name: string;
  file?: string;
  duration: number; // in seconds for full infinite loop
  opacity?: number;
  activeSlots?: number[]; // Only render image on these slot indices (0..TILES_PER_GROUP-1)
  isCustomStars?: boolean;
  className?: string; // Optional class applied to the layer container
}

// 9 distinct star paths from stars.svg (optimized)
const STAR_PATHS = [
  "M1114.7 217.4C1115.6 217.8 1116.8 218.3 1118.1 218.8C1122 226 1120.6 242.1 1125.1 249.8C1130.5 259 1142.3 255.4 1148 262.4L1147.5 264.5C1144.3 267.5 1141 265.3 1135.3 267.7C1117.1 275.5 1123.6 293.5 1118.8 306.8C1112 305.9 1113.3 302.5 1112.3 296.7C1110.9 289.3 1110.7 282.4 1107.9 275.3C1104.5 266.6 1089.7 268.1 1085.4 262.9C1084.7 255.6 1099.3 259.4 1105.4 252.3C1113.3 243.3 1110.5 224.4 1114.7 217.4Z",
  "M2286.7 153.4C2287.6 153.8 2288.8 154.3 2290.1 154.8C2294 162 2292.6 178.1 2297.1 185.8C2302.5 195 2314.3 191.4 2320 198.4L2319.5 200.5C2316.3 203.6 2310.8 201.7 2304.5 204.9C2290.4 212.1 2294.9 231.5 2290.8 242.8C2284 241.9 2285.3 238.4 2284.3 232.7C2282.9 225.3 2282.7 218.4 2280 211.3C2276.5 202.5 2261.7 204.1 2257.4 198.9C2256.8 191.6 2271.3 195.4 2277.5 188.3C2285.3 179.3 2282.5 160.4 2286.7 153.4Z",
  "M1394.7 436C1400.2 428.6 1403.6 420.3 1404.9 411.2C1405.8 404.5 1405.1 391.5 1411.2 387.1C1418.5 389.1 1415 422 1429.9 438C1437.1 440.9 1452.2 441.2 1455.4 448.2C1451.8 453.5 1437 453.9 1430.3 457.9C1422.2 462.8 1420.5 472.5 1418.2 481.1C1417.3 489.3 1418 499.3 1412.5 505.1L1410.5 505.7C1405.2 502.5 1405.9 491.8 1405.6 486.2C1399.4 443.2 1379.2 458 1371.1 450.8C1369.1 449.1 1369 448.2 1368.8 445.8C1373.7 439.2 1383.2 442.5 1394.7 436Z",
  "M1694 216.4C1695.2 214.1 1695.5 213.9 1697.7 212.4C1701.4 212.6 1700.3 212.5 1703.6 215.3C1702.1 225.4 1704.7 243.7 1711.3 252C1717.9 260.3 1727.5 260.9 1737 263.7C1738.3 264.1 1737.9 266.2 1737.8 267.3C1732.9 274.9 1716.2 270.3 1710.7 281C1704.6 292.8 1705.5 307.7 1701.1 319.4C1700.1 319.7 1699.3 320 1698.5 320.2C1696.9 319.4 1695 318.4 1694.8 316.3C1693.1 301.1 1694.4 284.2 1679.8 274.6C1674.2 270.9 1662 270.2 1659.6 267.4C1660.1 265.6 1660.4 264.1 1662.6 263.3C1676.5 258.3 1685.4 258.4 1691.1 242.4C1693 237.2 1694.9 222.3 1694 216.4Z",
  "M171.7 297C181.5 282.8 180.7 275.5 183.4 259C184.2 254.5 184.8 251.7 188.5 249.3C189.8 249.8 192.5 251.2 192.6 252.8C193.4 266.4 194.7 278.6 200.6 291C202.6 293.9 204.3 296.6 206.9 299C216.7 302.4 228.2 302.1 231.4 307.8C227.9 318.8 205.6 310.7 199.7 328C197.7 334 192.3 365.9 188.1 368C180.2 362.6 184.3 326.9 171.3 318.9C164.3 314.5 149.5 313.8 145.8 311L145.6 307.6C148.4 300.2 160.7 303.4 171.7 297Z",
  "M725 272.2C725.8 272.6 729.1 273.9 729.3 274.3C733.7 287.1 732.2 301.3 738.9 313.8C744 323.2 761.5 319.5 765.7 326.6C765.6 335.5 747.9 330.9 740 340.2C730.9 350.7 733.9 375.2 728.7 382.3C727.5 382 724.4 380.9 724.1 379.9C720.2 368.9 721.4 353.3 715.9 342.4C709.9 330.6 693.2 335.7 688.1 327.1C689.8 319 706.2 323.9 713.8 314.2C723.3 302.2 719.3 280.4 725 272.2Z",
  "M2249.9 539.3C2251.4 539.8 2254.2 540.5 2254.6 542C2257.8 552.9 2257.1 566.1 2262.1 576.8C2266.9 587 2282.6 583 2287.9 590.8L2287.4 593.1C2283.9 595.9 2275.1 596.7 2270 598.6C2254.7 604.3 2258.8 631.9 2254.6 641.6C2243.5 641 2248 616.1 2242.5 605.9C2236.1 594.3 2214.8 597.1 2216.5 588.6C2219 586.6 2227.2 584.6 2230.8 584C2249.8 580.7 2244.2 549.2 2249.9 539.3Z",
  "M954.8 522.3C956.4 522.8 959.2 523.5 959.6 525C962.8 535.9 962 549.1 967.1 559.8C971.9 570 987.5 566 992.9 573.8L992.4 576.1C988.9 578.9 980 579.7 975 581.6C959.7 587.3 963.8 614.9 959.6 624.6C948.5 624 953 599.1 947.5 588.9C941.1 577.3 919.8 580.1 921.5 571.6C924 569.6 932.2 567.6 935.8 567C954.8 563.7 949.2 532.2 954.8 522.3Z",
  "M1935.8 419.3C1937 419.6 1939.3 420.6 1939.6 421.7C1942.6 434.8 1940.8 441 1948.8 452.3C1953.9 453.7 1959.8 454.3 1963.5 457.4L1963.6 459.4C1960.1 462.6 1953.7 463.5 1948.8 464.7C1941.2 475.9 1941.4 483.6 1939.7 496.8C1938 496.5 1937.2 496.2 1935.7 495.6C1931.6 489.2 1935.7 475.6 1928.4 468.1C1923.8 463.5 1912.5 460.8 1911.1 457.5C1914.2 454.1 1921.2 453.1 1926 452.1C1936.7 437 1931.2 428 1935.8 419.3Z",
];

const LAYERS: ParallaxLayerConfig[] = [
  {
    name: "sky",
    file: "sky.svg",
    duration: 600,
  },
  {
    name: "stars",
    isCustomStars: true,
    duration: 400,
  },
  {
    name: "clouds",
    file: "clouds.svg",
    duration: 300,
    activeSlots: [0, 1, 3], // Natural cloud formations with open sky gaps
    className: "-top-12 sm:-top-16 md:-top-20",
  },
  {
    name: "mountains_back",
    file: "mountains_back.svg",
    duration: 220,
  },
  {
    name: "trees_back",
    file: "trees_back.svg",
    duration: 180,
    opacity: 0.95,
  },
  {
    name: "mountains_front",
    file: "mountains_front.svg",
    duration: 160,
  },
  {
    name: "floor",
    file: "floor.svg",
    duration: 120,
  },
  {
    name: "lake",
    file: "lake.svg",
    duration: 120,
    // Alternates between lake clearings and snowy forest (slots 0 and 2 out of 4)
    activeSlots: [0, 2],
  },
  {
    name: "snow_bear",
    duration: 120,
    // Snow clearings only (slots 1 and 3 never have a lake; slots 0 and 2 are lakes)
    activeSlots: [1, 3],
  },
  {
    name: "trees",
    file: "trees.svg",
    duration: 85,
  },
];

// 4 tiles per group is optimal: covers screens up to 2000px wide while keeping DOM elements minimal
const TILES_PER_GROUP = 4;

type MountainMode = "seamless" | "duo" | "variant_2" | "variant_3";

/**
 * Single Moon Component:
 * Guarantees that at most 1 moon is ever present on the screen.
 * Slowly drifts across the starry sky, exits, pauses for a randomized quiet duration,
 * and re-emerges with varied celestial pace and vertical position.
 */
function SingleMoon() {
  const [moon, setMoon] = useState<{
    key: number;
    isVisible: boolean;
    duration: number;
    topOffset: number;
    initialDelay: number;
  }>({
    key: 1,
    isVisible: true,
    duration: 720, // Far in the background, ultra-slow celestial drift (~2.8px/s)
    topOffset: 6,
    initialDelay: -200, // Poised high in the upper starry sky on load
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAnimationEnd = () => {
    setMoon((prev) => ({ ...prev, isVisible: false }));
    // Wait for a randomized interval between 35s and 75s
    const delay = Math.floor(Math.random() * 40000 + 35000);
    timeoutRef.current = setTimeout(() => {
      setMoon({
        key: Date.now(),
        isVisible: true,
        duration: Math.floor(Math.random() * 100 + 680), // 680s to 780s
        topOffset: Math.floor(Math.random() * 16),
        initialDelay: 0,
      });
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!moon.isVisible) return null;

  return (
    <div
      key={moon.key}
      className="parallax-moon-layer absolute inset-y-0 left-0 pointer-events-none will-change-transform animate-moon-traverse"
      style={{
        animationDuration: `${moon.duration}s`,
        animationDelay: `${moon.initialDelay}s`,
        top: `${moon.topOffset}px`,
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      <img
        src="/bg/moon.svg"
        alt=""
        draggable={false}
        loading="eager"
        decoding="async"
        className="h-full w-auto max-w-none flex-shrink-0 select-none object-cover pointer-events-none drop-shadow-[0_0_12px_rgba(223,247,254,0.35)]"
        style={{
          aspectRatio: "2400 / 1080",
        }}
      />
    </div>
  );
}

/**
 * Lightweight dynamic star tile:
 * Uses pure GPU-composited opacity transitions (zero blur/drop-shadow re-rasterization)
 */
function DynamicStarTile() {
  return (
    <svg
      viewBox="0 0 2400 1080"
      fill="#8DCDE9"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-auto max-w-none flex-shrink-0 select-none pointer-events-none"
      style={{ aspectRatio: "2400 / 1080" }}
      aria-hidden="true"
    >
      {STAR_PATHS.map((d, index) => {
        const animClass = `star-twinkle-${(index % 4) + 1}`;
        return (
          <path
            key={`star-${index}`}
            d={d}
            className={animClass}
          />
        );
      })}
    </svg>
  );
}

export interface ParallaxBannerProps {
  mountainVariant?: MountainMode;
}

export function ParallaxBanner({ mountainVariant = "seamless" }: ParallaxBannerProps) {
  // Randomly determines if the fox appears on the lake during each loop cycle
  const [foxActive, setFoxActive] = useState(true);

  // Very rare appearance of the snow bear (appears only in snowy clearings, never on a lake)
  const [bearSlot, setBearSlot] = useState<number | null>(null);

  useEffect(() => {
    // Very rare chance (~12%) for the snow bear to appear in the initial cycle
    // (slot 1 or 3 is off-screen initially, so zero visual pop on page load)
    if (Math.random() < 0.12) {
      setBearSlot(Math.random() > 0.5 ? 1 : 3);
    }
  }, []);

  const mountainMode = mountainVariant;

  const renderLayerTile = (layer: ParallaxLayerConfig, slotIndex: number, keyPrefix: string) => {
    const isSlotActive = !layer.activeSlots || layer.activeSlots.includes(slotIndex);

    if (!isSlotActive) {
      return (
        <div
          key={`${keyPrefix}-spacer-${slotIndex}`}
          className="h-full w-auto max-w-none flex-shrink-0 pointer-events-none"
          style={{ aspectRatio: "2400 / 1080" }}
          aria-hidden="true"
        />
      );
    }

    if (layer.isCustomStars) {
      return <DynamicStarTile key={`${keyPrefix}-stars-${slotIndex}`} />;
    }

    // Snow Bear: very rare appearance in snowy clearings (slots 1 and 3, never on top of a lake)
    if (layer.name === "snow_bear") {
      const isBearSlot = bearSlot !== null && slotIndex === bearSlot;
      if (!isBearSlot) {
        return (
          <div
            key={`${keyPrefix}-spacer-${slotIndex}`}
            className="h-full w-auto max-w-none flex-shrink-0 pointer-events-none"
            style={{ aspectRatio: "2400 / 1080" }}
            aria-hidden="true"
          />
        );
      }

      return (
        <div
          key={`${keyPrefix}-snow-bear-${slotIndex}`}
          className="h-full w-auto max-w-none flex-shrink-0 flex items-center justify-center pointer-events-none"
          style={{ aspectRatio: "2400 / 1080" }}
        >
          <img
            src="/bg/snow_bear.svg"
            alt=""
            draggable={false}
            loading="eager"
            decoding="async"
            className="h-full w-auto max-w-none flex-shrink-0 select-none object-contain pointer-events-none"
            style={{ aspectRatio: "1200 / 1080" }}
          />
        </div>
      );
    }

    let file: string | undefined = layer.file;

    // Mountain variations:
    // When "seamless", all slots render mountains_front.svg for an uninterrupted continuous range.
    // When in standalone modes ("duo", "variant_2", "variant_3"), the standalone mountains are rendered
    // with spacer slots so they appear as unique isolated formations without connecting to mountains_front.
    if (layer.name === "mountains_front") {
      if (mountainMode === "seamless") {
        file = "mountains_front.svg";
      } else if (mountainMode === "duo") {
        if (slotIndex === 0) file = "mountains_front_2.svg";
        else if (slotIndex === 2) file = "mountains_front_3.svg";
        else file = undefined;
      } else if (mountainMode === "variant_2") {
        if (slotIndex === 0 || slotIndex === 2) file = "mountains_front_2.svg";
        else file = undefined;
      } else if (mountainMode === "variant_3") {
        if (slotIndex === 0 || slotIndex === 2) file = "mountains_front_3.svg";
        else file = undefined;
      }
    }

    // Lake & Fox appear together:
    // Slot 0 renders the open frozen lake (lake.svg)
    // Slot 2 renders the frozen lake with the arctic fox sitting on it (fox.svg)
    if (layer.name === "lake") {
      const isFoxSlot = slotIndex === 2;
      file = isFoxSlot && foxActive ? "fox.svg" : "lake.svg";
    }

    if (!file) {
      return (
        <div
          key={`${keyPrefix}-spacer-${slotIndex}`}
          className="h-full w-auto max-w-none flex-shrink-0 pointer-events-none"
          style={{ aspectRatio: "2400 / 1080" }}
          aria-hidden="true"
        />
      );
    }

    return (
      <img
        key={`${keyPrefix}-${layer.name}-${slotIndex}-${file}`}
        src={`/bg/${file}`}
        alt=""
        draggable={false}
        loading="eager"
        decoding="async"
        className="h-full w-auto max-w-none flex-shrink-0 select-none object-cover pointer-events-none"
        style={{
          aspectRatio: "2400 / 1080",
        }}
      />
    );
  };

  const renderLayer = (layer: ParallaxLayerConfig) => (
    <div
      key={layer.name}
      className={`parallax-layer absolute inset-0 w-full h-full overflow-hidden will-change-transform ${layer.className ?? ""}`}
    >
      <div
        className="parallax-track flex h-full w-max will-change-transform animate-parallax-scroll-left"
        style={{
          animationDuration: `${layer.duration}s`,
          opacity: layer.opacity ?? 1,
        }}
        onAnimationIteration={
          layer.name === "lake"
            ? () => {
                setFoxActive(Math.random() > 0.35);
                // Very rare appearance (~12% chance per cycle) for the snow bear on snow clearings
                if (Math.random() < 0.12) {
                  setBearSlot(Math.random() > 0.5 ? 1 : 3);
                } else {
                  setBearSlot(null);
                }
              }
            : undefined
        }
      >
        {/* Group A */}
        <div className="flex h-full shrink-0">
          {Array.from({ length: TILES_PER_GROUP }).map((_, i) =>
            renderLayerTile(layer, i, "a")
          )}
        </div>

        {/* Group B (identical duplicate for seamless infinite looping) */}
        <div className="flex h-full shrink-0">
          {Array.from({ length: TILES_PER_GROUP }).map((_, i) =>
            renderLayerTile(layer, i, "b")
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="parallax-banner-wrapper absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none"
      aria-hidden="true"
    >
      {/* Base sky color */}
      <div className="absolute inset-0 bg-[#365488] dark:bg-[#142030]" />

      {/* Parallax Layers Container */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 1. Deep Sky & Stars */}
        {LAYERS.slice(0, 2).map(renderLayer)}

        {/* 2. Moon (Ultra-slow celestial parallax far behind in deep space) */}
        <SingleMoon />

        {/* 3. Clouds, Mountains, Trees Back, Floor, Lake (with Fox on lake), Trees */}
        {LAYERS.slice(2).map(renderLayer)}
      </div>

      {/* Atmospheric depth vignetting & dark mode polar night tint */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/15 via-transparent to-black/25 dark:from-black/45 dark:via-black/15 dark:to-[#12151a]/65" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_-4px_14px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_-4px_18px_rgba(0,0,0,0.55)]" />
    </div>
  );
}
