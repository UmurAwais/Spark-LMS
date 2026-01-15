import React, { useEffect, useState } from "react";
import desktopImage from "../assets/OnsiteCoursesImage.jpg";
import mobileImage from "../assets/OnsiteCoursesImageMobile.jpg";
import BannerButton from "../components/BannerButton.jsx";
import CoursesTab from "../components/CoursesTab.jsx";

const OnsiteCourses = () => {
  const [currentBg, setCurrentBg] = useState(desktopImage);

  useEffect(() => {
    const checkScreen = () => {
      if (window.innerWidth < 640) {
        setCurrentBg(mobileImage); // mobile version
      } else {
        setCurrentBg(desktopImage); // desktop version
      }
    };

    checkScreen(); // run on load
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <div className="w-full mx-auto pb-12 sm:pb-16">
      <div
        className="h-[250px] sm:h-80 lg:h-[420px] w-full mx-auto max-w-[1440px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${currentBg})` }}
      />

      {/* Optional: Content area with spacing below the banner */}
      <div className="block sm:hidden w-full pt-10 pb-10 px-4">
        <h1 className="text-3xl leading-8 font-bold font-sora text-[#1c1d1f] text-center">
            Level Up With Hands-On Training
        </h1>
      </div>

      <div className="bg-black h-16 w-full flex justify-center items-center">
        <BannerButton />
      </div>

      <div className="mt-12">
        <CoursesTab />
      </div>
    </div>
  );
};

export default OnsiteCourses;