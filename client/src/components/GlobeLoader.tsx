import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INDIA_LAT = 20.5937;
const INDIA_LNG = 78.9629;
const INDIA_ALTITUDE = 1.8;
const ZOOM_ALTITUDE = 0.05;

interface GlobeLoaderProps {
  onComplete: () => void;
}

export function GlobeLoader({ onComplete }: GlobeLoaderProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [phase, setPhase] = useState<"spinning" | "flying" | "zooming" | "done">("spinning");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let globe: any = null;

    async function init() {
      if (!mountRef.current) return;

      const GlobeGL = (await import("globe.gl")).default;

      // Fetch country polygons to highlight India
      const res = await fetch(
        "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
      );
      const countries = await res.json();

      globe = GlobeGL()(mountRef.current)
        .width(window.innerWidth)
        .height(window.innerHeight)
        .backgroundColor("#000000")
        .globeImageUrl(
          "https://unpkg.com/three-globe/example/img/earth-dark.jpg"
        )
        .bumpImageUrl(
          "https://unpkg.com/three-globe/example/img/earth-topology.png"
        )
        .atmosphereColor("#ff9933")
        .atmosphereAltitude(0.18)
        .polygonsData(countries.features)
        .polygonCapColor((feat: any) =>
          feat.properties.name === "India" ? "rgba(255,153,51,0.75)" : "rgba(255,255,255,0.03)"
        )
        .polygonSideColor(() => "rgba(0,0,0,0)")
        .polygonStrokeColor(() => "rgba(255,255,255,0.08)")
        .polygonAltitude((feat: any) =>
          feat.properties.name === "India" ? 0.012 : 0.001
        );

      globeRef.current = globe;

      // Start auto-rotating
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 1.2;
      globe.controls().enableZoom = false;
      globe.controls().enableRotate = false;

      // Point of view: slight tilt, far away
      globe.pointOfView({ lat: 20, lng: 20, altitude: 2.5 });

      // After 2.5s fly to India
      setTimeout(() => {
        setPhase("flying");
        globe.controls().autoRotate = false;

        globe.pointOfView(
          { lat: INDIA_LAT, lng: INDIA_LNG, altitude: INDIA_ALTITUDE },
          1800
        );

        // After fly-in, zoom in close
        setTimeout(() => {
          setPhase("zooming");
          globe.pointOfView(
            { lat: INDIA_LAT, lng: INDIA_LNG, altitude: ZOOM_ALTITUDE },
            1400
          );

          // After zoom, fade out
          setTimeout(() => {
            setPhase("done");
            setTimeout(() => {
              setVisible(false);
              setTimeout(onComplete, 600);
            }, 200);
          }, 1600);
        }, 2000);
      }, 2500);
    }

    init();

    const handleResize = () => {
      if (globeRef.current) {
        globeRef.current.width(window.innerWidth).height(window.innerHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current) mountRef.current.innerHTML = "";
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Globe canvas */}
          <div ref={mountRef} className="absolute inset-0" />

          {/* Bottom label */}
          <motion.div
            className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3 pointer-events-none"
            animate={{ opacity: phase === "done" ? 0 : 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              className="font-cinzel text-white/50 text-xs tracking-[0.4em] uppercase"
              animate={{ opacity: phase === "spinning" ? [0.4, 1, 0.4] : 1 }}
              transition={{ repeat: phase === "spinning" ? Infinity : 0, duration: 2 }}
            >
              {phase === "spinning" && "Exploring the world…"}
              {phase === "flying" && "Heading to India…"}
              {phase === "zooming" && "Welcome to Incredible India"}
            </motion.p>

            {/* Progress bar */}
            <div className="w-48 h-px bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#ff9933] rounded-full"
                initial={{ width: "0%" }}
                animate={{
                  width:
                    phase === "spinning" ? "30%" :
                    phase === "flying" ? "65%" :
                    phase === "zooming" ? "90%" : "100%",
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
