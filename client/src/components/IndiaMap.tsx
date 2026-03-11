import { useState, useEffect, useRef } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { motion, AnimatePresence } from "framer-motion";

const STATE_META: Record<string, { color: string; label: string }> = {
  "Rajasthan":         { color: "#C9973A", label: "Desert Kingdom" },
  "Kerala":            { color: "#4ade80", label: "God's Own Country" },
  "Goa":               { color: "#60a5fa", label: "Pearl of the Orient" },
  "Jammu & Kashmir":   { color: "#a78bfa", label: "Heaven on Earth" },
  "Tamil Nadu":        { color: "#f87171", label: "Land of Temples" },
  "Uttar Pradesh":     { color: "#fbbf24", label: "Heartland of India" },
  "Maharashtra":       { color: "#fb923c", label: "Gateway of India" },
  "West Bengal":       { color: "#34d399", label: "Cultural Capital" },
  "Karnataka":         { color: "#e879f9", label: "Silicon Valley of India" },
  "Gujarat":           { color: "#f59e0b", label: "Land of Gandhi" },
  "Himachal Pradesh":  { color: "#93c5fd", label: "Dev Bhoomi" },
  "Uttarakhand":       { color: "#6ee7b7", label: "Land of Gods" },
  "Madhya Pradesh":    { color: "#fcd34d", label: "Heart of India" },
  "Odisha":            { color: "#f9a8d4", label: "Soul of India" },
  "Assam":             { color: "#86efac", label: "Land of Red River" },
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
            const meta = STATE_META[name];
            const isHovered = hovered === name;
            const d = pathGen(feature) ?? "";

            return (
              <path
                key={i}
                d={d}
                fill={
                  isHovered
                    ? meta?.color ?? "rgba(255,255,255,0.28)"
                    : meta
                    ? `${meta.color}22`
                    : "rgba(255,255,255,0.06)"
                }
                stroke={
                  isHovered
                    ? meta?.color ?? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.18)"
                }
                strokeWidth={isHovered ? 1.4 : 0.5}
                style={{
                  transition: "fill 0.22s ease, stroke 0.22s ease, stroke-width 0.22s ease",
                  cursor: "pointer",
                  filter:
                    isHovered && meta
                      ? `drop-shadow(0 0 8px ${meta.color}60)`
                      : "none",
                }}
                onMouseEnter={(e) => {
                  setHovered(name);
                  const rect = (e.target as SVGElement)
                    .closest("svg")!
                    .getBoundingClientRect();
                  setTooltip({
                    name,
                    label: meta?.label,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseMove={(e) => {
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
                border: `1px solid ${
                  STATE_META[tooltip.name]?.color ?? "rgba(255,255,255,0.15)"
                }55`,
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
                    color:
                      STATE_META[tooltip.name]?.color ?? "#C9973A",
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
