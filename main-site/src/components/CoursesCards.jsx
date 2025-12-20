import React from "react";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";

import courses1 from "../assets/course2.jpg";
import courses4 from "../assets/Courses4.jpg";

const SLIDES = [
  { id: 1, title: "Onsite Courses", learners: "1.7M+", img: courses1, href: "/onsite-courses" },
  { id: 2, title: "Online Courses", learners: "14M+", img: courses4, href: "/online-courses" },
];

function UdemyCard({ card }) {
  return (
    <div>
    <Link to={card.href} className="block relative group h-80 sm:h-[360px] md:h-[420px] rounded-[15px] overflow-hidden ring-1 ring-slate-900/10 bg-slate-100 cursor-pointer">
      {/* Image */}
      <img
        src={card.img}
        alt={card.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/10"></div>

      {/* White Bottom Box */}
      <div className="absolute inset-x-4 bottom-4 sm:bottom-6">
        <div
          className="block rounded-md bg-white/95 p-4 sm:p-5 shadow-lg ring-1 ring-slate-200 hover:shadow-xl transition"
        >
          {/* Learners */}
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-900/10">
            <Users className="h-4 w-4" /> {card.learners}
          </div>

          {/* Title + Arrow */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
              {card.title}
            </h3>
            <ArrowRight className="h-5 w-5 text-slate-700 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
    </div>
  );
}

export default function UdemyTwoCardSection() {
  return (
    <section className="px-4 py-12 lg:py-16 w-full">
      <div className="grid lg:grid-cols-[1fr_1.8fr] gap-12 justify-between items-center max-w-[1440px] mx-auto">
        
        {/* LEFT SIDE — Udemy text block */}
        <div>
          <h2 className="font-semibold text-3xl lg:text-[32px] leading-tight">
            Learn essential <br /> career and life skills
          </h2>

          <p className="mt-3 text-[#595C73] text-base lg:text-[15px] max-w-md">
            Spark Trainings helps you build in-demand skills fast and advance your career
            in a constantly changing job market.
          </p>

          {/* CTA button */}
          <Link
            to="/courses"
            className="inline-flex mt-6 items-center justify-center gap-2 rounded-md bg-[#0d9c06] px-6 py-3 text-sm font-semibold text-white hover:bg-[#11c50a] cursor-pointer"
          >
            Explore all courses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* RIGHT SIDE — EXACT UDEMY STYLE, but only 2 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
          {SLIDES.map((item) => (
            <UdemyCard key={item.id} card={item} />
          ))}
        </div>
      </div>
    </section>
  );
}