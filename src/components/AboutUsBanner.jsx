import { Sparkles, Trophy, Lightbulb, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import aboutImg from "../assets/About Us Img.png"

export default function AICareerBanner() {
  return (
    <div className="mx-auto w-full px-4">
      <div className="
        bg-green-950 rounded-[18px]
        p-6 sm:p-8 lg:p-11
        mt-1.5 sm:mt-12 lg:mt-[50px]
        mb-8 lg:mb-20
      ">
        {/* Grid layout: stacks on mobile, 40/60 on desktop */}
        <div className="
          grid items-center gap-6 sm:gap-8 lg:gap-10
          grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]
        ">
          {/* Right Side (image) - on mobile show first, on desktop keep right */}
          <div className="order-1 lg:order-2 w-full flex justify-center lg:justify-end">
            <img
              src={aboutImg}
              alt="AI career hero"
              className="
                w-full max-w-[520px] sm:max-w-[620px] lg:max-w-[700px]
                h-auto object-contain
              "
              loading="lazy"
            />
          </div>

          {/* Left Side (copy) */}
          <div className="order-2 lg:order-1 w-full text-left flex flex-col gap-4">
            <h1 className="font-semibold text-white
              text-2xl sm:text-3xl lg:text-[46px]
              leading-tight lg:leading-10
            ">
              Reimagine your career in the AI era
            </h1>

            <p className="text-[#D1D2E0]
              text-sm sm:text-base lg:text-[15px]
            ">
              Future-proof your skills with Spark Trainings. Learn in-demand digital skills through practical, on-site classes designed for international markets. Get expert guidance, real-world projects, and hands-on learning from industry professionals.
            </p>

            {/* Feature pills – wrap like Udemy on small screens */}
            <div className="mt-4 flex flex-wrap gap-x-12 gap-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-purple-200 rounded-full p-1 grid place-items-center">
                  <Sparkles size={16} className="text-green-950" />
                </span>
                <span className="text-white text-[15px]">Learn AI and more</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-amber-200 rounded-full p-1 grid place-items-center">
                  <Trophy size={16} className="text-green-950" />
                </span>
                <span className="text-white text-[15px]">Prep for a certification</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-green-200 rounded-full p-1 grid place-items-center">
                  <Mail size={16} className="text-green-950" />
                </span>
                <span className="text-white text-[15px]">Practice with AI coaching</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-blue-300 rounded-full p-1 grid place-items-center">
                  <Lightbulb size={16} className="text-green-950" />
                </span>
                <span className="text-white text-[15px]">Advance your career</span>
              </div>
            </div>

            <div className="mt-5 sm:mt-6">
              <Link to="/about" className="bg-white text-green-950 px-6 sm:px-8 lg:px-10 py-2.5 lg:py-3 rounded-md hover:bg-gray-200 cursor-pointer">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
