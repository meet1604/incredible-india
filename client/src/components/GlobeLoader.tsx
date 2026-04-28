import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Globe from "react-globe.gl";

const INDIA_LAT = 20.5937;
const INDIA_LNG = 78.9629;
const START_LNG = INDIA_LNG - 120; // 120° to the left of India

const ROTATE_SPEED = 4;
const FULL_SPIN_MS = 5000;

interface GlobeLoaderProps {
  onComplete: () => void;
  onPreload?: () => void;
}

export function GlobeLoader({ onComplete, onPreload }: GlobeLoaderProps) {
  const globeEl = useRef<any>(null);
  const [indiaFeature, setIndiaFeature] = useState<any[]>([]);
  const [phase, setPhase] = useState<"spinning" | "landing" | "zooming" | "done">("spinning");
  const [visible, setVisible] = useState(true);

  // Only fetch + parse India's polygon — much lighter than all countries
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
      .then((r) => r.json())
      .then((data) => {
        const india = data.features.filter(
          (f: any) => f.properties?.ADMIN === "India" || f.properties?.name === "India"
        );
        setIndiaFeature(india);
      })
      .catch(() => {});
  }, []);

  const handleGlobeReady = useCallback(() => {
    const globe = globeEl.current;
    if (!globe) return;

    globe.pointOfView({ lat: INDIA_LAT, lng: START_LNG, altitude: 2.2 });
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = ROTATE_SPEED;
    globe.controls().enableZoom = false;
    globe.controls().enableRotate = false;

    // After one full spin, fly to India
    setTimeout(() => {
      globe.controls().autoRotate = false;
      setPhase("landing");
      globe.pointOfView({ lat: INDIA_LAT, lng: INDIA_LNG, altitude: 1.5 }, 1800);

      // Zoom in close — fire preload so home page mounts silently in background
      setTimeout(() => {
        setPhase("zooming");
        globe.pointOfView({ lat: INDIA_LAT, lng: INDIA_LNG, altitude: 0.07 }, 1800);
        onPreload?.();

        // Fade out and hand off
        setTimeout(() => {
          setPhase("done");
          setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 600);
          }, 200);
        }, 2000);
      }, 2000);
    }, FULL_SPIN_MS);
  }, [onComplete]);

  const labelText: Record<string, string> = {
    spinning: "Exploring the world…",
    landing:  "Landing on India…",
    zooming:  "Welcome to Incredible India",
    done:     "",
  };

  const progressWidth: Record<string, string> = {
    spinning: "30%",
    landing:  "65%",
    zooming:  "90%",
    done:     "100%",
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black overflow-hidden"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
        >
          <Globe
            ref={globeEl}
            width={window.innerWidth}
            height={window.innerHeight}
            backgroundColor="#000000"
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-dark.jpg"
            atmosphereColor="#ff9933"
            atmosphereAltitude={0.18}
            // Only render India's polygon — zero cost during spin
            polygonsData={phase !== "spinning" ? indiaFeature : []}
            polygonCapColor={() => "rgba(255,153,51,0.75)"}
            polygonSideColor={() => "rgba(0,0,0,0)"}
            polygonStrokeColor={() => "#ff9933"}
            polygonAltitude={0.012}
            onGlobeReady={handleGlobeReady}
            rendererConfig={{ antialias: false, alpha: false }}
          />

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" />

          {/* Status + progress */}
          <motion.div
            className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3 pointer-events-none"
            animate={{ opacity: phase === "done" ? 0 : 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-cinzel text-white/55 text-[11px] tracking-[0.45em] uppercase"
            >
              {labelText[phase]}
            </motion.p>

            <div className="w-44 h-px bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#ff9933]"
                animate={{ width: progressWidth[phase] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
