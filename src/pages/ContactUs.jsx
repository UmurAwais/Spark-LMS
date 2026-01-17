import React, { useEffect, useState } from "react";
import desktopImg from "../assets/Contact Image.png";   // add your desktop image
import mobileImg from "../assets/Contact Image Mobile.png"; // add your mobile image
import BannerButton from "../components/BannerButton.jsx";
import ContactForm from "../components/ContactForm.jsx";
import SEO from "../components/SEO";

const ContactUs = ({ image }) => {
  const [currentBg, setCurrentBg] = useState(desktopImg);

  useEffect(() => {
    const checkScreen = () => {
      if (window.innerWidth < 640) {
        setCurrentBg(mobileImg); // mobile version
      } else {
        setCurrentBg(image || desktopImg); // desktop version
      }
    };

    checkScreen(); // run on load
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, [image]);

  return (
    <div className="w-full mx-auto sm:pb-16">
      <SEO 
        title="Contact Us - Get in Touch with Experts" 
        description="Have questions? Contact Spark Trainings for course inquiries, career guidance, or support. We're here to help you spark your potential."
        keywords="contact spark trainings, customer support, course inquiry, spark trainings location, professional training help"
        canonical="/contact"
      />
      <div
        className="h-[250px] sm:h-80 lg:h-[420px] w-full mx-auto max-w-[1440px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${currentBg})` }}
      />

      {/* Optional: Content area with spacing below the banner */}
      <div className="block sm:hidden w-full pt-10 pb-10 px-4">
        <h1 className="text-3xl leading-8 font-bold font-sora text-[#1c1d1f] text-center"> 
            Connecting People With Knowledge
        </h1>
      </div>
      
      <div>
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
            Message
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
            We created Spark Trainings to give every learner access to world-class knowledge, no matter where they come from. Your success drives everything we do.
          </p>
          <span className="font-semibold pt-4"> - CEO, Spark Trainings</span>
      </div>

      <div>
        <ContactForm />
      </div>
    </div>
  );
};

export default ContactUs;