import React from "react";
import ImageBanner from "../components/ImageBanner";
import CoursesCards from "../components/CoursesCards";
import SearchBar from "../components/SearchBar";
import AboutUsBanner from "../components/AboutUsBanner";
import CoursesTab from "../components/CoursesTab";
import TrustedByLogos from "../components/TrustedByLogos";
import Testimonial from "../components/Testimonial";
import { Link } from "react-router-dom";
import OnlineCoursesTab from "../components/OnlineCoursesTab";

export default function Home() {
  return (
    <>
      <div className="w-full max-w-[1440px] mx-auto font-display">
        <ImageBanner />

        {/* Mobile-only CTA */}
        <div className="block sm:hidden px-4 py-8 border-b border-gray-200 w-full">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-2xl sm:text-3xl lg:text-[36px] leading-tight lg:leading-10">
              Master tomorrow's skills today
            </h2>
            <p className="text-[#595C73] text-base sm:text-lg lg:text-xl">
              Join thousands of learners and start your journey towards a brighter future.
            </p>
            <Link to="/contact" className="w-full bg-linear-to-r from-[#0d9c06] to-[#0b7e05] hover:shadow-xl text-white font-bold py-3 px-4 rounded-md transition-all hover:scale-105 mt-1.5 flex text-center justify-center cursor-pointer">
              Get started
            </Link>
            <SearchBar />
          </div>
        </div>

        {/* Section 2 */}
        <div className="flex flex-row gap-5">
          <CoursesCards />
        </div>

        {/* Section 3 */}
        <AboutUsBanner />
      </div>

      {/* Section 4 */}
      <div>
        <OnlineCoursesTab />
      </div>

      {/* Section 5 */}
      <CoursesTab />

      {/* Section 6 */}
      <TrustedByLogos />

      {/* Section 7 */}
      <div className="flex mx-auto max-w-[1440px] w-full">
        <Testimonial />
      </div>
    </>
  );
}
