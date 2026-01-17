import React, { useEffect, useState } from "react";
import desktopImage from "../assets/CoursesImage.jpg";
import mobileImage from "../assets/CoursesImageMobile.jpg";
import BannerButton from "../components/BannerButton.jsx";
import CoursesTab from "../components/CoursesTab.jsx";
import OnlineCoursesTab from "../components/OnlineCoursesTab.jsx";
import SEO from "../components/SEO";

const Courses = ({ image }) => {
  const [currentBg, setCurrentBg] = useState(desktopImage);

  useEffect(() => {
    const checkScreen = () => {
      if (window.innerWidth < 640) {
        setCurrentBg(mobileImage); // mobile version
      } else {
        setCurrentBg(image || desktopImage); // desktop version
      }
    };

    checkScreen(); // run on load
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, [image]);

  return (
    <div className="w-full mx-auto pb-12 sm:pb-16">
      <SEO 
        title="Spark Trainings Courses - Master New Skills Today" 
        description="Browse our full catalog of professional courses. From IT and Marketing to Creative Arts and Personal Development, find the perfect course for your goals."
        keywords="full course list, professional skill training, spark trainings catalog, best courses in pakistan, worldwide certification"
        canonical="/courses"
      />
      <div
        className="h-[250px] sm:h-80 lg:h-[420px] w-full mx-auto max-w-[1440px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${currentBg})` }}
      />

      {/* Optional: Content area with spacing below the banner */}
      <div className="block sm:hidden w-full pt-10 pb-10 px-4">
        <h1 className="text-3xl leading-8 font-bold font-sora text-[#1c1d1f] text-center">
            Learn Skills That Power Success
        </h1>
      </div>

      <div className="bg-black h-16 w-full flex justify-center items-center">
        <BannerButton />
      </div>

      <div className="mt-12">
        <OnlineCoursesTab />
      </div>

      <div className="mt-4">
        <CoursesTab />
      </div>
    </div>
  );
};

export default Courses;