import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "../config"; // Assuming apiFetch is a function to handle API calls
import { auth } from "../firebaseConfig";

function CheckoutPage({ selectedCourse }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    city: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [user, setUser] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState("");

  // Check for logged in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Pre-fill form
        const names = (currentUser.displayName || "").split(" ");
        setForm(prev => ({
          ...prev,
          firstName: names[0] || "",
          lastName: names.slice(1).join(" ") || "",
          email: currentUser.email || ""
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setScreenshot(file);
  };

  // create preview URL for selected screenshot
  useEffect(() => {
    if (!screenshot) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(screenshot);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshot]);

  // capture route state items (Cart -> Checkout navigation uses location.state.items)
  const location = useLocation();
  const routeItems = location.state?.items || [];

  // Price helpers for the order summary
  const parsePrice = (p) => {
    if (!p) return 0;
    if (typeof p === "number") return p;
    const num = parseInt(String(p).replace(/[^\d]/g, ""), 10);
    return Number.isNaN(num) ? 0 : num;
  };

  const formatRs = (n) => `Rs. ${Intl.NumberFormat("en-IN").format(n)}`;

  // build items list: prefer cart items, then route items, then selectedCourse
  const items = (routeItems && routeItems.length > 0)
    ? routeItems
    : (selectedCourse ? [{ ...selectedCourse, quantity: 1 }] : []);


  // compute subtotal from items (supports quantity)
  const subtotal = items.reduce((acc, it) => acc + parsePrice(it.price) * (it.quantity || 1), 0);
  const taxRate = 0; // change if needed
  const taxAmount = Math.round(subtotal * taxRate);
  
  // No coupon handling on checkout page; discounts are applied in Cart
  const discount = 0;
  const total = Math.max(0, subtotal + taxAmount - discount);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMsg("");

    if (!screenshot) {
      setServerMsg("Please upload payment screenshot.");
      return;
    }

    // client-side size validation (5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (screenshot.size > maxSize) {
      setServerMsg("Screenshot is too large. Max size is 5 MB.");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("firstName", form.firstName);
      fd.append("lastName", form.lastName);
      fd.append("city", form.city);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("notes", form.notes);
      fd.append("screenshot", screenshot);

      // Append courseId and courseTitle for server compatibility
      if (items.length > 0) {
        fd.append("courseId", items[0].id);
        fd.append("courseTitle", items[0].title);
      }
      
      // Append amount as string
      fd.append("amount", String(total));

      // This is where you call your API to submit the order
      const response = await apiFetch("/api/orders", {
        method: "POST",
        body: fd, // Send the FormData object
      });

      // Handle non-200 responses
      if (!response.ok) {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || `Server error: ${response.status}`);
        } catch (e) {
          // If response is not JSON, use the text or status
          throw new Error(e.message === "Unexpected token" ? `Server error: ${response.status}` : (json?.message || `Server error: ${response.status}`));
        }
      }

      const res = await response.json();

      if (res.success) {
        setServerMsg("Order placed successfully! Please check your email/WhatsApp for confirmation.");
        // Optional: Redirect user or clear form
        setForm({
            firstName: "",
            lastName: "",
            city: "",
            phone: "",
            email: "",
            notes: "",
        });
        setScreenshot(null);
        setPreviewUrl(""); // Clear preview
      } else {
        // Handle server errors (e.g., res.message)
        setServerMsg(res.message || "Order failed to place. Please try again.");
      }

    } catch (error) {
      console.error("Submission error:", error);
      setServerMsg(error.message || "An unexpected error occurred. Please check your connection or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Checkout Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2">
          
          {serverMsg && (
            <div className="text-sm rounded-md px-3 py-2 bg-green-50 border border-green-200 text-green-800 mb-4">
              {serverMsg}
            </div>
          )}

          {/* form body (Udemy-like compact form) */}
          <div className="grid grid-cols-1 gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">First name</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full rounded-md border border-[#e6e7e9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9c06]" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Last name</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full rounded-md border border-[#e6e7e9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9c06]" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Town / City</label>
                <input name="city" value={form.city} onChange={handleChange} required className="w-full rounded-md border border-[#e6e7e9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9c06]" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">WhatsApp number</label>
                <input name="phone" value={form.phone} onChange={handleChange} required className="w-full rounded-md border border-[#e6e7e9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9c06]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full rounded-md border border-[#e6e7e9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9c06]" />
            </div>

            {/* Custom file upload */}
            <div>
              <label className="block text-xs font-semibold mb-2">Upload payment screenshot</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-[#dfe3e6] px-4 py-2 bg-white text-sm hover:bg-slate-50">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <svg className="w-4 h-4 text-[#0d9c06]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><polyline points="7 10 12 5 17 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></polyline><line x1="12" y1="5" x2="12" y2="19" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></line></svg>
                  <span className="text-sm text-[#0d9c06] font-semibold">Choose file</span>
                </label>
                <div className="text-sm text-slate-500">Max 5 MB • JPG/PNG</div>
              </div>

              {previewUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img src={previewUrl} alt="preview" className="w-20 h-14 object-cover rounded-md border" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{screenshot?.name}</div>
                    <div className="text-xs text-slate-500">{(screenshot?.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <button type="button" onClick={() => setScreenshot(null)} className="text-sm text-red-600">Remove</button>
                </div>
              )}

              <p className="mt-2 text-xs text-[#6a6f73]">Upload JazzCash / Easypaisa / Bank transfer receipt.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Order notes (optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full rounded-md border border-[#e6e7e9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9c06]" placeholder="Any extra details about your payment or course?" />
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#0d9c06] px-4 py-3 text-sm font-semibold text-white hover:bg-[#11c50a] disabled:opacity-60 cursor-pointer">
                {loading ? "Processing..." : "Place order"}
              </button>
            </div>
          </div>
        </form>

        {/* Right: Order Summary (Udemy-style card) */}
        <aside className="bg-white rounded-2xl shadow-sm border border-[#e4e5e7] p-6 sm:p-8 h-fit sticky top-20">
          <h2 className="text-lg font-semibold mb-4">Your order</h2>

          {/* Prominent essential totals always visible */}
          <div className="p-4 rounded-md bg-[#f7fcf7] border border-[#eaf7ea] mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[#6a6f73]">Subtotal</span>
              <span className="font-semibold">{formatRs(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[#6a6f73]">Tax</span>
              <span className="text-sm text-[#6a6f73]">{formatRs(taxAmount)}</span>
            </div>

            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[#6a6f73]">Discount</span>
              <span className="text-sm text-[#6a6f73]">{formatRs(discount)}</span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e6efe6]">
              <span className="text-base font-semibold">Total</span>
              <span className="text-lg font-bold text-[#1c1d1f]">{formatRs(total)}</span>
            </div>
          </div>

          {/* Course details (optional) */}
          {items.length > 0 ? (
            <div className="flex gap-3 items-start mb-3">
              <img src={items[0].image} alt={items[0].title} className="w-20 h-14 object-cover rounded-md" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1c1d1f] line-clamp-2">{items[0].title}</p>
                <p className="text-xs text-[#6a6f73] mt-1">Online Training • Spark Trainings</p>
              </div>
            </div>
          ) : (
            <div className="mb-3 text-sm text-slate-500">No course selected — totals show the essential amount.</div>
          )}

          <div className="mt-4 bg-white p-4 rounded-md border border-[#e4e5e7] text-sm text-[#6a6f73]">
            <p className="font-semibold mb-2">JazzCash / Bank Transfer Details</p>
            <p className="mb-0.5"><strong>Account Name:</strong> Hafiza Adila Fazal</p>
            <p className="mb-0.5"><strong>Account No:</strong> 03204045091</p>
            <p className="mb-2"><strong>Bank:</strong> JazzCash</p>
            <p className="mt-1">Please send payment and upload the screenshot in the form. Your enrollment will be confirmed after verification.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CheckoutPage;