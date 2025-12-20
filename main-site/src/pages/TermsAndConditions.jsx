import React from "react";

const TermsAndConditions = () => {
  return (
    <main className="bg-[#f7f9fa] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold font-sora text-[#1c1d1f] mb-4">
            Terms & Conditions
          </h1>
          <p className="text-sm sm:text-[15px] text-[#4a4e52] leading-relaxed">
            These Terms & Conditions govern your use of Spark Trainings’
            website, services, and on-site classes in Pakistan. By enrolling in
            a course, submitting a form, or browsing our website, you agree to
            the policies outlined below.
          </p>
          <p className="mt-2 text-xs text-[#6a6f73]">
            Last updated: 24 November 2025
          </p>
        </header>

        {/* Content Card */}
        <section className="bg-white rounded-md shadow-sm border border-[#e4e5e7] px-6 sm:px-8 py-8 sm:py-10 text-sm sm:text-[15px] text-[#1c1d1f] leading-7">

          {/* 1. Acceptance */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing our website, contacting us, or joining any Spark
              Trainings course, you agree to comply with these Terms &
              Conditions. If you do not agree with any part of this document,
              please discontinue using our services.
            </p>
          </section>

          {/* 2. On-Site Classes */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              2. On-Site Classes & Training Policy
            </h2>
            <p className="mb-2">
              Spark Trainings provides on-site, instructor-led classes. By
              enrolling, you agree to the following:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Your seat is confirmed only after registration & payment.</li>
              <li>
                You must attend classes on the assigned days and timings for
                your selected batch.
              </li>
              <li>
                Spark Trainings has the right to reschedule classes, change
                instructors, or adjust class duration when necessary.
              </li>
              <li>
                Missed classes may not be rescheduled individually unless
                clearly stated by the instructor.
              </li>
            </ul>
          </section>

          {/* 3. Fees */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              3. Fees, Payments & Refund Policy
            </h2>
            <p className="mb-2">
              All course fees must be paid as per the instructions given during
              registration. By paying, you agree to the following:
            </p>
            <ul className="ml-5 list-disc space-y-1 mb-2">
              <li>
                Course fees are **non-refundable**, except in rare cases where
                Spark Trainings cancels a batch entirely.
              </li>
              <li>
                If you miss classes due to personal reasons, fees will not be
                refunded or adjusted.
              </li>
              <li>
                If your payment is made online, the payment gateway may charge
                a processing fee, which is non-refundable.
              </li>
            </ul>
            <p>
              Spark Trainings may offer installment or partial-payment plans for
              some courses. These must be completed before certification is
              issued.
            </p>
          </section>

          {/* 4. Content Use */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              4. Course Material & Intellectual Property
            </h2>
            <p className="mb-2">
              All training content, including slides, video demos, assignments,
              files, and branding materials, are the intellectual property of
              Spark Trainings.
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                You may not copy, resell, distribute, or upload our content
                without written permission.
              </li>
              <li>
                Class recordings (if provided) are for personal learning only.
              </li>
              <li>
                Sharing internal training materials publicly (WhatsApp groups,
                YouTube, TikTok, etc.) is strictly prohibited.
              </li>
            </ul>
          </section>

          {/* 5. Student Conduct */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              5. Student Conduct & Responsibilities
            </h2>
            <p className="mb-2">
              To maintain a professional learning environment, students must:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Treat instructors and classmates with respect.</li>
              <li>Not disrupt or disturb live classes.</li>
              <li>
                Not share offensive content, behave rudely, or violate classroom
                rules.
              </li>
              <li>
                Follow the instructor’s instructions regarding projects,
                assignments and software usage.
              </li>
            </ul>
            <p className="mt-3">
              Spark Trainings reserves the right to remove any student violating
              these rules without refund.
            </p>
          </section>

          {/* 6. Attendance */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">6. Attendance Policy</h2>
            <p className="mb-2">
              Regular attendance is required for successful course completion.
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                If you miss more than the allowed number of classes, you may not
                qualify for certification.
              </li>
              <li>
                Make-up classes depend on instructor availability and are not
                guaranteed.
              </li>
            </ul>
          </section>

          {/* 7. Certification */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              7. Certification Rules
            </h2>
            <ul className="ml-5 list-disc space-y-1">
              <li>Certificates are issued only after course completion.</li>
              <li>
                Completion requires attending required classes and completing
                assigned projects or assessments.
              </li>
              <li>
                Spark Trainings may refuse certification for incomplete
                attendance or misconduct.
              </li>
            </ul>
          </section>

          {/* 8. Website Use */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              8. Use of Website & Online Platforms
            </h2>
            <p className="mb-2">
              By using our website, you agree not to:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>Upload harmful code, scripts or malware</li>
              <li>Attempt to hack, modify or copy website content</li>
              <li>
                Use automated tools to scrape data without permission
              </li>
              <li>Impersonate Spark Trainings staff or instructors</li>
            </ul>
          </section>

          {/* 9. Liability */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              9. Limitation of Liability
            </h2>
            <p>
              Spark Trainings is not responsible for:
            </p>
            <ul className="ml-5 list-disc space-y-1 mt-2">
              <li>Losses due to system outages, internet issues or delays</li>
              <li>Personal devices malfunctioning during class</li>
              <li>
                Job placement or guaranteed income after course completion
              </li>
            </ul>
            <p className="mt-3">
              We provide skill training and guidance — results depend on your
              own efforts, practice and consistency.
            </p>
          </section>

          {/* 10. Changes */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              10. Updates to These Terms
            </h2>
            <p>
              Spark Trainings may update these Terms & Conditions at any time.
              The updated version will always be posted on this page. Continued
              use of our services means you accept the revised terms.
            </p>
          </section>

          {/* 11. Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
            <p className="mb-3">
              For questions regarding these Terms & Conditions, contact us at:
            </p>
            <p className="font-medium">Spark Trainings</p>
            <p>
              <strong>Address:</strong> 51/G1 College Road, Chishtian, Pakistan <br />
              <strong>Email:</strong> support@sparktrainings.pk<br />
              <strong>WhatsApp:</strong> +92 303 6811 487
            </p>
          </section>

          <p className="mt-6 text-xs text-[#6a6f73]">
            These Terms & Conditions are for general information and do not
            constitute legal advice.
          </p>
        </section>
      </div>
    </main>
  );
};

export default TermsAndConditions;