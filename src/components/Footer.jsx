import React from "react";
import Logo from "../assets/Spark.png";
import { Link } from "react-router-dom";
import { Dot } from "lucide-react";
import { initialCourses as aiCourses } from "../data/initialCourses";

const linkStyle = "relative hover:underline ";

export default function Footer() {
  return (
    <footer className="bg-[#202230] text-white">
      {/* container */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-8">
        {/* top grid */}
        <div className="grid gap-8 sm:gap-10 grid-cols-1 xs:grid-cols-2 md:grid-cols-4">
          {/* Quick Links */}
          <div>
            <h2 className="text-[16px] font-semibold">Quick Links</h2>
              <div className="mt-3 space-y-2 text-sm text-slate-300 flex flex-col w-fit">
                <Link to="/" className={linkStyle}>
                    Home
                </Link>

                <Link to="/courses" className={linkStyle}>
                    Courses
                </Link>

                <Link to="/about" className={linkStyle}>
                    About Us
                </Link>

                <Link to="/gallery" className={linkStyle}>
                    Gallery
                </Link>

                <Link to="/contact" className={linkStyle}>
                    Contact Us
                </Link>
              </div>
          </div>

          {/* Courses */}
          <div>
            <h2 className="text-[16px] font-semibold">Courses</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-300 flex flex-col w-fit">
                <Link to={`/course/${aiCourses[0].id}`} className="hover:underline underline-offset-2 decoration-current focus-visible:underline cursor-pointer">
                  Web Development
                </Link>

                <Link to={`/course/${aiCourses[1].id}`} className="hover:underline underline-offset-2 decoration-current focus-visible:underline cursor-pointer">
                  Graphic Design
                </Link>

                <Link to={`/course/${aiCourses[2].id}`} className="hover:underline underline-offset-2 decoration-current focus-visible:underline cursor-pointer">
                  Video Editing
                </Link>

                <Link to={`/course/${aiCourses[5].id}`} className="hover:underline underline-offset-2 decoration-current focus-visible:underline cursor-pointer">
                  Shopify + Meta Ads
                </Link>

                <Link to={`/course/${aiCourses[4].id}`} className="hover:underline underline-offset-2 decoration-current focus-visible:underline cursor-pointer">
                  YouTube Automation
                </Link>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h2 className="text-[16px] font-semibold">Legal Links</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-300 flex flex-col w-fit">
              <Link to="/privacypolicy" className="hover:underline underline-offset-2 decoration-current focus-visible:underline cursor-pointer">
                Privacy Policy
              </Link>

              <Link to="/termsandconditions" className="hover:underline underline-offset-2 decoration-current focus-visible:underline cursor-pointer">
                Terms and Conditions
              </Link>

              <Link to="/cookiepolicy" className="hover:underline underline-offset-2 decoration-current focus-visible:underline cursor-pointer">
                Cookie Policy
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-[16px] font-semibold">Contact Us</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>
                <span className="font-semibold text-white">Email:</span>{" "}
                contact@sparktrainings.com
              </li>
              <li>
                <span className="font-semibold text-white">Phone:</span>{" "}
                +92 303 6811 487
              </li>
              <li>
                <span className="font-semibold text-white">Address:</span>{" "}
                51/G1 College Road, Chishtian
              </li>
            </ul>
          </div>
        </div>

        {/* divider & bottom row */}
        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:flex-row flex-col">
            <img src={Logo} alt="Spark Trainings" className="w-24 h-auto" />
            <p className="text-xs sm:text-sm text-slate-300">
              &copy; 2026 Spark Trainings. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-slate-300">
              Powered by <a href="https://kbcreatives.pk" className="underline cursor-pointer">KB Creatives</a>.
            </p>
          </div>

          {/* optional bottom links like Udemy */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-300">
              <Link to="/accessibility" className="hover:underline underline-offset-2 decoration-current focus-visible:underline cursor-pointer">
                Accessibility
              </Link> <Dot size={25} />
              
              <Link to="/contact" className="hover:underline underline-offset-2 decoration-current focus-visible:underline cursor-pointer">
                Help & Support
              </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}