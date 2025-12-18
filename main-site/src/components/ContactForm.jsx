import React, { useState } from "react";
import { useForm, ValidationError } from "@formspree/react";
import { User, Phone, MessageSquare, BookOpen } from "lucide-react";
import { apiFetch } from "../config";

const FORM_ID = "xldzjbzo";

const ContactForm = () => {
  const [state, handleSubmit] = useForm(FORM_ID);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    course: "",
    message: ""
  });

  // Custom submit handler to send to both Formspree and our backend
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // First, submit to Formspree for email notifications
    await handleSubmit(e);
    
    // Then, send to our backend for admin dashboard
    try {
      await apiFetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
    } catch (error) {
      console.error('Error saving contact to backend:', error);
      // Don't show error to user since Formspree submission succeeded
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (state.succeeded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fa] px-4">
        <div className="bg-white p-10 rounded-2xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-3">🎉 Message Sent!</h2>
          <p className="text-gray-700">Thank you for contacting us! We'll reply soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
      min-h-[540px] 
      bg-[#f7f9fa] 
      flex 
      justify-center 
      px-4 
      pt-14 pb-14 
      sm:pt-16 sm:pb-16 
      md:items-center
    "
    >
      <form
        onSubmit={handleFormSubmit}
        className="bg-white w-full max-w-3xl p-6 sm:p-12 rounded-2xl shadow-xl border border-[#e4e5e7]"
      >
        {/* Header */}
        <h2 className="text-3xl font-bold text-[#1c1d1f] mb-2">Contact Us</h2>
        <p className="text-[#6a6f73] text-sm mb-6">
          We're here to help. Send us a message and our team will get in touch soon.
        </p>

        {/* Grid: Name + Phone + Course */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Name */}
          <div className="relative">
            <User className="absolute left-4 top-4 text-[#6a6f73] w-5 h-5" />

            <input
              type="text"
              name="name"
              required
              placeholder=" "
              value={formData.name}
              onChange={handleInputChange}
              className="input-field"
            />
            <label className="floating-label">Your Name</label>
          </div>

          {/* Phone - Pakistani Format (with or without hyphens) */}
          <div className="relative">
            <Phone className="absolute left-4 top-4 text-[#6a6f73] w-5 h-5" />

            <input
              type="tel"
              name="phone"
              required
              placeholder="03001234567"
              value={formData.phone}
              onChange={handleInputChange}
              className="input-field"
              pattern="^(03[0-9]{9}|0[0-9]{2,3}[0-9]{7,8})$"
              title="Enter a valid Pakistani phone number (e.g., 03001234567 for mobile or 02112345678 for landline)"
            />
            <label className="floating-label">Phone Number (Pakistan)</label>

            <ValidationError
              prefix="Phone Number"
              field="phone"
              errors={state.errors}
              className="text-xs text-red-500 mt-1"
            />
          </div>

          {/* Course Category */}
          <div className="relative md:col-span-2">
            <BookOpen className="absolute left-4 top-4 text-[#6a6f73] w-5 h-5" />

            <select 
              name="course" 
              required 
              value={formData.course}
              onChange={handleInputChange}
              className="input-field bg-white"
            >
              <option value="" disabled>
                Select course category
              </option>
              <option value="Web Development">Web Development</option>
              <option value="Shopify + Meta Ads">Shopify + Meta Ads</option>
              <option value="Shopify Masterclass">Shopify Masterclass</option>
              <option value="Social Media Marketing">Social Media Marketing</option>
              <option value="YouTube Automation">YouTube Automation</option>
              <option value="TikTok Shop">TikTok Shop</option>
              <option value="Graphic Design">Graphic Design</option>
              <option value="Spoken English">Spoken English</option>
            </select>

            <label className="floating-label">Select Course Category</label>
          </div>
        </div>

        {/* Message */}
        <div className="relative mt-4 sm:mt-5">
          <MessageSquare className="absolute left-4 top-4 text-[#6a6f73] w-5 h-5" />

          <textarea
            name="message"
            rows="5"
            required
            placeholder=" "
            value={formData.message}
            onChange={handleInputChange}
            className="input-field resize-none"
          />
          <label className="floating-label">Your Message</label>

          <ValidationError
            prefix="Message"
            field="message"
            errors={state.errors}
            className="text-xs text-red-500 mt-1"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={state.submitting}
          className={`
            w-full mt-6 sm:mt-8 py-3 rounded-md text-white cursor-pointer font-semibold text-sm transition-all
            ${
              state.submitting
                ? "bg-[#11c50a] cursor-not-allowed"
                : "bg-[#0d9c06] hover:bg-[#11c50a]"
            }
          `}
        >
          {state.submitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;