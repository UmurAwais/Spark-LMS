import React from "react";
import kbcreatives from "../assets/KB Creatives.png";
import noxu from "../assets/Noxus.png";
import shebuild from "../assets/She build.png";
import sparkskills from "../assets/Spark Skills.png";
import organichub from "../assets/Organic Hub.png";

export default function TrustedByLogos({
  heading = "Trusted by Partners",
  logos = [
    { name: "KB Creatives", src: kbcreatives },
    { name: "Noxu Technologies", src: noxu },
    { name: "She Build", src: shebuild },
    { name: "Spark Skills", src: sparkskills },
    { name: "Organic Hub", src: organichub },
  ],
}) {
  return (
    <section className="w-screen bg-[#F6F7F9] my-8 sm:my-12 lg:my-20">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:py-14 lg:py-16">
        {/* Heading */}
        <p className="mx-auto max-w-3xl text-center text-[18px] sm:text-[25px] font-semibold text-slate-600">
          {heading}
        </p>

        {/* Logos */}
        <div
          className="
            mt-8 sm:mt-10
            flex items-center justify-center
            grid-cols-2 gap-x-8 gap-y-8
            sm:grid-cols-4 sm:gap-y-10
            lg:grid-cols-8 lg:gap-y-12
          "
        >
          {logos.map((logo) => {
            const Img = (
              <img
                loading="lazy"
                src={logo.src}
                alt={logo.name}
                className="
                  mx-auto h-7 w-auto
                  sm:h-8
                  lg:h-14
                  opacity-80 grayscale
                  transition
                  hover:opacity-100 hover:grayscale-0
                "
              />
            );
            return (
              <div key={logo.name} className="flex items-center justify-center">
                {logo.href ? (
                  <a
                    href={logo.href}
                    aria-label={logo.name}
                    className="inline-flex items-center cursor-pointer"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {Img}
                  </a>
                ) : (
                  Img
                )}
              </div>
            );
          })}
        </div>
      </div>  
    </section>
  );
}
