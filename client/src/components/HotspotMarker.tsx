import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MapPin } from "lucide-react";
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
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute"
      style={{ left: hotspot.x, top: hotspot.y, transform: "translate(-50%, -50%)", zIndex: 40 }}
      onMouseEnter={() => { setIsHovered(true); onHoverChange(true); }}
      onMouseLeave={() => { setIsHovered(false); onHoverChange(false); }}
    >
      {/* Dot + rings */}
      <div className="relative flex items-center justify-center cursor-pointer">
        {/* Outer slow pulse */}
        <motion.div
          className="absolute rounded-full border border-amber-400/30"
          animate={{ width: isHovered ? 44 : 36, height: isHovered ? 44 : 36, opacity: [0.3, 0, 0.3] }}
          transition={{ opacity: { repeat: Infinity, duration: 2 }, width: { duration: 0.3 }, height: { duration: 0.3 } }}
        />
        {/* Inner ring */}
        <motion.div
          className="absolute rounded-full border border-amber-400/50"
          animate={{ width: isHovered ? 26 : 20, height: isHovered ? 26 : 20 }}
          transition={{ duration: 0.3 }}
        />
        {/* Core dot */}
        <motion.div
          className="relative w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]"
          animate={{ scale: isHovered ? 1.3 : 1 }}
          transition={{ duration: 0.25 }}
        />
      </div>

      {/* Title label — visible when not hovered */}
      <AnimatePresence>
        {!isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
          >
            <span className="font-cinzel text-[9px] font-semibold text-white/80 tracking-widest drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {hotspot.title}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info card — visible on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: panelOnLeft ? 12 : -12, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: panelOnLeft ? 12 : -12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`absolute top-1/2 -translate-y-1/2 w-60 ${panelOnLeft ? "right-8" : "left-8"}`}
          >
            {/* Connector line */}
            <div
              className={`absolute top-1/2 -translate-y-px h-px w-6 bg-amber-400/40 ${panelOnLeft ? "right-full" : "left-full"}`}
            />

            {/* Card */}
            <div className="relative bg-black/75 backdrop-blur-2xl border border-white/10 rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
              {/* Top accent line */}
              <div className="h-px w-full bg-gradient-to-r from-amber-400/60 via-amber-400/20 to-transparent" />

              <div className="p-4">
                {/* Label badge */}
                <div className="inline-flex items-center gap-1.5 mb-3">
                  <div className="w-1 h-1 rounded-full bg-amber-400" />
                  <span className="font-montserrat text-[8px] text-amber-400 tracking-[0.3em] uppercase">
                    {hotspot.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-cinzel text-base font-bold text-white leading-tight mb-1">
                  {hotspot.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 mb-3">
                  <MapPin className="w-2.5 h-2.5 text-white/30 shrink-0" />
                  <span className="font-montserrat text-[9px] text-white/35 tracking-widest uppercase">
                    {hotspot.location}
                  </span>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-white/8 mb-3" />

                {/* Description */}
                <p className="font-inter text-[11px] text-white/60 leading-relaxed">
                  {hotspot.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
