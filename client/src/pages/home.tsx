import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Menu, X, Utensils, Settings, MapPin, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import IndiaMap, { IndiaMapHandle } from "@/components/IndiaMap";
import { Hero } from "@/components/Hero";
import { type SiteSettings, type Hotspot } from "@shared/schema";
import { AdminPanel } from "@/components/AdminPanel";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { number: "36", label: "States & UTs", suffix: "" },
  { number: "22", label: "Official Languages", suffix: "+" },
  { number: "40", label: "UNESCO World Heritage Sites", suffix: "" },
  { number: "1.4", label: "Billion Stories", suffix: "B" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const indiaMapRef = useRef<IndiaMapHandle>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });

  const { data: hotspots } = useQuery<Hotspot[]>({
    queryKey: ["/api/hotspots"],
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  return (
    <main className="bg-[#0a0a0a] text-white overflow-x-hidden font-inter">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? "bg-black/85 backdrop-blur-xl border-b border-white/10" : "bg-gradient-to-b from-black/75 to-black/10 backdrop-blur-sm"}`}>
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
          <Link href="/">
            <motion.div className="flex flex-col cursor-pointer">
              <span className="font-cinzel text-white text-sm md:text-base tracking-[0.25em] font-semibold">INCREDIBLE</span>
              <span className="font-cinzel text-white/60 text-[9px] md:text-[10px] tracking-[0.45em] font-medium -mt-0.5">INDIA</span>
            </motion.div>
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {["Destinations", "Experiences", "Stories"].map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase()}`} className="text-white/70 hover:text-white font-montserrat text-xs tracking-[0.12em] font-medium uppercase transition-colors">
                  {item}
                </a>
              </li>
            ))}
            <li>
              <Link href="/cookbook" className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-montserrat text-xs tracking-[0.12em] font-medium uppercase transition-colors">
                <Utensils className="w-3 h-3" />
                Cookbook
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="p-2 text-white/40 hover:text-white transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </Link>
            <button className="hidden md:block font-montserrat text-xs tracking-[0.15em] font-semibold uppercase px-6 py-2.5 border border-white/30 text-white hover:bg-white hover:text-black transition-all rounded-sm">
              Explore Now
            </button>
            <button className="md:hidden p-1 text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {settings && hotspots && <Hero settings={settings} hotspots={hotspots} />}

      {/* Stats Bar */}
      <section ref={statsRef} className="relative z-10 bg-[#0f0f0f] border-y border-white/5 py-14 md:py-16">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/8">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item text-center md:px-8 py-4 md:py-0">
                <div className="flex items-end justify-center gap-0.5 mb-1.5">
                  <span className="stat-number font-cinzel text-4xl md:text-5xl font-bold text-white">{stat.number}</span>
                  <span className="font-cinzel text-2xl md:text-3xl font-bold text-amber-400 mb-0.5">{stat.suffix}</span>
                </div>
                <p className="font-montserrat text-white/40 text-[10px] tracking-[0.25em] uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* India Map Section */}
      <section id="destinations" className="relative bg-[#070707] py-24 md:py-32 overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10">
          <div className="text-center mb-14 md:mb-18">
            <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-white mb-4">28 States, One Soul</h2>
            <p className="font-inter text-white/45 text-base max-w-lg mx-auto leading-relaxed">
              Explore India's extraordinary regional diversity — from Arctic highlands to equatorial backwaters.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="relative w-full max-w-3xl h-[500px] md:h-[700px]">
              <IndiaMap ref={indiaMapRef} onKeralaClick={() => {}} />
            </div>
          </div>
        </div>
      </section>

      {/* Admin Panel */}
      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} />
    </main>
  );
}
