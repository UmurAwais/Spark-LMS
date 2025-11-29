import React, { useEffect, useState } from "react";
import desktopBg from "../assets/About us.webp";
import mobileBg from "../assets/about us mobile.webp";
import BannerButton from "../components/BannerButton.jsx";
import AboutPageStats from "../components/AboutPageStats.jsx";
import Button from "../components/Button.jsx";
import Testimonial from "../components/Testimonial";
import TrustedByLogos from "../components/TrustedByLogos";

const AboutUs = ({ image }) => {
  const [currentBg, setCurrentBg] = useState(desktopBg);

  useEffect(() => {
    const checkScreen = () => {
      if (window.innerWidth < 640) {
        setCurrentBg(mobileBg);
      } else {
        setCurrentBg(image || desktopBg);
      }
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, [image]);

  return (
    <div className="w-full mx-auto pb-12 sm:pb-16"> 
      {/* ↑ This adds bottom spacing */}

      <div
        className="h-[250px] sm:h-80 lg:h-[420px] w-full mx-auto max-w-[1440px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${currentBg})` }}
      ></div>

      {/* Optional: Content area with spacing below the banner */}
      <div className="block sm:hidden w-full pt-10 pb-10 px-4">
        <h1 className="text-3xl leading-8 font-bold font-sora text-[#1c1d1f] text-center">
            Welcome To Where Possibilities Begin
        </h1>
      </div>

      <div className="bg-black h-16 w-full flex justify-center items-center">
        <BannerButton />
      </div>

      <div className="w-full py-10 sm:py-14 lg:py-14 flex flex-col items-center text-center px-4">
  {/* Heading */}
          <h1 className="
              font-bold font-sans text-[#1c1d1f]
              text-[26px] leading-8
              sm:text-[32px] sm:leading-[38px]
              lg:text-[40px] lg:leading-12
              max-w-[800px]
          ">
            Skills are the key to unlocking potential
          </h1>
  {/* Subheading */}
          <p className="
              mt-4
            text-[#1c1d1f]/80
              text-[14px] leading-[22px]
              sm:text-[15px] sm:leading-6
              lg:text-[17px] lg:leading-[26px]
              max-w-[750px]
          ">
            Whether you want to learn a new skill, train your teams, or share what you
            know with the world, you’re in the right place. As a leader in online learning,
            we’re here to help you achieve your goals and transform your life.
          </p>
      </div>

      <div>
        <AboutPageStats />
      </div>

      <div className="w-full sm:pt-14 pt-10 pb-5 lg:pt-14 flex flex-col items-center text-center px-4">
        <p className="text-[#1c1d1f]/80
              text-[14px] leading-[22px]
              sm:text-[15px] sm:leading-6
              lg:text-[17px] lg:leading-[26px]
              max-w-[750px] pb-5">We help organizations of all types and sizes prepare for the path ahead — wherever it leads. Our curated collection of business and technical courses help companies, governments, and nonprofits go further by placing learning at the center of their strategies.</p>
        <Button />
      </div>

      <div>
        <TrustedByLogos />
      </div>

      <div>
        <Testimonial />
      </div>
    </div>
  )
};

export default AboutUs;