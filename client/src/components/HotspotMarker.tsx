import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { type Hotspot } from "@shared/schema";

interface HotspotMarkerProps {
  hotspot: Hotspot;
  onHoverChange: (hovering: boolean) => void;
}

export function HotspotMarker({ hotspot, onHoverChange }: HotspotMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const panelOnLeft = parseFloat(hotspot.x) > 55;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute"
      style={{ left: hotspot.x, top: hotspot.y, transform: "translate(-50%, -50%)", zIndex: 40 }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHoverChange(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverChange(false);
      }}
    >
      {/* Pulse Rings */}
      <div className="relative">
        <div className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 border border-white/30 rounded-full animate-ping" />
        <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
      </div>

      {/* Label */}
      <AnimatePresence>
        {!isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
          >
            <div className="font-cinzel text-[10px] font-bold text-white tracking-wider drop-shadow-lg">
              {hotspot.title}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Panel */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: panelOnLeft ? 20 : -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute top-1/2 -translate-y-1/2 w-64 p-5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-sm shadow-2xl ${
              panelOnLeft ? "right-10" : "left-10"
            }`}
          >
            <div className="font-montserrat text-[8px] text-amber-400 tracking-[0.3em] uppercase mb-2">
              {hotspot.label}
            </div>
            <h3 className="font-cinzel text-lg font-bold text-white mb-1">{hotspot.title}</h3>
            <div className="font-montserrat text-[9px] text-white/40 tracking-widest uppercase mb-3">
              {hotspot.location}
            </div>
            <div className="h-px w-full bg-white/10 mb-3" />
            <p className="font-inter text-xs text-white/70 leading-relaxed">
              {hotspot.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
