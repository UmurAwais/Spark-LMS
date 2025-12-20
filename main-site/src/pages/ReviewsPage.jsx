import React from "react";
import { Quote } from "lucide-react";

const reviews = [
  {
    name: "Ayesha Khan",
    role: "BSCS Student",
    text: "Spark Trainings ne meri life literally change kar di. Web development ka course itna practical tha ke main ab freelance projects le rahi hoon.",
  },
  {
    name: "Mudassir Saleem",
    role: "Web Developer",
    text: "Spark Trainings ke Web Development course ne meri skills ko next level par le jaaya. Ab main ek reputed IT company mein kaam kar raha hoon.",
  },
  {
    name: "Yasir Azad",
    role: "SMM Expert",
    text: "Spark Trainings ke Social Media Marketing course ne mujhe digital marketing ki duniya se introduce karwaya. Ab main apni agency chala raha hoon aur clients ko results de raha hoon.",
  },
  {
    name: "Ali Raza",
    role: "Shopify Store Owner",
    text: "Shopify Masterclass ke baad main ne apna pehla online store launch kiya. Jo cheezen YouTube se samajh nahi aati thin, yahan clear ho gain.",
  },
  {
    name: "Sara Ahmed",
    role: "Graphic Designer",
    text: "Graphic Design Masterclass ne mujhe proper direction di. Ab meray paas ek strong portfolio hai aur main clients ke sath confidently kaam karti hoon.",
  },
  {
    name: "Muhammad Bilal",
    role: "YouTube Creator",
    text: "YouTube Automation course ke through mujhe AI tools aur content system samajh aaya. Ab main multiple faceless channels manage kar raha hoon.",
  },
  {
    name: "Hamza Iqbal",
    role: "Social Media Manager",
    text: "Social Media Marketing Mastery ne mujhe content strategy, reels, aur campaign planning sikha di. Ab main local brands ke pages professionally handle karta hoon.",
  },
  {
    name: "Fatima Noor",
    role: "English Learner",
    text: "English Speaking Mastery ka sabse best part daily speaking practice tha. Ab main interviews aur meetings mein English mein comfortably baat kar sakti hoon.",
  },
];

export default function ReviewsPage() {
  return (
    <main className="bg-[#f7f9fb] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        {/* Heading */}
        <header className="max-w-3xl mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-semibold text-[#1c1d1f] leading-tight">
            What our students say about Spark Trainings
          </h1>
          <p className="mt-3 text-[15px] sm:text-base text-[#6a6f73]">
            Real feedback from learners across Pakistan who joined our
            on-site classes for web development, design, marketing and more.
          </p>
        </header>

        {/* GRID — 2 cols mobile, 3 cols tablet, 4 cols desktop */}
        <section
          aria-label="Student reviews"
          className="
            grid 
            gap-4 sm:gap-5 
            grid-cols-1
            md:grid-cols-3
            xl:grid-cols-4
          "
        >
          {reviews.map((review, idx) => (
            <article
              key={idx}
              className="
                flex h-full flex-col 
                rounded-md border border-[#e4e5e7] 
                bg-white px-6 py-7 
                shadow-sm
               cursor-pointer"
            >
              <Quote className="h-5 w-5 rotate-180 fill-slate-900 text-slate-900 mb-4"/>

              <p className="text-[15px] leading-relaxed text-[#1c1d1f] mb-6">
                {review.text}
              </p>

              <div className="mt-auto">
                <p className="font-semibold text-[#111827] text-[15px]">
                  {review.name}
                </p>
                <p className="text-sm text-[#6a6f73]">{review.role}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}