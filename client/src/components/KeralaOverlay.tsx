import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { X, MapPin, Clock, ChevronDown, Utensils, Landmark, BookOpen, Camera } from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────

const PLACES = [
  {
    title: "Alleppey Backwaters",
    tag: "Waterways",
    desc: "Glide through 900 km of interlocked canals on a traditional houseboat as the paddy fields and coconut groves drift past.",
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=85&auto=format&fit=crop",
    hours: "Year-round · Best Oct–Feb",
  },
  {
    title: "Munnar Tea Gardens",
    tag: "Hill Station",
    desc: "Rolling emerald terraces at 1,600 m above sea level — the air is cool, fragrant, and impossibly green.",
    img: "https://images.unsplash.com/photo-1582716401301-b2407dc7563d?w=800&q=85&auto=format&fit=crop",
    hours: "Sep–May · Sunrise views",
  },
  {
    title: "Fort Kochi",
    tag: "Heritage Town",
    desc: "Colonial streets where Portuguese, Dutch, and British chapters meet Kerala's own story — Chinese fishing nets at dusk are iconic.",
    img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=85&auto=format&fit=crop",
    hours: "Year-round · Evenings ideal",
  },
  {
    title: "Kovalam Beach",
    tag: "Coastline",
    desc: "Three crescent beaches separated by rocky headlands, famous for their lighthouse views and Ayurvedic retreat centres.",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=85&auto=format&fit=crop",
    hours: "Nov–Mar · Golden season",
  },
  {
    title: "Periyar Wildlife Sanctuary",
    tag: "Wildlife",
    desc: "Spot wild elephants, tigers, and Malabar giant squirrels around the pristine waters of Periyar Lake.",
    img: "https://images.unsplash.com/photo-1549366021-9f761d450615?w=800&q=85&auto=format&fit=crop",
    hours: "Oct–Jun · Morning safaris",
  },
  {
    title: "Wayanad Forests",
    tag: "Wilderness",
    desc: "Ancient tribal heritage and misty jungle trails converge in one of India's most biodiverse districts.",
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=85&auto=format&fit=crop",
    hours: "Jun–Sep · Monsoon magic",
  },
];

const CULTURE = [
  {
    title: "Kathakali",
    desc: "A 500-year-old classical dance-drama where elaborate face paint and towering costumes tell tales from the Ramayana and Mahabharata. Each expression is a language.",
    img: "https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?w=800&q=85&auto=format&fit=crop",
    tag: "Classical Dance",
  },
  {
    title: "Theyyam",
    desc: "A sacred ritual art form practiced in North Kerala where performers become living deities. Drumbeats, fire, and elaborate headdresses create a trance-like spectacle.",
    img: "https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=800&q=85&auto=format&fit=crop",
    tag: "Ritual Art",
  },
  {
    title: "Onam Festival",
    desc: "Kerala's grandest harvest festival — ten days of floral carpets (pookalam), snake boat races, tiger dances, and a 26-dish feast on a banana leaf.",
    img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=85&auto=format&fit=crop",
    tag: "Harvest Festival",
  },
  {
    title: "Nehru Trophy Boat Race",
    desc: "Hundreds of oarsmen race 100-foot snake boats on Punnamada Lake to the thunder of vanchipattu — the boatman's song. A spectacle unlike any other.",
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=85&auto=format&fit=crop",
    tag: "Water Sport",
  },
];

const FOOD = [
  {
    name: "Sadya",
    desc: "A ceremonial feast of 28+ vegetarian dishes served on a fresh banana leaf — the ultimate expression of Kerala's hospitality.",
    img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=85&auto=format&fit=crop",
    type: "Festive Meal",
  },
  {
    name: "Kerala Fish Curry",
    desc: "Kodampuli-soured, coconut-enriched, and fire-red with Kashmiri chillies. The soul of the Malabar coast in every spoonful.",
    img: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=85&auto=format&fit=crop",
    type: "Seafood",
  },
  {
    name: "Puttu & Kadala Curry",
    desc: "Steamed rice cylinders with black chickpea curry — a humble, beloved breakfast that has fed Kerala for centuries.",
    img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=85&auto=format&fit=crop",
    type: "Breakfast",
  },
  {
    name: "Payasam",
    desc: "Golden, cardamom-kissed rice pudding made with jaggery and coconut milk — served at every celebration as a blessing.",
    img: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&q=85&auto=format&fit=crop",
    type: "Dessert",
  },
  {
    name: "Appam & Stew",
    desc: "Lacy, fermented rice crepes with a tender coconut milk stew of vegetables or chicken — a colonial-influenced classic.",
    img: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=85&auto=format&fit=crop",
    type: "Main Course",
  },
  {
    name: "Malabar Biryani",
    desc: "Fragrant, saffron-laced rice layered with spiced meat — Malabar's answer to Mughal grandeur, cooked in the dum style.",
    img: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=600&q=85&auto=format&fit=crop",
    type: "Rice Dish",
  },
];

const HISTORY = [
  {
    era: "3000 BCE",
    title: "Spice Trade Begins",
    desc: "Kerala's black pepper and cardamom attract Arab, Chinese, and Phoenician traders. Malabar ports become the richest in the ancient world.",
  },
  {
    era: "1498 CE",
    title: "Vasco da Gama Arrives",
    desc: "The Portuguese navigator lands at Kozhikode (Calicut), opening the sea route from Europe to India and transforming global trade forever.",
  },
  {
    era: "1600s",
    title: "Dutch & British Era",
    desc: "The Dutch displace the Portuguese, then the British East India Company gains control, reshaping Kerala's political and economic landscape.",
  },
  {
    era: "1936",
    title: "Temple Entry Proclamation",
    desc: "Travancore's historic proclamation opens Hindu temples to all castes — a landmark moment in India's social reform movement.",
  },
  {
    era: "1956",
    title: "State of Kerala Formed",
    desc: "Malayalam-speaking regions are unified into the state of Kerala on 1 November 1956, celebrated today as Kerala Piravi.",
  },
  {
    era: "Today",
    title: "God's Own Country",
    desc: "With near-100% literacy, world-class healthcare, and one of India's highest Human Development Indexes, Kerala charts its own extraordinary path.",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <FadeIn className="text-center mb-16">
      <p className="font-montserrat text-[10px] tracking-[0.45em] uppercase text-amber-400/80 mb-4">{eyebrow}</p>
      <h2 className="font-cinzel text-4xl md:text-5xl font-bold text-white mb-5">{title}</h2>
      {subtitle && <p className="font-inter text-white/45 text-sm max-w-xl mx-auto leading-relaxed">{subtitle}</p>}
    </FadeIn>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeralaOverlay({ isOpen, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    if (overlayRef.current) overlayRef.current.scrollTop = 0;
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] overflow-y-auto bg-[#060608] text-white"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="fixed top-6 right-6 z-[210] w-11 h-11 rounded-full bg-white/8 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
      >
        <X size={18} />
      </button>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative h-screen overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1920&q=90&auto=format&fit=crop"
          alt="Kerala"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#060608]" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-montserrat text-[10px] tracking-[0.5em] uppercase text-amber-400/90 mb-6"
          >
            God's Own Country
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-cinzel font-bold text-white leading-none mb-6"
            style={{ fontSize: "clamp(4rem, 10vw, 8rem)", letterSpacing: "0.04em" }}
          >
            Kerala
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mb-6"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.9 }}
            className="font-inter text-white/60 text-base md:text-lg max-w-2xl leading-relaxed italic"
          >
            Where emerald backwaters meet ancient temples, spice-scented hills descend to golden beaches, and every sunrise feels like a painting.
          </motion.p>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-montserrat text-white/30 text-[9px] tracking-[0.35em] uppercase">Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
            <ChevronDown size={16} className="text-white/30" />
          </motion.div>
        </div>
      </section>

      {/* ── QUICK STATS ───────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: "38,852", label: "km² Area" },
            { n: "33M+", label: "Population" },
            { n: "590 km", label: "Coastline" },
            { n: "~100%", label: "Literacy Rate" },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="font-cinzel text-3xl font-bold text-white mb-1">{s.n}</div>
              <div className="font-montserrat text-white/35 text-[10px] tracking-[0.25em] uppercase">{s.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── TOURIST PLACES ────────────────────────────────────────── */}
      <section className="py-28 px-6 max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Destinations"
          title="Places to Visit"
          subtitle="From mist-covered highlands to languid backwaters — every corner of Kerala holds a different world."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PLACES.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.07}>
              <div className="group relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/8 hover:border-amber-400/30 transition-all duration-500 cursor-pointer">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-3 left-3 font-montserrat text-[9px] tracking-[0.3em] uppercase text-amber-400 bg-black/50 backdrop-blur-sm border border-amber-400/20 px-2.5 py-1 rounded-full">
                    {p.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-cinzel text-white font-semibold text-base mb-2">{p.title}</h3>
                  <p className="font-inter text-white/50 text-[13px] leading-relaxed mb-3">{p.desc}</p>
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Clock className="w-3 h-3" />
                    <span className="font-montserrat text-[9px] tracking-widest uppercase">{p.hours}</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CULTURE ───────────────────────────────────────────────── */}
      <section className="py-28 bg-white/[0.015] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="Culture"
            title="Living Traditions"
            subtitle="Kerala's culture is not preserved in museums — it breathes, performs, and celebrates on every street and stage."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CULTURE.map((c, i) => (
              <FadeIn key={c.title} delay={i * 0.1}>
                <div className="group flex gap-5 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/15 p-5 transition-all duration-400">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={c.img}
                      alt={c.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="font-montserrat text-[9px] text-amber-400/80 tracking-[0.3em] uppercase mb-2">{c.tag}</span>
                    <h3 className="font-cinzel text-white font-semibold text-base mb-2">{c.title}</h3>
                    <p className="font-inter text-white/50 text-[12px] leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOD ──────────────────────────────────────────────────── */}
      <section className="py-28 px-6 max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Cuisine"
          title="Flavours of Kerala"
          subtitle="Coconut, spice, and the sea — Kerala's food is a feast of contrasts, rooted in ancient Ayurvedic wisdom."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FOOD.map((f, i) => (
            <FadeIn key={f.name} delay={i * 0.06}>
              <div className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer">
                <img
                  src={f.img}
                  alt={f.name}
                  className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <span className="font-montserrat text-[8px] tracking-[0.3em] uppercase text-amber-400/80 mb-1">{f.type}</span>
                  <h4 className="font-cinzel text-white font-semibold text-sm mb-1">{f.name}</h4>
                  <p className="font-inter text-white/55 text-[11px] leading-snug opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-h-0 group-hover:max-h-20 overflow-hidden">
                    {f.desc}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── HISTORY TIMELINE ──────────────────────────────────────── */}
      <section className="py-28 bg-white/[0.015] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeader
            eyebrow="History"
            title="Centuries of Stories"
            subtitle="From ancient spice routes to a model modern state — Kerala's history is a tapestry of trade, faith, and reform."
          />
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-transparent md:left-1/2 md:-translate-x-px" />

            <div className="flex flex-col gap-10">
              {HISTORY.map((h, i) => (
                <FadeIn key={h.era} delay={i * 0.08}>
                  <div className={`relative flex gap-6 md:gap-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    {/* Content */}
                    <div className={`md:w-[calc(50%-2rem)] pl-10 md:pl-0 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                      <span className="font-montserrat text-[9px] tracking-[0.4em] uppercase text-amber-400/70 mb-1 block">{h.era}</span>
                      <h4 className="font-cinzel text-white font-semibold text-base mb-2">{h.title}</h4>
                      <p className="font-inter text-white/45 text-[13px] leading-relaxed">{h.desc}</p>
                    </div>

                    {/* Timeline dot */}
                    <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-1 w-3.5 h-3.5 rounded-full bg-amber-400/80 border-2 border-[#060608] shadow-[0_0_8px_rgba(251,191,36,0.5)]" />

                    {/* Spacer for opposite side on desktop */}
                    <div className="hidden md:block md:w-[calc(50%-2rem)]" />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ────────────────────────────────────────────── */}
      <section className="relative py-36 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80&auto=format&fit=crop"
            alt="Kerala beach"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-transparent to-[#060608]" />
        </div>
        <div className="relative z-10">
          <FadeIn>
            <p className="font-montserrat text-[10px] tracking-[0.45em] uppercase text-amber-400/80 mb-5">Begin Your Journey</p>
            <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-white mb-6">Kerala Awaits</h2>
            <p className="font-inter text-white/45 max-w-md mx-auto text-sm leading-relaxed mb-10">
              No description does it justice. The backwaters, the spices, the silence of the hills — you have to feel it yourself.
            </p>
            <button
              onClick={onClose}
              className="font-montserrat text-[10px] tracking-[0.3em] uppercase px-10 py-4 border border-white/25 text-white/80 hover:bg-white/8 hover:border-white/50 transition-all duration-300 rounded-sm"
            >
              Return to India
            </button>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
