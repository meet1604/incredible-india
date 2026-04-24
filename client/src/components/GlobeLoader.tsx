import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Globe from "react-globe.gl";

const INDIA_LAT = 20.5937;
const INDIA_LNG = 78.9629;

interface GlobeLoaderProps {
  onComplete: () => void;
}

export function GlobeLoader({ onComplete }: GlobeLoaderProps) {
  const globeEl = useRef<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [phase, setPhase] = useState<"spinning" | "flying" | "zooming" | "done">("spinning");
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

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 1.4;
    globe.controls().enableZoom = false;
    globe.controls().enableRotate = false;
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

    // Fly to India after 2.5s
    setTimeout(() => {
      setPhase("flying");
      globe.controls().autoRotate = false;
      globe.pointOfView({ lat: INDIA_LAT, lng: INDIA_LNG, altitude: 1.8 }, 2000);

      // Zoom into India
      setTimeout(() => {
        setPhase("zooming");
        globe.pointOfView({ lat: INDIA_LAT, lng: INDIA_LNG, altitude: 0.08 }, 1600);

        // Fade out
        setTimeout(() => {
          setPhase("done");
          setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 700);
          }, 300);
        }, 1800);
      }, 2200);
    }, 2500);
  }, [onComplete]);

  const getColor = useCallback((feat: any) => {
    const name = feat.properties?.ADMIN || feat.properties?.name || "";
    return name === "India" ? "rgba(255,153,51,0.8)" : "rgba(255,255,255,0.04)";
  }, []);

  const getAltitude = useCallback((feat: any) => {
    const name = feat.properties?.ADMIN || feat.properties?.name || "";
    return name === "India" ? 0.015 : 0.001;
  }, []);

  const labels = [
    { lat: INDIA_LAT, lng: INDIA_LNG, text: "INDIA", size: 1.2, color: "#ff9933" },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <Globe
            ref={globeEl}
            width={window.innerWidth}
            height={window.innerHeight}
            backgroundColor="#000000"
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-dark.jpg"
            bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
            atmosphereColor="#ff9933"
            atmosphereAltitude={0.2}
            polygonsData={countries}
            polygonCapColor={getColor}
            polygonSideColor={() => "rgba(0,0,0,0)"}
            polygonStrokeColor={() => "rgba(255,255,255,0.06)"}
            polygonAltitude={getAltitude}
            labelsData={phase === "flying" || phase === "zooming" ? labels : []}
            labelText="text"
            labelSize="size"
            labelColor="color"
            labelDotRadius={0.4}
            labelAltitude={0.02}
            onGlobeReady={handleGlobeReady}
          />

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent pointer-events-none" />

          {/* Status text + progress */}
          <motion.div
            className="absolute bottom-14 left-0 right-0 flex flex-col items-center gap-3 pointer-events-none"
            animate={{ opacity: phase === "done" ? 0 : 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-cinzel text-white/60 text-xs tracking-[0.4em] uppercase"
            >
              {phase === "spinning" && "Exploring the world…"}
              {phase === "flying" && "Heading to India…"}
              {phase === "zooming" && "Welcome to Incredible India"}
            </motion.p>

            <div className="w-40 h-px bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#ff9933]"
                initial={{ width: "0%" }}
                animate={{
                  width:
                    phase === "spinning" ? "25%" :
                    phase === "flying"   ? "60%" :
                    phase === "zooming"  ? "88%" : "100%",
                }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
