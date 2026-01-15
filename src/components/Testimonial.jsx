import React, { useEffect, useRef, useState } from "react";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const testimonialData = [
  {
    name: "Yasir Azad",
    position: "SMM Expert",
    review: "Spark Trainings ne mujhe ek expert digital marketer banaya. Inke course ki badolat aaj main apni agency manage kar raha hoon. Best place to learn marketing skills!",
  },  
  {
    name: "Ayesha Khan",
    position: "BSCS Student",
    review: "Spark Trainings ne meri life literally change kar di. Web development ka course itna practical tha ke main ab freelance projects le rahi hoon.",
  },
  {
    name: "Ali Raza",
    position: "Shopify Store Owner",
    review: "Shopify Masterclass ke baad main ne apna pehla online store launch kiya. Jo cheezen YouTube se samajh nahi aati thin, yahan clear ho gain.",
  },
  {
    name: "Mudassir Saleem",
    position: "Web Developer",
    review: "Spark Trainings ke Web Development course ne meri skills ko next level par le jaaya. Ab main ek reputed IT company mein kaam kar raha hoon.",
  },
];

function Card({ t }) {
  return (
    <div className="border border-slate-300/70 rounded-md bg-white p-5 sm:p-6 min-h-[230px] lg:min-h-60 flex flex-col shadow-[0_2px_0_rgba(0,0,0,0.02)]">
      <Quote className="h-5 w-5 rotate-180 fill-slate-900 text-slate-900" />
      <p className="mt-3 text-[15px] leading-6 text-slate-900">{t.review}</p>
      <div className="mt-5">
        <h3 className="text-[15px] font-semibold text-slate-900">{t.name}</h3>
        <p className="text-[13px] text-slate-500">{t.position}</p>
      </div>
    </div>
  );
}

function MobileCarousel({ items }) {
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);

  const scrollTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[i];
    if (child) child.scrollIntoView({ behavior: "smooth", inline: "center" });
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const children = Array.from(el.children);
        // pick the one most centered in viewport
        let best = 0;
        let bestDist = Infinity;
        const center = el.scrollLeft + el.clientWidth / 2;
        children.forEach((c, i) => {
          const cx = c.offsetLeft + c.clientWidth / 2;
          const d = Math.abs(center - cx);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        setIdx(best);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  const prev = () => scrollTo(Math.max(0, idx - 1));
  const next = () => scrollTo(Math.min(items.length - 1, idx + 1));

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((t, i) => (
          <div
            key={i}
            className="
              flex-none snap-center
              w-[86vw] xs:w-[88vw]
            "
          >
            <Card t={t} />
          </div>
        ))}
      </div>

      {/* Dots + (optional) arrows like Udemy */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          aria-label="Previous"
          onClick={prev}
          className="grid h-8 w-8 place-items-center rounded-full bg-white shadow ring-1 ring-slate-900/10 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={
                i === idx
                  ? "h-2 w-6 rounded-full bg-[#0d9c06]"
                  : "h-2 w-2.5 rounded-full bg-slate-300"
              }
            />
          ))}
        </div>

        <button
          aria-label="Next"
          onClick={next}
          className="grid h-8 w-8 place-items-center rounded-full bg-white shadow ring-1 ring-slate-900/10 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function Testimonial() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 mb-20">
        <h2 className="text-slate-900 text-xl sm:text-2xl lg:text-[25px] font-semibold text-left sm:text-left">
          Join others transforming their lives through learning
        </h2>

        {/* Mobile: carousel */}
        <div className="mt-6 sm:hidden">
          <MobileCarousel items={testimonialData} />
        </div>

        {/* Tablet/Desktop: grid (2 → 4) */}
        <ul className="mt-6 hidden sm:grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          {testimonialData.map((t, i) => (
            <li key={i}>
              <Card t={t} />
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-row justify-start items-center gap-2 text-sm font-medium sm:flex">
            <Link
              to="/reviews"
              className="text-[#0d9c06] hover:underline underline-offset-4 text-[15px] font-semibold flex flex-row items-center gap-1 cursor-pointer"
            >
              View all stories <ArrowRight size={16} />
            </Link>
        </div>
      </div>
    </section>
  );
}
