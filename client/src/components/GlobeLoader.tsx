import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Globe from "react-globe.gl";

const INDIA_LAT = 20.5937;
const INDIA_LNG = 78.9629;
const START_LNG = INDIA_LNG - 180; // opposite side of Earth

// At Three.js OrbitControls: full rotation time = 60000 / autoRotateSpeed ms
const ROTATE_SPEED = 10;
const FULL_SPIN_MS = Math.round(60000 / ROTATE_SPEED); // 6000ms

interface GlobeLoaderProps {
  onComplete: () => void;
}

type Phase = "loading" | "spinning" | "landing" | "zooming" | "done";

export function GlobeLoader({ onComplete }: GlobeLoaderProps) {
  const globeEl = useRef<any>(null);
  const animStarted = useRef(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [visible, setVisible] = useState(true);

  // Step 1: load GeoJSON BEFORE showing globe so it never re-renders mid-animation
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
      .then((r) => r.json())
      .then((data) => {
        setCountries(data.features);
        setPhase("spinning");
      })
      .catch(() => {
        // fallback: show globe with no polygons
        setCountries([]);
        setPhase("spinning");
      });
  }, []);

  // Step 2: once globe is ready, start the animation sequence
  const handleGlobeReady = useCallback(() => {
    if (animStarted.current) return;
    animStarted.current = true;

    const globe = globeEl.current;
    if (!globe) return;

    // Position camera on opposite side of India, far out
    globe.pointOfView({ lat: INDIA_LAT, lng: START_LNG, altitude: 2.2 });

    const ctrl = globe.controls();
    ctrl.autoRotate = true;
    ctrl.autoRotateSpeed = ROTATE_SPEED;
    ctrl.enableZoom = false;
    ctrl.enableRotate = false;
    ctrl.enablePan = false;

    // After one full spin, stop and fly to India
    setTimeout(() => {
      ctrl.autoRotate = false;
      setPhase("landing");

      globe.pointOfView({ lat: INDIA_LAT, lng: INDIA_LNG, altitude: 1.5 }, 1800);

      // Zoom deep into India
      setTimeout(() => {
        setPhase("zooming");
        globe.pointOfView({ lat: INDIA_LAT, lng: INDIA_LNG, altitude: 0.06 }, 2000);

        // Fade out
        setTimeout(() => {
          setPhase("done");
          setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 800);
          }, 200);
        }, 2200);
      }, 2000);
    }, FULL_SPIN_MS);
  }, [onComplete]);

  const getColor = useCallback((feat: any) => {
    const n = feat.properties?.ADMIN || feat.properties?.name || "";
    return n === "India" ? "rgba(255,153,51,0.85)" : "rgba(255,255,255,0.04)";
  }, []);

  const getAltitude = useCallback((feat: any) => {
    const n = feat.properties?.ADMIN || feat.properties?.name || "";
    return n === "India" ? 0.015 : 0.001;
  }, []);

  const labels = [{ lat: INDIA_LAT, lng: INDIA_LNG, text: "INDIA", size: 1.4, color: "#ff9933" }];

  const statusText: Record<Phase, string> = {
    loading:  "Loading…",
    spinning: "Exploring the world…",
    landing:  "Landing on India…",
    zooming:  "Welcome to Incredible India",
    done:     "",
  };

  const progressPct: Record<Phase, string> = {
    loading:  "5%",
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
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Globe — only mount once countries are ready */}
          {phase !== "loading" && (
            <Globe
              ref={globeEl}
              width={window.innerWidth}
              height={window.innerHeight}
              backgroundColor="#000000"
              globeImageUrl="https://unpkg.com/three-globe/example/img/earth-dark.jpg"
              bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
              atmosphereColor="#ff9933"
              atmosphereAltitude={0.22}
              polygonsData={countries}
              polygonCapColor={getColor}
              polygonSideColor={() => "rgba(0,0,0,0)"}
              polygonStrokeColor={() => "rgba(255,255,255,0.07)"}
              polygonAltitude={getAltitude}
              labelsData={phase === "landing" || phase === "zooming" ? labels : []}
              labelText="text"
              labelSize="size"
              labelColor="color"
              labelDotRadius={0.5}
              labelAltitude={0.02}
              onGlobeReady={handleGlobeReady}
              rendererConfig={{ antialias: true, alpha: false }}
            />
          )}

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" />

          {/* Status text + progress bar */}
          <motion.div
            className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3 pointer-events-none"
            animate={{ opacity: phase === "done" ? 0 : 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="font-cinzel text-white/55 text-[11px] tracking-[0.4em] uppercase"
            >
              {statusText[phase]}
            </motion.p>

            <div className="w-44 h-px bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-[#ff9933]"
                animate={{ width: progressPct[phase] }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
