import React from "react";

const PrivacyPolicyPage = () => {
  return (
    <main className="bg-[#f7f9fa] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Page heading */}
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1c1d1f] mb-4">
            Spark Trainings Privacy Policy
          </h1>
          <p className="text-sm sm:text-[15px] text-[#4a4e52] leading-relaxed">
            This Privacy Policy explains how Spark Trainings (&quot;we&quot;,
            &quot;our&quot;, or &quot;us&quot;) collects, uses and protects your
            personal information when you visit our website, contact us, or
            attend our on-site classes in Pakistan.
          </p>
          <p className="mt-2 text-xs text-[#6a6f73]">
            Last updated: 24 November 2025
          </p>
        </header>

        {/* Content card */}
        <section className="bg-white rounded-md shadow-sm border border-[#e4e5e7] px-6 sm:px-8 py-8 sm:py-10 text-sm sm:text-[15px] text-[#1c1d1f] leading-7">
          {/* 1. Information we collect */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              1. Information we collect
            </h2>
            <p className="mb-3">
              We collect different types of information depending on how you use
              Spark Trainings.
            </p>
            <h3 className="font-semibold mb-1">1.1 Information you provide to us</h3>
            <ul className="list-disc ml-5 space-y-1 mb-3">
              <li>
                <span className="font-medium">Contact details</span> – such as
                your name, email address, phone number and city when you fill
                out our contact form, WhatsApp form, or register for a course.
              </li>
              <li>
                <span className="font-medium">Registration information</span> –
                selected course, preferred batch, education background and any
                other details you choose to share during sign-up.
              </li>
              <li>
                <span className="font-medium">Payment information</span> – if
                you pay online, limited billing details may be processed by our
                payment partners. We do not store full card details on our
                servers.
              </li>
              <li>
                <span className="font-medium">Communication data</span> – emails
                or messages you send us, feedback forms, and queries submitted
                through our website or social media.
              </li>
            </ul>

            <h3 className="font-semibold mb-1">1.2 Information collected automatically</h3>
            <p className="mb-2">
              When you visit our website, some information is collected
              automatically to help us improve our services:
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>IP address and approximate location (city / country)</li>
              <li>Device type, browser type and operating system</li>
              <li>Pages visited, time spent, and referring URLs</li>
              <li>
                Basic analytics data collected through tools like Google
                Analytics or similar services
              </li>
            </ul>
          </section>

          {/* 2. How we use your information */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              2. How we use your information
            </h2>
            <p className="mb-2">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>To process your course registration and manage your booking</li>
              <li>To contact you about class schedules, updates and reminders</li>
              <li>To respond to your questions, support requests and feedback</li>
              <li>
                To improve our website, courses and student experience based on
                usage patterns and feedback
              </li>
              <li>
                To send you information about new courses, offers or events
                (only where permitted and you can opt out at any time)
              </li>
            </ul>
          </section>

          {/* 3. Cookies and tracking */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              3. Cookies and tracking technologies
            </h2>
            <p className="mb-2">
              Our website may use cookies and similar technologies to:
            </p>
            <ul className="list-disc ml-5 space-y-1 mb-2">
              <li>Remember your preferences (such as selected course or city)</li>
              <li>Understand how visitors use our site</li>
              <li>
                Improve loading speed and overall performance of the website
              </li>
            </ul>
            <p>
              You can control cookies through your browser settings. Disabling
              cookies may affect some features of the site.
            </p>
          </section>

          {/* 4. How we share information */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              4. How we share your information
            </h2>
            <p className="mb-2">
              We do <span className="font-semibold">not</span> sell your
              personal data. We may share limited information only in the
              following cases:
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                With trusted service providers (e.g., payment gateways, email
                providers, analytics tools) who help us operate our website and
                services.
              </li>
              <li>
                When required by law, regulation, court order, or government
                request.
              </li>
              <li>
                To protect the rights, property, or safety of Spark Trainings,
                our students, or the public.
              </li>
            </ul>
          </section>

          {/* 5. Data retention & security */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              5. Data retention and security
            </h2>
            <p className="mb-2">
              We keep your personal information only for as long as needed to
              provide our services, comply with legal requirements, or resolve
              disputes.
            </p>
            <p>
              We use reasonable technical and organizational measures to protect
              your data. However, no method of transmission over the internet is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* 6. Your rights */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              6. Your rights and choices
            </h2>
            <p className="mb-2">
              Depending on applicable law, you may have the right to:
            </p>
            <ul className="list-disc ml-5 space-y-1 mb-2">
              <li>Request access to the personal data we hold about you</li>
              <li>Ask us to correct inaccurate or incomplete information</li>
              <li>
                Request deletion of your data, where allowed by law and course
                record requirements
              </li>
              <li>
                Opt out of receiving marketing messages by using the unsubscribe
                link or contacting us directly
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us using the
              details provided in the{" "}
              <span className="font-semibold">Contact us</span> section below.
            </p>
          </section>

          {/* 7. Children’s privacy */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              7. Children&apos;s privacy
            </h2>
            <p>
              Our courses are generally aimed at students, young adults and
              professionals. If we offer programs for younger learners, they are
              taken with parental consent. If you believe that a child has
              provided us personal information without consent, please contact
              us so we can remove it.
            </p>
          </section>

          {/* 8. Third-party links */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              8. Third-party websites and services
            </h2>
            <p>
              Our website may contain links to third-party websites (such as
              YouTube, WhatsApp, Facebook, Instagram, or payment gateways). We
              are not responsible for the privacy practices of those websites.
              We encourage you to read their privacy policies before providing
              any personal information.
            </p>
          </section>

          {/* 9. Updates */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">
              9. Changes to this Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in our services or legal requirements. When we update the
              policy, we will revise the &quot;Last updated&quot; date at the
              top. We encourage you to review this page regularly.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact us</h2>
            <p className="mb-2">
              If you have any questions about this Privacy Policy or how we
              handle your data, you can contact us at:
            </p>
            <p className="font-medium">
              Spark Trainings  
            </p>
            <p>
              <strong>Address:</strong> 51/G1 College Road, Spark Trainings, Chishtian
              <br />
              <strong>Email:</strong> <span className="underline">support@sparktrainings.pk</span>
              <br />
              <strong>Phone / WhatsApp:</strong> +92 303 6811 487
            </p>
          </section>

          <p className="mt-6 text-xs text-[#6a6f73]">
            This page is for general informational purposes only and does not
            constitute legal advice. For specific legal guidance about your
            privacy obligations, please consult a qualified professional.
          </p>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPolicyPage;