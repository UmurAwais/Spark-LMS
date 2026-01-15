import React from "react";

const stats = [
  { value: "81M", label: "Learners" },
  { value: "85K", label: "Instructors" },
  { value: "1.1B", label: "Course enrollments" },
  { value: "17K+", label: "Enterprise customers" },
];

const ImpactSection = () => {
  return (
    <section className="w-full bg-green-950 text-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Heading + subheading */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-semibold font-sans leading-tight">
            Creating impact around the world
          </h2>
          <p className="mt-4 text-sm sm:text-base lg:text-[15px] leading-relaxed text-violet-100">
            With our global catalog spanning the latest skills and topics, people and
            organizations everywhere are able to adapt to change and thrive.
          </p>
        </div>

        {/* Stats */}
        <div
          className="
            mt-10 sm:mt-12 lg:mt-14
            grid gap-x-16 gap-y-8
            grid-cols-2 md:grid-cols-4
            text-center justify-items-center
          "
        >
          {stats.map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div className="text-3xl sm:text-4xl lg:text-[32px] font-extrabold tracking-tight">
                {item.value}
              </div>
              <div className="mt-1 text-xs sm:text-sm lg:text-[13px] text-violet-100">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
