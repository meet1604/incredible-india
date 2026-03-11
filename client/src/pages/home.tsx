import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, MapPin, ArrowRight, Globe, Camera, Mountain, Waves, Star, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import IndiaMap, { IndiaMapHandle } from "@/components/IndiaMap";
import KeralaOverlay from "@/components/KeralaOverlay";

gsap.registerPlugin(ScrollTrigger);

const destinations = [
  {
    id: 1,
    name: "Incredible India",
    location: "From the Himalayas to the Tropics",
    tagline: "A Thousand Worlds in One",
    description: "From ancient marble mausoleums to snow-laced Himalayan passes, misty rainforest canyons to silk-lit palace lakes — India holds entire worlds within a single journey.",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1920&q=85&auto=format&fit=crop",
    color: "#d4a373",
    category: "Cinematic Journey",
  },
];

// One hotspot per video scene — timeStart/timeEnd in seconds (video = 119s, 15 scenes ≈ 7.9s each)
type TimeHotspot = { timeStart: number; timeEnd: number; x: string; y: string; label: string; title: string; location: string; desc: string };
const TIME_HOTSPOTS: TimeHotspot[] = [
  { timeStart: 0,    timeEnd: 7.5,  x: "57%", y: "46%", label: "UNESCO World Heritage", title: "Taj Mahal",          location: "Agra, Uttar Pradesh",        desc: "Built over 22 years by 22,000 artisans — Shah Jahan's eternal declaration of love rises 73 metres in pure white marble above the sacred Yamuna." },
  { timeStart: 8,    timeEnd: 15.5, x: "63%", y: "37%", label: "Ancient Buddhist Monastery", title: "Key Monastery", location: "Spiti Valley, Himachal Pradesh", desc: "Clinging to a rocky cliff at 4,166 metres, Key Monastery has stood for 1,000 years as one of the world's highest places of Buddhist learning." },
  { timeStart: 16,   timeEnd: 23.5, x: "50%", y: "33%", label: "The Great Himalayas",   title: "Himalayan Peaks",   location: "Northern India",              desc: "The highest mountain range on Earth — a 2,500 km wall of ice and stone that shapes the climate, culture and spirituality of an entire subcontinent." },
  { timeStart: 24,   timeEnd: 31.5, x: "44%", y: "56%", label: "Mountain Highway",      title: "Manali Road",       location: "Himachal Pradesh",            desc: "One of the world's highest motorable passes winds through snow-dusted pine forests — a road where every bend reveals a view that doesn't exist elsewhere." },
  { timeStart: 32,   timeEnd: 39.5, x: "52%", y: "52%", label: "Spiritual Capital of India", title: "Varanasi Ghats", location: "Varanasi, Uttar Pradesh",   desc: "The oldest living city on Earth. At the Ghats of the Ganges, faith, fire and river meet every dawn — a ritual unchanged for 3,000 years." },
  { timeStart: 40,   timeEnd: 47.5, x: "50%", y: "46%", label: "Icon of Modern India",  title: "Bandra-Worli Sea Link", location: "Mumbai, Maharashtra",     desc: "Eight lanes of concrete arching 5.6 km across the Arabian Sea — Mumbai's most recognisable silhouette and an engineering marvel of the 21st century." },
  { timeStart: 48,   timeEnd: 55.5, x: "50%", y: "54%", label: "Western Ghats · UNESCO", title: "Sahyadri Canyon",  location: "Maharashtra",                desc: "A UNESCO biodiversity hotspot: these ancient volcanic gorges funnel monsoon mist into cascading waterfalls and shelter species found nowhere else on Earth." },
  { timeStart: 56,   timeEnd: 63.5, x: "34%", y: "62%", label: "Sunshine Coast",        title: "Goa Beach",         location: "Goa",                         desc: "700 km of coastline where golden sand meets the Arabian Sea, framed by coconut palms — India's most celebrated coast, radiant year-round." },
  { timeStart: 64,   timeEnd: 71.5, x: "52%", y: "54%", label: "City of Lakes",         title: "Lake Pichola",      location: "Udaipur, Rajasthan",          desc: "Crafted by hand in 1362, Lake Pichola holds the Lake Palace afloat like a marble dream — earning Udaipur its title as the Venice of the East." },
  { timeStart: 72,   timeEnd: 79.5, x: "58%", y: "48%", label: "Royal Rajputana Heritage", title: "City Palace",    location: "Udaipur, Rajasthan",          desc: "Four centuries of Mewar royalty shaped this lakeside complex — glowing amber at dusk, its reflection turning the lake into a canvas of liquid gold." },
  { timeStart: 80,   timeEnd: 87.5, x: "42%", y: "44%", label: "The Blue City",         title: "Jodhpur",           location: "Jodhpur, Rajasthan",          desc: "A sea of indigo-painted houses clusters below a sandstone fortress — the blue, once reserved for Brahmin homes, is now the identity of an entire city." },
  { timeStart: 88,   timeEnd: 95.5, x: "52%", y: "37%", label: "Rajasthan's Iron Fort", title: "Mehrangarh Fort",   location: "Jodhpur, Rajasthan",          desc: "Rising 125 metres on a sheer cliff above the Blue City, Mehrangarh is one of India's largest forts — its walls still bear the marks of cannonballs." },
  { timeStart: 96,   timeEnd: 103.5, x: "42%", y: "62%", label: "Wildlife Sanctuary",   title: "Asian Elephant",   location: "Central India",               desc: "India is home to 60% of Asia's wild elephants. These ancient forest giants roam corridors of sal and teak — living bridges between wilderness and wonder." },
  { timeStart: 104,  timeEnd: 111.5, x: "50%", y: "58%", label: "God's Own Country",    title: "Munnar Tea Gardens", location: "Kerala",                      desc: "Terraced emerald hills ripple to the horizon at 1,600 metres — Kerala's tea gardens produce some of the world's finest high-altitude leaf in perpetual golden mist." },
  { timeStart: 112,  timeEnd: 119,   x: "50%", y: "54%", label: "Backwater Highlands",  title: "Kerala Hills",     location: "Kerala",                      desc: "As the sun drops behind the Western Ghats, light turns the winding roads of Kerala's highlands to copper — a final, quiet panorama before night falls." },
];

const experiences = [
  { icon: Mountain, title: "Adventure", description: "Trek glaciers, ski Himalayan slopes, white-water raft in the Zanskar valley.", count: "500+" },
  { icon: Camera, title: "Culture & Heritage", description: "3,000 years of living history, from ancient temples to royal palaces.", count: "40+" },
  { icon: Waves, title: "Beaches & Islands", description: "7,500 km of coastline from tropical coral islands to Arabian Sea shores.", count: "1200+" },
  { icon: Globe, title: "Spiritual Journeys", description: "The birthplace of four world religions — find your path in sacred India.", count: "1M+" },
];

const stats = [
  { number: "36", label: "States & UTs", suffix: "" },
  { number: "22", label: "Official Languages", suffix: "+" },
  { number: "40", label: "UNESCO World Heritage Sites", suffix: "" },
  { number: "1.4", label: "Billion Stories", suffix: "B" },
];

export default function Home() {
  const [currentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState<Record<number, boolean>>({});
  const [hoverActive, setHoverActive] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  const { data: heroVideos } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/hero-videos"],
    staleTime: Infinity,
  });

  const getVideoUrl = useCallback((name: string): string | null => {
    if (!heroVideos) return null;
    return heroVideos[name] ?? null;
  }, [heroVideos]);


  useEffect(() => {
    const vid = videoRefs.current[0];
    if (!vid) return;
    const url = heroVideos?.["Incredible India"];
    if (url && !vid.src) { vid.src = url; vid.load(); }
    vid.play().catch(() => {});
  }, [heroVideos]);

  const [keralaOpen, setKeralaOpen] = useState(false);
  const indiaMapRef = useRef<IndiaMapHandle>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const destinationsRef = useRef<HTMLDivElement>(null);
  const experiencesRef = useRef<HTMLDivElement>(null);

  // ── Mouse parallax refs (wrapper divs — never touched by GSAP)
  const pxVideoBgRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 800], [0, -160]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Cinematic mouse pan — persistent RAF loop, no start/stop glitching
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (!heroRef.current || !pxVideoBgRef.current) return;

    const hero = heroRef.current;
    const videoBg = pxVideoBgRef.current;

    videoBg.style.willChange = "transform";
    videoBg.style.transformOrigin = "center center";

    let curX = 0, curY = 0;
    let tgtX = 0, tgtY = 0;
    let rafId: number;
    let lastTs = 0;

    // DAMPING = 0.92 → lerp factor ≈ 0.08 per frame at 60 Hz
    // Slower settle (~300ms) gives the floating cinematic ease-out the user wants
    // Delta-time normalised so 120Hz / 144Hz screens feel identical to 60Hz
    const DAMPING = 0.92;

    // Loop always runs — no start/stop, no gaps between frames
    const tick = (ts: number) => {
      const delta   = lastTs ? Math.min(ts - lastTs, 50) : 16.67;
      lastTs        = ts;
      // Frame-rate independent lerp: currentX += (targetX - currentX) * 0.08 (at 60Hz)
      const factor  = 1 - Math.pow(DAMPING, delta / 16.67);
      curX += (tgtX - curX) * factor;
      curY += (tgtY - curY) * factor;
      // Raw floats — no toFixed() rounding which causes micro-jitter
      videoBg.style.transform =
        `translate3d(${curX}px, ${curY}px, 0) scale(1.45)`;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const onMouseMove = (e: MouseEvent) => {
      // x/y in range -0.5 … +0.5 relative to screen centre
      const x = e.clientX / window.innerWidth  - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      tgtX = Math.max(-200, Math.min(200, -x * 200));
      tgtY = Math.max(-200, Math.min(200, -y * 200));
    };

    const onMouseLeave = () => {
      tgtX = 0;
      tgtY = 0;
    };

    hero.addEventListener("mousemove",  onMouseMove);
    hero.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      hero.removeEventListener("mousemove",  onMouseMove);
      hero.removeEventListener("mouseleave", onMouseLeave);
      videoBg.style.transform = "";
      videoBg.style.willChange = "";
    };
  }, []);


  // ── Track video playback time via rAF (0.5s bucket → minimal re-renders)
  useEffect(() => {
    let rafId: number;
    let lastBucket = -1;
    const tick = () => {
      const vid = videoRefs.current[0];
      if (vid) {
        const bucket = Math.floor(vid.currentTime * 2);
        if (bucket !== lastBucket) { lastBucket = bucket; setVideoTime(vid.currentTime); }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    gsap.from(".scroll-indicator", { opacity: 0, y: -20, duration: 1, delay: 1, ease: "power3.out" });
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".stat-item", {
        scrollTrigger: { trigger: statsRef.current, start: "top 80%" },
        opacity: 0, y: 50, duration: 1, stagger: 0.15, ease: "power3.out"
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!destinationsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".destination-card").forEach((card: any, i) => {
        gsap.from(card, {
          scrollTrigger: { trigger: card, start: "top 85%" },
          opacity: 0, y: 80, duration: 1.2, delay: i * 0.05, ease: "power3.out"
        });
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!experiencesRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".exp-item", {
        scrollTrigger: { trigger: experiencesRef.current, start: "top 80%" },
        opacity: 0, y: 60, duration: 1.1, stagger: 0.12, ease: "power3.out"
      });
    });
    return () => ctx.revert();
  }, []);


  return (
    <main className="bg-[#0a0a0a] text-white overflow-x-hidden" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5" : ""}`}>
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col"
          >
            <span className="font-cinzel text-white text-sm md:text-base tracking-[0.25em] font-semibold">INCREDIBLE</span>
            <span className="font-cinzel text-white/60 text-[9px] md:text-[10px] tracking-[0.45em] font-medium -mt-0.5">INDIA</span>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="hidden md:flex items-center gap-8"
          >
            {["Destinations", "Experiences", "Plan Your Trip", "Stories"].map((item) => (
              <li key={item}>
                <a href="#" className="text-white/70 hover:text-white font-montserrat text-xs tracking-[0.12em] font-medium uppercase transition-colors duration-300">
                  {item}
                </a>
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <button
              data-testid="button-explore-nav"
              className="hidden md:block font-montserrat text-xs tracking-[0.15em] font-semibold uppercase px-6 py-2.5 border border-white/30 text-white hover:bg-white hover:text-black transition-all duration-400 rounded-sm"
            >
              Explore Now
            </button>
            <button
              data-testid="button-menu-toggle"
              className="md:hidden p-1 text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          >
            {["Destinations", "Experiences", "Plan Your Trip", "Stories"].map((item) => (
              <a
                key={item}
                href="#"
                className="font-cinzel text-2xl text-white/80 hover:text-white tracking-wider transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <button className="mt-4 font-montserrat text-sm tracking-[0.15em] uppercase px-8 py-3 border border-white/30 text-white hover:bg-white hover:text-black transition-all duration-300">
              Explore Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Section ── */}
      <section ref={heroRef} className="relative w-full h-screen overflow-hidden">

        {/* Background video — single India scenic compilation */}
        <div ref={pxVideoBgRef} className="absolute inset-0" style={{ willChange: "transform" }}>
          {(() => {
            const hasVideo = !!(videoLoaded[0]);
            return (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    animation: !hasVideo ? "kenBurns 9s ease-out forwards" : "none",
                    backgroundImage: `url(${destinations[0].image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: hasVideo ? 0 : 1,
                    transition: "opacity 800ms ease-in-out",
                  }}
                />
                <video
                  ref={(el) => { videoRefs.current[0] = el; }}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  onCanPlay={() => {
                    setVideoLoaded((prev) => ({ ...prev, [0]: true }));
                    videoRefs.current[0]?.play().catch(() => {});
                  }}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    objectFit: "cover",
                    opacity: hasVideo ? 1 : 0,
                    transition: "opacity 800ms ease-in-out",
                    willChange: "opacity",
                    transform: "translateZ(0)",
                  }}
                />
              </>
            );
          })()}

        {/* ── Time-synced hotspot markers — inside pan-layer so they track the video ── */}
        {(() => {
          const activeSpot = TIME_HOTSPOTS.find(h => videoTime >= h.timeStart && videoTime <= h.timeEnd) ?? null;
          const panelVisible = !!activeSpot && hoverActive;
          const panelOnLeft = activeSpot ? parseFloat(activeSpot.x) > 55 : false;
          return (
            <AnimatePresence mode="wait">
              {activeSpot && (
                <motion.div
                  key={activeSpot.timeStart}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="absolute inset-0"
                  style={{ zIndex: 25, pointerEvents: "none" }}
                >
                  <div
                    data-testid={`hotspot-${activeSpot.title.replace(/\s+/g, "-").toLowerCase()}`}
                    className="absolute"
                    style={{ left: activeSpot.x, top: activeSpot.y, transform: "translate(-50%, -50%) scale(0.6897)", transformOrigin: "center center", pointerEvents: "auto" }}
                    onMouseEnter={() => {
                      setHoverActive(true);
                      videoRefs.current[0]?.pause();
                    }}
                    onMouseLeave={() => {
                      setHoverActive(false);
                      videoRefs.current[0]?.play().catch(() => {});
                    }}
                  >
                    {/* ── Pulsing rings (idle state) ── */}
                    {[{ size: 42, delay: "0s", opacity: 0.22 }, { size: 62, delay: "0.8s", opacity: 0.11 }].map((r, i) => (
                      <div key={i} style={{ position: "absolute", width: r.size, height: r.size, top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
                        <div style={{
                          width: "100%", height: "100%", borderRadius: "50%",
                          border: `1px solid rgba(255,255,255,${r.opacity * 2})`,
                          background: `rgba(255,255,255,${r.opacity * 0.6})`,
                          animation: `hotspotPulse 2.8s ease-out infinite ${r.delay}`,
                          opacity: panelVisible ? 0 : 1,
                          transition: "opacity 0.5s ease",
                        }} />
                      </div>
                    ))}

                    {/* ── Crosshair tick marks (appear when active) ── */}
                    {[
                      { top: -10, left: "50%", w: 1, h: 6, tx: "-50%", ty: 0 },
                      { bottom: -10, left: "50%", w: 1, h: 6, tx: "-50%", ty: 0 },
                      { left: -10, top: "50%", w: 6, h: 1, tx: 0, ty: "-50%" },
                      { right: -10, top: "50%", w: 6, h: 1, tx: 0, ty: "-50%" },
                    ].map((tick, ti) => (
                      <motion.div
                        key={ti}
                        animate={{ opacity: panelVisible ? 1 : 0, scale: panelVisible ? 1 : 0.4 }}
                        transition={{ duration: 0.3, delay: panelVisible ? ti * 0.06 : 0, ease: "easeOut" }}
                        style={{
                          position: "absolute",
                          width: tick.w, height: tick.h,
                          ...(tick.top !== undefined ? { top: tick.top } : {}),
                          ...(tick.bottom !== undefined ? { bottom: tick.bottom } : {}),
                          ...(tick.left !== undefined ? { left: tick.left } : {}),
                          ...(tick.right !== undefined ? { right: tick.right } : {}),
                          transform: `translate(${tick.tx}, ${tick.ty})`,
                          background: "rgba(255,255,255,0.75)",
                          pointerEvents: "none",
                        }}
                      />
                    ))}

                    {/* ── Center dot ── */}
                    <div
                      data-testid="hotspot-dot"
                      style={{
                        position: "relative", width: 12, height: 12, borderRadius: "50%",
                        background: panelVisible
                          ? "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 100%)"
                          : "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)",
                        boxShadow: panelVisible
                          ? "0 0 0 2px rgba(255,255,255,0.25), 0 0 14px rgba(255,255,255,0.8)"
                          : "0 0 6px rgba(255,255,255,0.4)",
                        cursor: "pointer",
                        transform: panelVisible ? "scale(1.2)" : "scale(1)",
                        transition: "transform 0.35s ease, background 0.35s ease, box-shadow 0.35s ease",
                      }}
                    />

                    {/* ── Always-visible title label below dot ── */}
                    <motion.div
                      animate={{ opacity: panelVisible ? 0 : 1 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        position: "absolute",
                        top: "calc(50% + 16px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        className="font-cinzel text-white font-semibold"
                        style={{ fontSize: 11, letterSpacing: "0.1em", textShadow: "0 1px 10px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.6)" }}
                      >
                        {activeSpot.title}
                      </div>
                      <div
                        className="font-montserrat uppercase text-white/60"
                        style={{ fontSize: 6.5, letterSpacing: "0.22em", marginTop: 3, textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
                      >
                        {activeSpot.location}
                      </div>
                    </motion.div>

                    {/* ── Connector line with gradient ── */}
                    <AnimatePresence>
                      {panelVisible && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          exit={{ scaleX: 0, transition: { duration: 0.15 } }}
                          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                          style={{
                            position: "absolute", top: "50%", marginTop: -0.5,
                            ...(panelOnLeft ? { right: "50%", transformOrigin: "right" } : { left: "50%", transformOrigin: "left" }),
                            width: 52, height: 1,
                            background: panelOnLeft
                              ? "linear-gradient(to left, rgba(255,255,255,0.6), rgba(255,255,255,0.1))"
                              : "linear-gradient(to right, rgba(255,255,255,0.6), rgba(255,255,255,0.1))",
                            pointerEvents: "none",
                          }}
                        />
                      )}
                    </AnimatePresence>

                    {/* ── Glassmorphism info panel ── */}
                    <AnimatePresence>
                      {panelVisible && (
                        <motion.div
                          key={activeSpot.title}
                          initial={{ opacity: 0, x: panelOnLeft ? 18 : -18, filter: "blur(4px)" }}
                          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, x: panelOnLeft ? 18 : -18, filter: "blur(4px)", transition: { duration: 0.18 } }}
                          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                          data-testid="hotspot-panel"
                          style={{
                            position: "absolute",
                            ...(panelOnLeft ? { right: "calc(50% + 52px)" } : { left: "calc(50% + 52px)" }),
                            top: "50%", transform: "translateY(-50%)",
                            width: 290,
                            background: "linear-gradient(135deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.06) 60%, rgba(255,255,255,0.04) 100%)",
                            backdropFilter: "blur(24px) saturate(160%)",
                            WebkitBackdropFilter: "blur(24px) saturate(160%)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            borderRadius: 2,
                            boxShadow: "0 8px 40px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.2) inset",
                            overflow: "hidden",
                            pointerEvents: "none",
                          }}
                        >
                          {/* Gold accent bar at top */}
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{
                              height: 2, width: "100%", transformOrigin: panelOnLeft ? "right" : "left",
                              background: "linear-gradient(90deg, #C9973A, #F0C060, #C9973A)",
                              opacity: 0.85,
                            }}
                          />

                          <div style={{ padding: "18px 22px 20px" }}>
                            {/* Category chip */}
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.1 }}
                              style={{
                                display: "inline-flex", alignItems: "center",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: 1,
                                padding: "3px 8px",
                                marginBottom: 10,
                                background: "rgba(255,255,255,0.07)",
                              }}
                            >
                              <span className="font-montserrat text-white/55 tracking-[0.25em] uppercase" style={{ fontSize: 7 }}>
                                {activeSpot.label}
                              </span>
                            </motion.div>

                            {/* Title */}
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                              className="font-cinzel text-white font-semibold leading-tight"
                              style={{ fontSize: 18, letterSpacing: "0.04em", marginBottom: 4 }}
                            >
                              {activeSpot.title}
                            </motion.div>

                            {/* Location line */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.35, delay: 0.22 }}
                              className="font-montserrat tracking-[0.16em] uppercase"
                              style={{ fontSize: 7.5, color: "rgba(200,160,80,0.8)", marginBottom: 14 }}
                            >
                              {activeSpot.location}
                            </motion.div>

                            {/* Divider */}
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                              style={{
                                height: 1, transformOrigin: "left", marginBottom: 14,
                                background: "linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.04))",
                              }}
                            />

                            {/* Description — word-by-word */}
                            <div className="font-cormorant leading-relaxed" style={{ fontSize: 15, color: "rgba(255,255,255,0.72)" }}>
                              {activeSpot.desc.split(" ").map((word, wi) => (
                                <motion.span
                                  key={wi}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.28 + wi * 0.045, ease: "easeOut" }}
                                  style={{ display: "inline-block", marginRight: "0.28em" }}
                                >
                                  {word}
                                </motion.span>
                              ))}
                            </div>

                            {/* Explore CTA */}
                            <motion.div
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.38, delay: 0.65 }}
                              data-testid="hotspot-explore-cta"
                              style={{
                                marginTop: 18,
                                display: "flex", alignItems: "center", gap: 8,
                                borderTop: "1px solid rgba(255,255,255,0.1)",
                                paddingTop: 14,
                              }}
                            >
                              <span className="font-montserrat tracking-[0.26em] uppercase" style={{ fontSize: 7.5, color: "rgba(200,160,80,0.85)" }}>
                                Explore
                              </span>
                              <motion.span
                                animate={{ x: [0, 4, 0] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                                style={{ color: "rgba(200,160,80,0.75)", fontSize: 11 }}
                              >
                                →
                              </motion.span>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })()}
        </div>{/* ── /pan-layer ── */}

        {/* Destination label — character-split reveal */}
        <div className="absolute bottom-12 left-8 md:left-16 z-30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.22, ease: "easeIn" } }}
              className="flex flex-col gap-3"
            >
              {/* Category eyebrow — fades in */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="font-montserrat text-white/50 text-[10px] tracking-[0.3em] uppercase"
              >
                {destinations[currentSlide]?.category}
              </motion.div>

              {/* Main title — every character slides up through a mask */}
              <div style={{ overflow: "hidden", lineHeight: 1.08 }}>
                <h2
                  className="font-cinzel text-white"
                  style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", fontWeight: 600, letterSpacing: "2px", lineHeight: 1.08 }}
                >
                  {destinations[currentSlide]?.name.split("").map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      transition={{
                        duration: 0.55,
                        delay: 0.08 + i * 0.045,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      style={{ display: "inline-block" }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </h2>
              </div>

              {/* Animated underline */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                style={{ transformOrigin: "left", height: "1px", backgroundColor: "white", width: "100%" }}
              />

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator absolute bottom-12 right-8 md:right-12 z-30 flex flex-col items-center gap-2">
          <span className="font-montserrat text-white/40 text-[9px] tracking-[0.3em] uppercase rotate-90 origin-center translate-x-2 mb-4">Scroll</span>
          <div className="w-px h-12 bg-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full bg-white/70" style={{ height: "40%", animation: "scrollLine 2s ease-in-out infinite" }} />
          </div>
          <ChevronDown className="w-4 h-4 text-white/40" style={{ animation: "bounce 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section ref={statsRef} className="relative z-10 bg-[#0f0f0f] border-y border-white/5 py-14 md:py-16">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/8">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item text-center md:px-8 py-4 md:py-0">
                <div className="flex items-end justify-center gap-0.5 mb-1.5">
                  <span className="stat-number font-cinzel text-4xl md:text-5xl font-bold text-white" data-value={stat.number}>
                    {stat.number}
                  </span>
                  <span className="font-cinzel text-2xl md:text-3xl font-bold text-amber-400 mb-0.5">{stat.suffix}</span>
                </div>
                <p className="font-montserrat text-white/40 text-[10px] tracking-[0.25em] uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── India Map Section ── */}
      <section id="map" className="relative bg-[#070707] py-24 md:py-32 overflow-hidden">
        {/* Radial glow backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(201,151,58,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-screen-xl mx-auto px-6 md:px-10">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="text-center mb-14 md:mb-18"
          >
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-6 h-px bg-amber-400" />
              <span className="font-montserrat text-amber-400 text-[10px] tracking-[0.4em] uppercase font-medium">Explore the Subcontinent</span>
              <div className="w-6 h-px bg-amber-400" />
            </div>
            <h2 className="font-cinzel text-[clamp(2rem,5vw,4rem)] font-bold text-white leading-tight mb-4">
              28 States,{" "}
              <span style={{ WebkitTextFillColor: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.35)" }}>
                One Soul
              </span>
            </h2>
            <p className="font-inter text-white/45 text-base max-w-lg mx-auto leading-relaxed">
              Hover over any state to discover India's extraordinary regional diversity — from Arctic highlands to equatorial backwaters.
            </p>
          </motion.div>

          {/* Map — full width, centred */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
            className="flex justify-center"
          >
            <div
              className="relative w-full max-w-3xl"
              style={{ height: "clamp(460px, 70vw, 780px)" }}
            >
              <IndiaMap
                ref={indiaMapRef}
                onKeralaClick={() => setKeralaOpen(true)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Destinations Section ── */}
      <section ref={destinationsRef} id="destinations" className="py-24 md:py-32 bg-[#0a0a0a]">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10">
          <div className="mb-16 md:mb-20">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-6 h-px bg-amber-400" />
              <span className="font-montserrat text-amber-400 text-[10px] tracking-[0.4em] uppercase font-medium">Top Destinations</span>
            </div>
            <h2 className="font-cinzel text-[clamp(2rem,5vw,4rem)] font-bold text-white leading-tight mb-4">
              Iconic Places<br />
              <span style={{ WebkitTextFillColor: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>
                Waiting for You
              </span>
            </h2>
            <p className="font-inter text-white/50 text-base max-w-xl leading-relaxed">
              From the snow-capped Himalayas to the sun-soaked coasts, India offers an unmatched diversity of experience within a single journey.
            </p>
          </div>

          {/* Hero destination (first) */}
          <div className="grid md:grid-cols-5 gap-4 mb-4">
            <div
              className="destination-card md:col-span-3 relative overflow-hidden group cursor-pointer"
              style={{ height: "clamp(300px, 45vw, 560px)" }}
            >
              <img
                src={destinations[0].image}
                alt={destinations[0].name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7 md:p-9">
                <div className="flex items-center gap-2 mb-2.5">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span className="font-montserrat text-amber-400 text-[10px] tracking-[0.25em] uppercase">{destinations[0].location}</span>
                </div>
                <h3 className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-1.5">{destinations[0].name}</h3>
                <p className="font-cormorant text-white/65 text-lg italic leading-snug max-w-sm">{destinations[0].tagline}</p>
                <div className="flex items-center gap-2 mt-5 opacity-0 group-hover:opacity-100 transition-all duration-400 translate-y-2 group-hover:translate-y-0">
                  <span className="font-montserrat text-white text-[10px] tracking-[0.2em] uppercase font-medium">Discover More</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-rows-2 gap-4">
              {destinations.slice(1, 3).map((dest) => (
                <div
                  key={dest.id}
                  className="destination-card relative overflow-hidden group cursor-pointer"
                >
                  <img
                    src={dest.image}
                    alt={dest.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                    style={{ minHeight: "200px" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MapPin className="w-2.5 h-2.5 text-amber-400" />
                      <span className="font-montserrat text-amber-400 text-[9px] tracking-[0.2em] uppercase">{dest.location}</span>
                    </div>
                    <h3 className="font-cinzel text-lg md:text-xl font-bold text-white">{dest.name}</h3>
                    <p className="font-cormorant text-white/60 text-sm italic">{dest.tagline}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {destinations.slice(3).map((dest) => (
              <div
                key={dest.id}
                className="destination-card relative overflow-hidden group cursor-pointer"
                style={{ height: "clamp(220px, 25vw, 340px)" }}
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-4 right-4">
                  <span
                    className="font-montserrat text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: `${dest.color}30`, color: dest.color, border: `1px solid ${dest.color}50` }}
                  >
                    {dest.category}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-2.5 h-2.5 text-amber-400" />
                    <span className="font-montserrat text-amber-400 text-[9px] tracking-[0.2em] uppercase">{dest.location}</span>
                  </div>
                  <h3 className="font-cinzel text-lg font-bold text-white">{dest.name}</h3>
                  <p className="font-cormorant text-white/60 text-sm italic leading-snug mt-0.5">{dest.tagline}</p>
                  <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 translate-y-1.5 group-hover:translate-y-0 transition-all duration-400">
                    <span className="font-montserrat text-white text-[9px] tracking-[0.2em] uppercase font-medium">Discover</span>
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full-width cinematic divider ── */}
      <section className="relative h-[70vh] md:h-[90vh] overflow-hidden">
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1477587458883-47145ed6b1bc?w=1920&q=80&auto=format&fit=crop)`,
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            backgroundAttachment: "fixed",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-black/50 to-[#0a0a0a]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <p className="font-montserrat text-amber-400 text-[10px] tracking-[0.5em] uppercase mb-5 font-medium">An Ancient Civilisation Alive Today</p>
            <h2 className="font-cinzel text-[clamp(2rem,6vw,5.5rem)] font-bold text-white leading-tight max-w-4xl">
              "India is not a country.<br />
              <span className="italic font-light" style={{ fontFamily: "Cormorant Garamond, serif" }}>It is a feeling."</span>
            </h2>
            <div className="w-16 h-0.5 bg-amber-400 mx-auto mt-8" />
          </motion.div>
        </div>
      </section>

      {/* ── Experiences Section ── */}
      <section ref={experiencesRef} id="experiences" className="py-24 md:py-32 bg-[#0f0f0f]">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10">
          <div className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-px bg-amber-400" />
                <span className="font-montserrat text-amber-400 text-[10px] tracking-[0.4em] uppercase font-medium">How To Experience India</span>
              </div>
              <h2 className="font-cinzel text-[clamp(2rem,5vw,4rem)] font-bold text-white leading-tight">
                Endless Ways<br />
                <span style={{ WebkitTextFillColor: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.4)" }}>
                  to Discover
                </span>
              </h2>
            </div>
            <p className="font-inter text-white/45 text-sm max-w-sm md:max-w-xs leading-relaxed md:mb-2">
              Every journey through India is unique. Choose your path — from spiritual pilgrimages to alpine treks, from royal palaces to hidden beaches.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {experiences.map((exp, i) => (
              <div
                key={i}
                className="exp-item group bg-[#0f0f0f] p-8 md:p-10 hover:bg-[#161616] transition-colors duration-500 cursor-pointer"
                data-testid={`card-experience-${i}`}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center border border-white/10 group-hover:border-amber-400/40 transition-all duration-400 group-hover:bg-amber-400/5">
                    <exp.icon className="w-5 h-5 text-white/60 group-hover:text-amber-400 transition-colors duration-400" />
                  </div>
                  <span className="font-cinzel text-2xl font-bold text-white/10 group-hover:text-amber-400/20 transition-colors duration-400">
                    {exp.count}
                  </span>
                </div>
                <h3 className="font-cinzel text-xl font-bold text-white mb-3 group-hover:text-amber-100 transition-colors duration-300">
                  {exp.title}
                </h3>
                <p className="font-inter text-white/45 text-sm leading-relaxed group-hover:text-white/65 transition-colors duration-300">
                  {exp.description}
                </p>
                <div className="flex items-center gap-2 mt-6 text-amber-400 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-400">
                  <span className="font-montserrat text-[10px] tracking-[0.2em] uppercase font-medium">Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations detail carousel ── */}
      <section className="py-24 md:py-32 bg-[#0a0a0a] overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-px bg-amber-400" />
            <span className="font-montserrat text-amber-400 text-[10px] tracking-[0.4em] uppercase font-medium">Destination Stories</span>
          </div>
          <h2 className="font-cinzel text-[clamp(1.8rem,4vw,3.5rem)] font-bold text-white leading-tight">
            Every Place<br />
            <span className="font-cormorant italic font-light text-white/60">has a story to tell</span>
          </h2>
        </div>

        <div className="flex gap-4 md:gap-6 pl-6 md:pl-10 overflow-x-auto scrollbar-hide pb-4" style={{ scrollbarWidth: "none" }}>
          {destinations.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="flex-none relative overflow-hidden group cursor-pointer"
              style={{ width: "clamp(260px, 28vw, 380px)", height: "clamp(360px, 50vw, 520px)" }}
              data-testid={`card-destination-story-${dest.id}`}
            >
              <img
                src={dest.image}
                alt={dest.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              <div className="absolute top-5 left-5">
                <span
                  className="font-montserrat text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: `${dest.color}25`, color: dest.color, border: `1px solid ${dest.color}40` }}
                >
                  {dest.category}
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="w-2.5 h-2.5 text-amber-400" />
                  <span className="font-montserrat text-amber-400 text-[9px] tracking-[0.2em] uppercase">{dest.location}</span>
                </div>
                <h3 className="font-cinzel text-xl font-bold text-white mb-1">{dest.name}</h3>
                <p className="font-cormorant text-white/65 text-sm italic mb-3">{dest.tagline}</p>
                <p className="font-inter text-white/50 text-xs leading-relaxed opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-24 transition-all duration-500 overflow-hidden">
                  {dest.description}
                </p>
              </div>
            </motion.div>
          ))}
          <div className="flex-none w-6 md:w-10" />
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative overflow-hidden py-28 md:py-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1920&q=80&auto=format&fit=crop)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/80" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(212,163,115,0.08) 0%, transparent 70%)" }} />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-10 max-w-3xl mx-auto px-6 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-px bg-amber-400" />
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <div className="w-8 h-px bg-amber-400" />
          </div>

          <h2 className="font-cinzel text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold text-white leading-tight mb-6">
            Your Journey<br />
            Begins Here
          </h2>

          <p className="font-cormorant text-white/65 text-[clamp(1rem,2vw,1.4rem)] italic font-light leading-relaxed mb-10">
            Let India's colours, flavours, sounds and silence transform you. A trip here isn't just a holiday — it's an awakening.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              data-testid="button-plan-trip"
              className="group flex items-center gap-3 bg-amber-400 hover:bg-amber-300 text-black font-montserrat text-xs font-bold tracking-[0.2em] uppercase px-10 py-4 transition-all duration-400"
            >
              Plan Your Trip
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <button
              data-testid="button-view-all-destinations"
              className="font-montserrat text-white/80 hover:text-white text-xs font-medium tracking-[0.2em] uppercase px-8 py-4 border border-white/20 hover:border-white/50 transition-all duration-400 backdrop-blur-sm"
            >
              All Destinations
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#060606] border-t border-white/5 py-14 md:py-16">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-5">
                <span className="font-cinzel text-white text-sm tracking-[0.25em] font-semibold block">INCREDIBLE</span>
                <span className="font-cinzel text-white/40 text-[9px] tracking-[0.45em] font-medium">INDIA</span>
              </div>
              <p className="font-inter text-white/35 text-xs leading-relaxed max-w-[200px]">
                Official gateway to India's finest travel experiences.
              </p>
            </div>
            {[
              { title: "Destinations", links: ["Taj Mahal", "Udaipur", "Ladakh"] },
              { title: "Experiences", links: ["Adventure", "Heritage", "Beaches", "Spirituality", "Cuisine"] },
              { title: "Plan Your Trip", links: ["Best Time to Visit", "Visa & Entry", "Getting Around", "Where to Stay", "Safety"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-montserrat text-white text-[10px] tracking-[0.3em] uppercase font-semibold mb-5">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="font-inter text-white/35 hover:text-white/75 text-xs transition-colors duration-300">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-inter text-white/25 text-[10px] tracking-[0.1em]">
              © 2026 Incredible India. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Accessibility"].map((item) => (
                <a key={item} href="#" className="font-inter text-white/25 hover:text-white/60 text-[10px] tracking-[0.1em] transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Global Styles ── */}
      <style>{`
        @keyframes hotspotPulse {
          0%   { transform: scale(1); opacity: 0.7; }
          70%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes kenBurns {
          0%   { transform: scale(1.08) translate(0px, 0px); }
          100% { transform: scale(1.18) translate(-15px, -8px); }
        }
        @keyframes scrollLine {
          0%   { transform: translateY(-100%); opacity: 1; }
          100% { transform: translateY(250%); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(5px); }
        }
        .scrollbar-hide { scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        html { scroll-behavior: smooth; }
      `}</style>

      <KeralaOverlay
        isOpen={keralaOpen}
        onClose={() => {
          setKeralaOpen(false);
          indiaMapRef.current?.resetZoom();
        }}
      />
    </main>
  );
}
