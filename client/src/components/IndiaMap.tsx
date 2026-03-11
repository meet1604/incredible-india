import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

const STATE_LABELS: Record<string, string> = {
  "Rajasthan":         "Desert Kingdom",
  "Kerala":            "God's Own Country",
  "Goa":               "Pearl of the Orient",
  "Jammu & Kashmir":   "Heaven on Earth",
  "Tamil Nadu":        "Land of Temples",
  "Uttar Pradesh":     "Heartland of India",
  "Maharashtra":       "Gateway of India",
  "West Bengal":       "Cultural Capital",
  "Karnataka":         "Silicon Valley of India",
  "Gujarat":           "Land of Gandhi",
  "Himachal Pradesh":  "Dev Bhoomi",
  "Uttarakhand":       "Land of Gods",
  "Madhya Pradesh":    "Heart of India",
  "Odisha":            "Soul of India",
  "Assam":             "Land of Red River",
  "Punjab":            "Land of Five Rivers",
  "Haryana":           "Green Revolution State",
  "Bihar":             "Cradle of Civilisation",
  "Chhattisgarh":      "Rice Bowl of India",
  "Jharkhand":         "Land of Forests",
  "Andhra Pradesh":    "Land of Spices",
  "Telangana":         "City of Pearls",
  "Sikkim":            "Land of Mystic Splendour",
  "Meghalaya":         "Scotland of the East",
  "Arunachal Pradesh": "Land of the Dawn-Lit Mountains",
  "Manipur":           "Jewel of India",
  "Nagaland":          "Land of Festivals",
  "Mizoram":           "Land of the Blue Mountain",
  "Tripura":           "Land of Fourteen Gods",
};

interface TooltipState {
  name: string;
  label?: string;
  x: number;
  y: number;
}

export interface IndiaMapHandle {
  resetZoom: () => void;
}

interface IndiaMapProps {
  onKeralaClick?: () => void;
}

const IndiaMap = forwardRef<IndiaMapHandle, IndiaMapProps>(function IndiaMap(
  { onKeralaClick },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [size, setSize] = useState({ w: 600, h: 700 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [zooming, setZooming] = useState(false);

  useImperativeHandle(ref, () => ({
    resetZoom() {
      if (!svgWrapperRef.current) return;
      gsap.to(svgWrapperRef.current, {
        scale: 1,
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => setZooming(false),
      });
    },
  }));

  useEffect(() => {
    fetch("/india_states.geojson")
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then(setGeoData)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const projection = geoMercator()
    .center([82, 22])
    .scale(Math.min(size.w, size.h) * 1.38)
    .translate([size.w / 2, size.h / 2]);

  const pathGen = geoPath().projection(projection);

  const handleKeralaClick = (feature: any) => {
    if (zooming || !svgWrapperRef.current) return;
    setZooming(true);
    setHovered(null);
    setTooltip(null);

    const centroid = pathGen.centroid(feature);
    const [cx, cy] = centroid;
    const s = 120;
    const tx = (size.w / 2 - cx) * (s - 1);
    const ty = (size.h / 2 - cy) * (s - 1);

    gsap.to(svgWrapperRef.current, {
      scale: s,
      x: tx,
      y: ty,
      opacity: 0,
      duration: 1.3,
      ease: "power2.inOut",
    });

    gsap.delayedCall(0.7, () => {
      onKeralaClick?.();
    });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full" data-testid="india-map">
      {!geoData && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span className="font-montserrat text-white/30 text-[10px] tracking-[0.3em] uppercase">
              Loading map…
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-montserrat text-white/25 text-[11px] tracking-[0.2em] uppercase">
            Map unavailable
          </span>
        </div>
      )}

      {/* Kerala click hint */}
      {geoData && !zooming && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <span
            className="font-montserrat text-white/25 uppercase"
            style={{ fontSize: 9, letterSpacing: "0.3em" }}
          >
            Click Kerala to explore
          </span>
        </div>
      )}

      {/* SVG wrapper — zooms on Kerala click */}
      <div ref={svgWrapperRef} style={{ width: "100%", height: "100%", transformOrigin: "center center" }}>
        {geoData && (
          <svg
            width={size.w}
            height={size.h}
            style={{ display: "block" }}
            onMouseLeave={() => {
              if (!zooming) {
                setHovered(null);
                setTooltip(null);
              }
            }}
          >
            {geoData.features.map((feature: any, i: number) => {
              const name: string = feature.properties?.ST_NM ?? "";
              const isKerala = name === "Kerala";
              const isHovered = hovered === name;
              const d = pathGen(feature) ?? "";

              return (
                <path
                  key={i}
                  d={d}
                  fill={
                    isHovered
                      ? isKerala ? "#4ade80" : "#FACC15"
                      : isKerala ? "#1a3a2a" : "#2a2a2a"
                  }
                  stroke={
                    isHovered
                      ? isKerala ? "#4ade80" : "#FDE047"
                      : isKerala ? "#2d5a3d" : "#444444"
                  }
                  strokeWidth={isHovered ? 1.4 : isKerala ? 0.8 : 0.6}
                  style={{
                    transition: "fill 0.2s ease, stroke 0.2s ease",
                    cursor: isKerala ? "pointer" : "default",
                    filter: isHovered && isKerala
                      ? "drop-shadow(0 0 12px rgba(74,222,128,0.6))"
                      : isHovered
                      ? "drop-shadow(0 0 10px rgba(250,204,21,0.5))"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (zooming) return;
                    setHovered(name);
                    const rect = (e.target as SVGElement)
                      .closest("svg")!
                      .getBoundingClientRect();
                    setTooltip({
                      name,
                      label: isKerala ? "Click to Explore ✦" : STATE_LABELS[name],
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseMove={(e) => {
                    if (zooming) return;
                    const rect = (e.target as SVGElement)
                      .closest("svg")!
                      .getBoundingClientRect();
                    setTooltip((t) =>
                      t
                        ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top }
                        : t
                    );
                  }}
                  onMouseLeave={() => {
                    if (!zooming) {
                      setHovered(null);
                      setTooltip(null);
                    }
                  }}
                  onClick={isKerala ? () => handleKeralaClick(feature) : undefined}
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && !zooming && (
          <motion.div
            key={tooltip.name}
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: tooltip.x + 14,
              top: tooltip.y - 60,
              pointerEvents: "none",
              zIndex: 50,
            }}
          >
            <div
              style={{
                background: "rgba(8,8,8,0.92)",
                backdropFilter: "blur(14px)",
                border: `1px solid ${tooltip.name === "Kerala" ? "rgba(74,222,128,0.5)" : "rgba(250,204,21,0.4)"}`,
                borderRadius: 6,
                padding: "8px 14px",
                minWidth: 130,
              }}
            >
              <div
                className="font-cinzel text-white font-semibold"
                style={{ fontSize: 12, letterSpacing: "0.07em" }}
              >
                {tooltip.name}
              </div>
              {tooltip.label && (
                <div
                  className="font-montserrat uppercase"
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    marginTop: 3,
                    color: tooltip.name === "Kerala" ? "#4ade80" : "#FACC15",
                  }}
                >
                  {tooltip.label}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default IndiaMap;
