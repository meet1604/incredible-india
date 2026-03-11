import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, MapPin, ArrowRight, Globe, Camera, Mountain, Waves, Star, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

type Hotspot = { x: string; y: string; label: string; title: string; desc: string };
const HOTSPOTS: Record<string, Hotspot[]> = {
  "Incredible India": [
    { x: "57%", y: "46%", label: "UNESCO World Heritage · Agra", title: "Taj Mahal", desc: "Built over 22 years by 22,000 artisans — Shah Jahan's declaration of eternal love in white marble rises 73 metres above the sacred Yamuna river." },
    { x: "50%", y: "18%", label: "Sacred Waters", title: "Yamuna River", desc: "Flowing behind the Taj for four centuries, the Yamuna was the mirror Shah Jahan envisioned — a river that turned one building into an infinity." },
  ],
};

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
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [autoHotspot, setAutoHotspot] = useState<number | null>(null);
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

    // Damping: 0.88 gives a smooth ~140ms settle time
    // Delta-time based so it's identical on 60Hz, 120Hz, and 144Hz screens
    const DAMPING = 0.88;

    // Loop always runs — no start/stop, no gaps between frames
    const tick = (ts: number) => {
      const delta   = lastTs ? Math.min(ts - lastTs, 50) : 16.67;
      lastTs        = ts;
      // Frame-rate independent exponential decay
      const factor  = 1 - Math.pow(DAMPING, delta / 16.67);
      curX += (tgtX - curX) * factor;
      curY += (tgtY - curY) * factor;
      // Raw floats — no toFixed() rounding which causes micro-jitter
      videoBg.style.transform =
        `translate3d(${curX}px, ${curY}px, 0) scale(1.5)`;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const onMouseMove = (e: MouseEvent) => {
      // x/y in range -0.5 … +0.5 relative to screen centre
      const x = e.clientX / window.innerWidth  - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      tgtX = -x * 120;
      tgtY = -y * 120;
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


  // ── Auto-cycle hotspot panels each time the slide changes
  useEffect(() => {
    setAutoHotspot(null);
    setActiveHotspot(null);
    const spots = HOTSPOTS[destinations[currentSlide]?.name] ?? [];
    if (spots.length === 0) return;

    // Show first hotspot 1.8s after slide loads
    const t1 = setTimeout(() => setAutoHotspot(0), 1800);
    // Swap to second hotspot (if any) after another 3.5s
    const t2 = spots.length > 1 ? setTimeout(() => setAutoHotspot(1), 5300) : undefined;
    // Hide all after another 3.5s
    const t3 = setTimeout(() => setAutoHotspot(null), spots.length > 1 ? 8800 : 5300);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [currentSlide]);

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
        </div>



        {/* ── Hotspot markers ── */}
        <AnimatePresence>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="absolute inset-0"
            style={{ zIndex: 25, pointerEvents: "none" }}
          >
            {(HOTSPOTS[destinations[currentSlide]?.name] ?? []).map((spot, idx) => {
              const hsKey = `${currentSlide}-${idx}`;
              // Active via hover OR via the auto-cycle timer (hover takes priority)
              const isActive = activeHotspot === hsKey ||
                (activeHotspot === null && autoHotspot === idx);
              const panelOnLeft = parseFloat(spot.x) > 55;
              return (
                <div
                  key={idx}
                  className="absolute"
                  style={{ left: spot.x, top: spot.y, transform: "translate(-50%, -50%)", pointerEvents: "auto" }}
                  onMouseEnter={() => {
                    setActiveHotspot(hsKey);
                    videoRefs.current[currentSlide]?.pause();
                  }}
                  onMouseLeave={() => {
                    setActiveHotspot(null);
                    videoRefs.current[currentSlide]?.play().catch(() => {});
                  }}
                >
                  {/* Pulsing outer ring — fades out when active */}
                  <div style={{
                    position: "absolute", width: 32, height: 32,
                    top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  }}>
                    <div style={{
                      width: "100%", height: "100%", borderRadius: "50%",
                      background: "rgba(255,255,255,0.28)",
                      animation: `hotspotPulse 2.8s ease-out infinite ${idx * 0.9}s`,
                      opacity: isActive ? 0 : 1,
                      transition: "opacity 0.4s ease",
                    }} />
                  </div>

                  {/* Glow highlight ring — appears only when active */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        style={{
                          position: "absolute", width: 40, height: 40,
                          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                          borderRadius: "50%",
                          border: "1.5px solid rgba(255,255,255,0.9)",
                          boxShadow: "0 0 14px rgba(255,255,255,0.5), 0 0 28px rgba(255,255,255,0.2)",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Marker dot */}
                  <div style={{
                    position: "relative", width: 20, height: 20, borderRadius: "50%",
                    background: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.15)",
                    border: "1.5px solid rgba(255,255,255,0.85)",
                    backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: isActive ? "0 0 18px rgba(255,255,255,0.65)" : "none",
                    transform: isActive ? "scale(1.35)" : "scale(1)",
                    transition: "transform 0.35s ease, background 0.35s ease, box-shadow 0.35s ease",
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: isActive ? "rgba(0,0,0,0.75)" : "white",
                      transition: "background 0.35s ease",
                    }} />
                  </div>
                  {/* Connector line — draws from dot to panel */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        exit={{ scaleX: 0, transition: { duration: 0.18 } }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        style={{
                          position: "absolute",
                          top: "50%",
                          ...(panelOnLeft
                            ? { right: "50%", transformOrigin: "right" }
                            : { left: "50%", transformOrigin: "left" }),
                          width: 40,
                          height: 1,
                          backgroundColor: "rgba(255,255,255,0.55)",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Description panel — slides in from the side */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, x: panelOnLeft ? 14 : -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: panelOnLeft ? 14 : -14, transition: { duration: 0.22 } }}
                        transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{
                          position: "absolute",
                          ...(panelOnLeft ? { right: "calc(50% + 40px)" } : { left: "calc(50% + 40px)" }),
                          top: "50%", transform: "translateY(-50%)",
                          width: 256,
                          background: "rgba(6, 6, 6, 0.91)",
                          backdropFilter: "blur(28px)",
                          borderTop: "1px solid rgba(255,255,255,0.12)",
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                          ...(panelOnLeft
                            ? { borderRight: "1px solid rgba(255,255,255,0.08)" }
                            : { borderLeft: "1px solid rgba(255,255,255,0.08)" }),
                          padding: "18px 20px 16px",
                          pointerEvents: "none",
                        }}
                      >
                        {/* Small label */}
                        <div className="font-montserrat text-white/40 text-[8px] tracking-[0.28em] uppercase mb-2">
                          {spot.label}
                        </div>

                        {/* Title */}
                        <div className="font-cinzel text-white font-semibold tracking-wide mb-3" style={{ fontSize: 13.5 }}>
                          {spot.title}
                        </div>

                        {/* Thin divider draws in */}
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
                          style={{ height: 1, backgroundColor: "rgba(255,255,255,0.13)", transformOrigin: "left", marginBottom: 12 }}
                        />

                        {/* Description — word by word */}
                        <div className="font-cormorant text-white/62 leading-relaxed" style={{ fontSize: 14.5 }}>
                          {spot.desc.split(" ").map((word, wi) => (
                            <motion.span
                              key={wi}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.32, delay: 0.22 + wi * 0.055, ease: "easeOut" }}
                              style={{ display: "inline-block", marginRight: "0.28em" }}
                            >
                              {word}
                            </motion.span>
                          ))}
                        </div>

                        {/* Explore CTA */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.35, delay: 0.55 }}
                          className="font-montserrat text-white/45 text-[8.5px] tracking-[0.22em] uppercase mt-4 flex items-center gap-1.5"
                        >
                          Explore <span style={{ fontSize: 10, letterSpacing: 0 }}>→</span>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>


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
    </main>
  );
}
