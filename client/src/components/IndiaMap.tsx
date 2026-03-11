import { useState, useEffect, useRef } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { motion, AnimatePresence } from "framer-motion";

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

export default function IndiaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [error, setError] = useState(false);
  const [size, setSize] = useState({ w: 600, h: 700 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

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

      {geoData && (
        <svg
          width={size.w}
          height={size.h}
          style={{ display: "block" }}
          onMouseLeave={() => {
            setHovered(null);
            setTooltip(null);
          }}
        >
          {geoData.features.map((feature: any, i: number) => {
            const name: string = feature.properties?.ST_NM ?? "";
            const isHovered = hovered === name;
            const d = pathGen(feature) ?? "";

            return (
              <path
                key={i}
                d={d}
                fill={isHovered ? "#FACC15" : "#2a2a2a"}
                stroke={isHovered ? "#FDE047" : "#444444"}
                strokeWidth={isHovered ? 1.2 : 0.6}
                style={{
                  transition: "fill 0.2s ease, stroke 0.2s ease",
                  cursor: "pointer",
                  filter: isHovered
                    ? "drop-shadow(0 0 10px rgba(250,204,21,0.5))"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  setHovered(name);
                  const rect = (e.target as SVGElement)
                    .closest("svg")!
                    .getBoundingClientRect();
                  setTooltip({
                    name,
                    label: STATE_LABELS[name],
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseMove={(e) => {
                  const rect = (e.target as SVGElement)
                    .closest("svg")!
                    .getBoundingClientRect();
                  setTooltip((t) =>
                    t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : t
                  );
                }}
                onMouseLeave={() => {
                  setHovered(null);
                  setTooltip(null);
                }}
              />
            );
          })}
        </svg>
      )}

      <AnimatePresence>
        {tooltip && (
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
                border: "1px solid rgba(250,204,21,0.4)",
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
                    color: "#FACC15",
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
}
