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
        <div className="bg-white p-10 rounded-md shadow-lg max-w-md w-full text-center">
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
        className="bg-white w-full max-w-3xl p-6 sm:p-12 rounded-md shadow-xl border border-[#e4e5e7]"
      >
        {/* Header */}
        <h2 className="text-3xl font-bold text-[#1c1d1f] mb-2">Contact Us</h2>
        <p className="text-[#6a6f73] text-sm mb-6">
          We're here to help. Send us a message and our team will get in touch soon.
        </p>

        {/* Grid: Name + Phone + Course */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Name */}
          <div className="spark-input-group">
            <input
              type="text"
              name="name"
              required
              placeholder=" "
              value={formData.name}
              onChange={handleInputChange}
              className="input-field"
            />
            <User className="spark-input-icon" />
            <label className="floating-label">Your Name</label>
          </div>

          {/* Phone - Pakistani Format (with or without hyphens) */}
          <div className="spark-input-group">
            <input
              type="tel"
              name="phone"
              required
              placeholder=" "
              value={formData.phone}
              onChange={handleInputChange}
              className="input-field"
              pattern="^(03[0-9]{9}|0[0-9]{2,3}[0-9]{7,8})$"
              title="Enter a valid Pakistani phone number (e.g., 03001234567 for mobile or 02112345678 for landline)"
            />
            <Phone className="spark-input-icon" />
            <label className="floating-label">Phone Number (Pakistan)</label>

            <ValidationError
              prefix="Phone Number"
              field="phone"
              errors={state.errors}
              className="text-xs text-red-500 mt-1"
            />
          </div>

          {/* Course Category */}
          <div className="spark-input-group md:col-span-2">
            <select 
              name="course" 
              required 
              value={formData.course}
              onChange={handleInputChange}
              className="input-field"
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
            <BookOpen className="spark-input-icon" />
            <label className="floating-label">Select Course Category</label>
            {/* Custom arrow for select */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6a6f73]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="spark-input-group mt-4 sm:mt-5">
          <textarea
            name="message"
            rows="5"
            required
            placeholder=" "
            value={formData.message}
            onChange={handleInputChange}
            className="input-field"
          />
          <MessageSquare className="spark-input-icon" />
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
          className="spark-submit-btn mt-6 sm:mt-8 cursor-pointer"
        >
          {state.submitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;