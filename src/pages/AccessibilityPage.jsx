import React from "react";

const AccessibilityPage = () => {
  return (
    <main className="bg-[#f7f9fa] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white shadow-sm rounded-md px-4 sm:px-8 py-8 sm:py-10">
        {/* Page Title */}
        <header className="mb-8 sm:mb-10 border-b border-gray-200 pb-4">
          <h1 className="text-3xl sm:text-4xl font-sora font-bold text-[#1c1d1f]">
            Spark Trainings Accessibility Statement
          </h1>
        </header>

        {/* Accessibility Commitment */}
        <section className="mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1c1d1f] mb-3">
            Accessibility Commitment
          </h2>
          <p className="text-sm sm:text-[15px] leading-7 text-[#1c1d1f] mb-3">
            Our goal is to provide accessible, practical, and effective skill development
            for learners across Pakistan. We believe that high-quality educational content
            should be available to everyone, which is why accessibility is an important
            area of focus for Spark Trainings.
          </p>
          <p className="text-sm sm:text-[15px] leading-7 text-[#1c1d1f]">
            Our team is continuously working to improve the accessibility of our website,
            training materials, and on-site learning experience. Below are some examples
            of how we are building a more accessible Spark Trainings platform:
          </p>
        </section>

        {/* Bullet list section (like Udemy style) */}
        <section className="mb-8 sm:mb-10">
          <ul className="list-disc pl-5 space-y-3 text-sm sm:text-[15px] leading-7 text-[#1c1d1f]">
            <li>
              <span className="font-semibold">Accessibility guidelines.</span>{" "}
              We strive to align with the Web Content Accessibility Guidelines (WCAG) 2.1
              issued by the World Wide Web Consortium (W3C), as well as recommended
              accessibility best practices. We review our website and materials using
              principles from the Accessible Rich Internet Applications (WAI-ARIA)
              specification.
            </li>

            <li>
              <span className="font-semibold">Compatibility testing.</span>{" "}
              We review key parts of our website for compatibility with common assistive
              technologies, including screen readers and built-in accessibility tools
              available on Windows, macOS, iOS and Android devices. We aim to ensure
              that navigation, buttons, forms and links are usable through keyboard and
              assistive software.
            </li>

            <li>
              <span className="font-semibold">Subtitles and closed captions.</span>{" "}
              While our classes are delivered on-site, many of our digital learning
              resources include captioned or transcribed content when applicable. We are
              working to expand caption support in future online materials and video
              content.
            </li>

            <li>
              <span className="font-semibold">Readable design.</span>{" "}
              We ensure that our typography, color choices, spacing and layout follow
              accessibility-conscious design principles. Our aim is to support better
              visibility and readability for learners with visual or cognitive
              disabilities.
            </li>

            <li>
              <span className="font-semibold">Keyboard accessibility.</span>{" "}
              Core pages of our website can be navigated using keyboard-only controls.
              We test and update key interactions to support users who rely on
              non-mouse input methods.
            </li>

            <li>
              <span className="font-semibold">Clear communication.</span>{" "}
              Our website content, course details, schedules and instructions are
              written in clear, simple language. We offer guidance in both{" "}
              <span className="font-semibold">Urdu and English</span> during on-site
              classes to support broader accessibility.
            </li>

            <li>
              <span className="font-semibold">Instructor support.</span>{" "}
              Our instructors provide additional explanations, visual demonstrations and
              time flexibility where needed, helping us maintain an inclusive learning
              environment for students with different needs.
            </li>

            <li>
              <span className="font-semibold">Ongoing improvements.</span>{" "}
              We regularly review our design, content and classroom experience with
              accessibility in mind and make updates as needed. We are committed to
              learning and improving over time.
            </li>
          </ul>
        </section>

        {/* Accessibility assistance */}
        <section className="mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1c1d1f] mb-3">
            Accessibility Assistance
          </h2>
          <p className="text-sm sm:text-[15px] leading-7 text-[#1c1d1f] mb-3">
            If you experience difficulty accessing any part of the Spark Trainings
            website, or if you need accommodations for an on-site class, we are here to
            help. We value your feedback and use it to improve our services.
          </p>
          <p className="text-sm sm:text-[15px] leading-7 text-[#1c1d1f]">
            Please contact us at:
          </p>
          <ul className="mt-2 space-y-1 text-sm sm:text-[15px] leading-7 text-[#1c1d1f]">
            <li>
              <span className="font-semibold">Email:</span>{" "}
              <a
                href="mailto:support@sparktrainings.pk"
                className="text-[#0d9c06] hover:underline cursor-pointer"
              >
                support@sparktrainings.pk
              </a>
            </li>
            <li>
              <span className="font-semibold">Phone:</span> +92 303 6811 487
            </li>
            <li>
              <span className="font-semibold">Address:</span> 51/G1 College Road, Spark Trainings, Chishtian
            </li>
          </ul>
          <p className="text-xs sm:text-[13px] text-gray-600 mt-3">
            When contacting us, please include the page URL where you experienced the
            issue, a brief description of the problem, and the device, browser or
            assistive technology you were using (if applicable). This helps us identify
            and resolve the problem more quickly.
          </p>
        </section>

        {/* Footer info */}
        <section className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-xs sm:text-[13px] text-gray-600">
            Last updated: February 2026
          </p>
        </section>
      </div>
    </main>
  );
};

export default AccessibilityPage;