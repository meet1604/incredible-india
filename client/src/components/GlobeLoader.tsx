import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Globe from "react-globe.gl";

const INDIA_LAT = 20.5937;
const INDIA_LNG = 78.9629;

// Start on the exact opposite side of Earth from India so one full spin lands on India
const START_LNG = INDIA_LNG - 180; // ≈ -101

// autoRotateSpeed = 10 → ~6 seconds per full revolution (Three.js OrbitControls: 60/speed seconds)
const ROTATE_SPEED = 10;
const FULL_SPIN_MS = 6000;

interface GlobeLoaderProps {
  onComplete: () => void;
}

export function GlobeLoader({ onComplete }: GlobeLoaderProps) {
  const globeEl = useRef<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [phase, setPhase] = useState<"spinning" | "landing" | "zooming" | "done">("spinning");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
      .then((r) => r.json())
      .then((data) => setCountries(data.features))
      .catch(() => setCountries([]));
  }, []);

  const handleGlobeReady = useCallback(() => {
    const globe = globeEl.current;
    if (!globe) return;

    // Start on opposite side of India
    globe.pointOfView({ lat: INDIA_LAT, lng: START_LNG, altitude: 2.2 });
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = ROTATE_SPEED;
    globe.controls().enableZoom = false;
    globe.controls().enableRotate = false;

    // After one full rotation, stop and fly to India
    setTimeout(() => {
      globe.controls().autoRotate = false;
      setPhase("landing");

      // Smoothly fly to India
      globe.pointOfView({ lat: INDIA_LAT, lng: INDIA_LNG, altitude: 1.6 }, 1800);

      // Then zoom deep into India
      setTimeout(() => {
        setPhase("zooming");
        globe.pointOfView({ lat: INDIA_LAT, lng: INDIA_LNG, altitude: 0.07 }, 1800);

        // Fade out
        setTimeout(() => {
          setPhase("done");
          setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 700);
          }, 200);
        }, 2000);
      }, 2000);
    }, FULL_SPIN_MS);
  }, [onComplete]);

  const getColor = useCallback((feat: any) => {
    const name = feat.properties?.ADMIN || feat.properties?.name || "";
    return name === "India" ? "rgba(255,153,51,0.85)" : "rgba(255,255,255,0.04)";
  }, []);

  const getAltitude = useCallback((feat: any) => {
    const name = feat.properties?.ADMIN || feat.properties?.name || "";
    return name === "India" ? 0.015 : 0.001;
  }, []);

  const labels = [{ lat: INDIA_LAT, lng: INDIA_LNG, text: "INDIA", size: 1.4, color: "#ff9933" }];

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
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Globe */}
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
            labelsData={phase !== "spinning" ? labels : []}
            labelText="text"
            labelSize="size"
            labelColor="color"
            labelDotRadius={0.5}
            labelAltitude={0.02}
            onGlobeReady={handleGlobeReady}
          />

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" />

          {/* Status + progress bar */}
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
