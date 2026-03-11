import { useState } from "react";
import { ComposableMap, Geographies, Geography, Annotation } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";

const GEO_URL = "https://raw.githubusercontent.com/geohacker/india/master/state/india.geojson";

const STATE_HIGHLIGHTS: Record<string, { color: string; label: string }> = {
  "Rajasthan":          { color: "#C9973A", label: "Desert Kingdom" },
  "Kerala":             { color: "#4ade80", label: "God's Own Country" },
  "Goa":                { color: "#60a5fa", label: "Pearl of the Orient" },
  "Jammu and Kashmir":  { color: "#a78bfa", label: "Heaven on Earth" },
  "Tamil Nadu":         { color: "#f87171", label: "Land of Temples" },
  "Uttar Pradesh":      { color: "#fbbf24", label: "Heartland of India" },
  "Maharashtra":        { color: "#fb923c", label: "Gateway of India" },
  "West Bengal":        { color: "#34d399", label: "Cultural Capital" },
  "Karnataka":          { color: "#e879f9", label: "Silicon Valley of India" },
  "Gujarat":            { color: "#f59e0b", label: "Land of Gandhi" },
  "Himachal Pradesh":   { color: "#93c5fd", label: "Dev Bhoomi" },
  "Uttarakhand":        { color: "#6ee7b7", label: "Land of Gods" },
  "Madhya Pradesh":     { color: "#fcd34d", label: "Heart of India" },
  "Odisha":             { color: "#f9a8d4", label: "Soul of India" },
  "Assam":              { color: "#86efac", label: "Land of Red River" },
};

interface HoveredState {
  name: string;
  centroid?: [number, number];
  label?: string;
}

export default function IndiaMap() {
  const [hovered, setHovered] = useState<HoveredState | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  return (
    <div className="relative w-full h-full" data-testid="india-map">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [82, 22], scale: 980 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name: string = geo.properties.NAME_1 || geo.properties.name || geo.properties.ST_NM || "";
              const highlight = STATE_HIGHLIGHTS[name];
              const isHovered = hovered?.name === name;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(evt) => {
                    const rect = (evt.target as SVGElement).closest("svg")?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPos({ x: evt.clientX - rect.left, y: evt.clientY - rect.top });
                    }
                    setHovered({ name, label: highlight?.label });
                  }}
                  onMouseMove={(evt) => {
                    const rect = (evt.target as SVGElement).closest("svg")?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPos({ x: evt.clientX - rect.left, y: evt.clientY - rect.top });
                    }
                  }}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    default: {
                      fill: isHovered
                        ? (highlight?.color ?? "rgba(255,255,255,0.25)")
                        : highlight
                        ? `${highlight.color}28`
                        : "rgba(255,255,255,0.06)",
                      stroke: isHovered
                        ? (highlight?.color ?? "rgba(255,255,255,0.7)")
                        : "rgba(255,255,255,0.15)",
                      strokeWidth: isHovered ? 1.2 : 0.5,
                      outline: "none",
                      transition: "fill 0.25s ease, stroke 0.25s ease",
                      cursor: "pointer",
                    },
                    hover: {
                      fill: highlight?.color ?? "rgba(255,255,255,0.25)",
                      stroke: highlight?.color ?? "rgba(255,255,255,0.7)",
                      strokeWidth: 1.2,
                      outline: "none",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      <AnimatePresence>
        {hovered && (
          <motion.div
            key={hovered.name}
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: tooltipPos.x + 16,
              top: tooltipPos.y - 48,
              pointerEvents: "none",
              zIndex: 50,
            }}
          >
            <div
              style={{
                background: "rgba(10,10,10,0.88)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(201,151,58,0.35)",
                borderRadius: 6,
                padding: "8px 14px",
                minWidth: 140,
              }}
            >
              <div
                className="font-cinzel text-white font-semibold"
                style={{ fontSize: 13, letterSpacing: "0.06em" }}
              >
                {hovered.name}
              </div>
              {hovered.label && (
                <div
                  className="font-montserrat uppercase text-amber-400"
                  style={{ fontSize: 8, letterSpacing: "0.2em", marginTop: 3 }}
                >
                  {hovered.label}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
