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
    name: "Taj Mahal",
    location: "Agra, Uttar Pradesh",
    tagline: "An Eternal Ode to Love",
    description: "The world's greatest monument to love, gleaming white against an Indian dawn, its reflection shimmering in the long pool of still water.",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1920&q=85&auto=format&fit=crop",
    color: "#d4a373",
    category: "Heritage",
  },
  {
    id: 2,
    name: "Udaipur",
    location: "Rajasthan",
    tagline: "The City of Lakes",
    description: "Palaces rising from mirror-still lakes, golden light on ancient stone, the city of kings reveals itself at dusk like a living dream.",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=1920&q=85&auto=format&fit=crop",
    color: "#e07a5f",
    category: "Royal Heritage",
  },
  {
    id: 3,
    name: "Ladakh",
    location: "Union Territory of Ladakh",
    tagline: "Land of High Passes",
    description: "Where the sky meets barren mountains, monasteries cling to ancient cliffs, and roads wind through the roof of the world.",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1920&q=85&auto=format&fit=crop",
    color: "#9c6b3c",
    category: "Adventure",
  },
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState<Record<number, boolean>>({});
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
    destinations.forEach((dest, i) => {
      const vid = videoRefs.current[i];
      if (!vid) return;
      const url = heroVideos?.[dest.name];
      if (url && !vid.src) {
        vid.src = url;
        vid.load();
      }
      if (i === currentSlide) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
        const nextIndex = (currentSlide + 1) % destinations.length;
        if (i === nextIndex && url && !vid.src) {
          vid.preload = "auto";
          vid.src = url;
          vid.load();
        }
      }
    });
  }, [currentSlide, heroVideos]);

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

  // ── Mouse parallax ── direct event handler, CSS transition for smooth lerp
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (!heroRef.current || !pxVideoBgRef.current) return;

    const hero = heroRef.current;
    const videoBg = pxVideoBgRef.current;

    // Apply baseline scale so panning never exposes edges
    videoBg.style.willChange = "transform";
    videoBg.style.transformOrigin = "center center";

    // Current (lerped) and target values
    let curX = 0, curY = 0;
    let tgtX = 0, tgtY = 0;
    let rafId = 0;
    let running = false;

    const LERP = 0.06;   // lower = slower / more cinematic
    const MAX  = 120;    // px — maximum pan distance

    const tick = () => {
      curX += (tgtX - curX) * LERP;
      curY += (tgtY - curY) * LERP;
      videoBg.style.transform = `translate3d(${curX.toFixed(3)}px, ${curY.toFixed(3)}px, 0) scale(1.25)`;

      // Stop loop once settled at rest (within 0.05px of target)
      if (Math.abs(tgtX - curX) < 0.05 && Math.abs(tgtY - curY) < 0.05 &&
          Math.abs(tgtX) < 0.05 && Math.abs(tgtY) < 0.05) {
        running = false;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      // Negate so the video content follows the cursor (parallax pan in cursor direction)
      tgtX = -(e.clientX / window.innerWidth  - 0.5) * MAX * 2;
      tgtY = -(e.clientY / window.innerHeight - 0.5) * MAX * 2;
      startLoop();
    };

    const onMouseLeave = () => {
      tgtX = 0;
      tgtY = 0;
      startLoop();
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setPrevSlide(currentSlide);
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentSlide((prev) => (prev + 1) % destinations.length);
          setIsTransitioning(false);
        }, 1200);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [currentSlide, isTransitioning]);

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

  const goToSlide = (index: number) => {
    if (index === currentSlide || isTransitioning) return;
    setPrevSlide(currentSlide);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 1000);
  };

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

        {/* Background videos with crossfade — image fallback when video not ready */}
        <div ref={pxVideoBgRef} className="absolute inset-0" style={{ willChange: "transform" }}>
          {destinations.map((dest, i) => {
            const videoUrl = getVideoUrl(dest.name);
            const isActive = i === currentSlide;
            const hasVideo = !!(videoUrl && videoLoaded[i]);
            return (
              <div
                key={dest.id}
                className="absolute inset-0"
                style={{
                  opacity: isActive ? 1 : 0,
                  zIndex: isActive ? 1 : 0,
                  transition: "opacity 1500ms ease-in-out",
                  willChange: "opacity",
                }}
              >
                {/* Fallback image — always rendered, hidden once video ready */}
                <div
                  className="absolute inset-0 will-change-transform"
                  style={{
                    animation: isActive && !hasVideo ? "kenBurns 9s ease-out forwards" : "none",
                    backgroundImage: `url(${dest.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: hasVideo ? 0 : 1,
                    transition: "opacity 800ms ease-in-out",
                  }}
                />
                {/* Video layer */}
                <video
                  ref={(el) => { videoRefs.current[i] = el; }}
                  autoPlay={isActive}
                  muted
                  loop
                  playsInline
                  preload={i === 0 ? "auto" : "none"}
                  onCanPlay={() => {
                    setVideoLoaded((prev) => ({ ...prev, [i]: true }));
                    if (isActive) videoRefs.current[i]?.play().catch(() => {});
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
              </div>
            );
          })}
        </div>



        {/* Slide dots */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {destinations.map((_, i) => (
            <button
              key={i}
              data-testid={`button-slide-${i}`}
              onClick={() => goToSlide(i)}
              className={`transition-all duration-500 rounded-full ${
                i === currentSlide
                  ? "w-8 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>

        {/* Destination label */}
        <div className="absolute bottom-12 left-8 md:left-12 z-30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.7 }}
              className="flex items-center gap-2"
            >
              <span className="inline-block w-1 h-6 rounded-full" style={{ backgroundColor: destinations[currentSlide]?.color }} />
              <div>
                <div className="font-cinzel text-white text-sm font-semibold tracking-wider">
                  {destinations[currentSlide]?.name}
                </div>
                <div className="font-montserrat text-white/50 text-[10px] tracking-[0.2em] uppercase">
                  {destinations[currentSlide]?.category}
                </div>
              </div>
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
