import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../config"; // Assuming apiFetch is a function to handle API calls
import { auth, storage } from "../firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Link } from "react-router-dom";
import { User, MapPin, Phone, Mail, FileText, Lock, Eye, EyeOff } from "lucide-react";
import { useCart } from "../components/CartContext";
import qrCodeImage from "../assets/jazzcash-qr-only.png";

function CheckoutPage({ selectedCourse }) {
  const { appliedCoupon, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    city: "",
    phone: "",
    email: "",
    notes: "",
    password: "",
    confirmPassword: "",
  });
  const [authMode, setAuthMode] = useState("signup"); // 'signup' or 'login'
  const [user, setUser] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState({ text: "", isError: false });

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
      } else {
        setUser(null);
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
  
  // Handle discount from coupon
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discount = Math.round(subtotal * (appliedCoupon.value / 100));
    } else {
      discount = appliedCoupon.value;
    }
  }

  const total = Math.max(0, subtotal + taxAmount - discount);
  const [loadingMsg, setLoadingMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMsg({ text: "", isError: false });

    if (items.length === 0) {
      setServerMsg({ text: "Cart is empty. Please add a course before checking out.", isError: true });
      return;
    }

    if (!screenshot) {
      setServerMsg({ text: "Please upload payment screenshot.", isError: true });
      return;
    }

    // client-side size validation (5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (screenshot.size > maxSize) {
      setServerMsg({ text: "Screenshot is too large. Max size is 5 MB.", isError: true });
      return;
    }

    try {
      console.log("🚀 Starting checkout process...");
      setLoading(true);
      setLoadingMsg("Initializing...");

      let currentUser = user;

      // Handle Authentication if not logged in
      if (!currentUser) {
        console.log("👤 User not logged in, handling authentication...");
        setLoadingMsg(authMode === "signup" ? "Creating account..." : "Logging in...");
        
        if (authMode === "signup") {
          console.log("📝 Attempting signup...");
          if (form.password !== form.confirmPassword) {
            setServerMsg({ text: "Passwords do not match.", isError: true });
            setLoading(false);
            return;
          }

          if (form.password.length < 6) {
            setServerMsg({ text: "Password should be at least 6 characters.", isError: true });
            setLoading(false);
            return;
          }

          try {
            const { user: newUser } = await createUserWithEmailAndPassword(
              auth,
              form.email,
              form.password
            );
            console.log("✅ Firebase user created:", newUser.uid);
            
            await updateProfile(newUser, {
              displayName: `${form.firstName} ${form.lastName}`.trim(),
            });

            // Call backend to register user
            console.log("📡 Registering user in MongoDB...");
            setLoadingMsg("Registering profile...");
            await apiFetch("/api/users/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uid: newUser.uid,
                email: newUser.email,
                displayName: `${form.firstName} ${form.lastName}`.trim(),
              }),
            });
            currentUser = newUser;
            console.log("✅ User registered successfully");
          } catch (err) {
            console.error("Signup error:", err);
            let msg = "Account creation failed. ";
            if (err.code === "auth/email-already-in-use") {
              msg += "This email is already registered. Please try logging in.";
            } else {
              msg += err.message;
            }
            setServerMsg({ text: msg, isError: true });
            setLoading(false);
            return;
          }
        } else {
          console.log("🔑 Attempting login...");
          // Login logic
          try {
            const userCredential = await signInWithEmailAndPassword(
              auth,
              form.email,
              form.password
            );
            currentUser = userCredential.user;
            console.log("✅ User logged in:", currentUser.uid);

            // Generate and save session
            const sessionId = Date.now().toString() + Math.random().toString(36).substring(2);
            await apiFetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uid: currentUser.uid, sessionId }),
            });
            localStorage.setItem(`session_${currentUser.uid}`, sessionId);
          } catch (err) {
            console.error("Login error:", err);
            setServerMsg({ text: "Invalid email or password.", isError: true });
            setLoading(false);
            return;
          }
        }
      }

      // Note: We no longer upload to Firebase Storage to avoid CORS issues.
      // We will send the file directly to our backend via FormData.
      let screenshotFile = screenshot;

      console.log("📦 Preparing order data...");
      setLoadingMsg("Saving order...");
      const fd = new FormData();
      fd.append("uid", currentUser?.uid || "");
      fd.append("firstName", form.firstName);
      fd.append("lastName", form.lastName);
      fd.append("city", form.city);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("notes", form.notes);
      
      // Append the file directly
      if (screenshotFile) {
        fd.append("screenshot", screenshotFile);
      }
      
      // Fix: Append items as JSON string
      fd.append("items", JSON.stringify(items));

      // Append courseId and courseTitle for server compatibility (safely)
      if (items.length > 0) {
        fd.append("courseId", items[0].id || items[0]._id || "");
        fd.append("courseTitle", items[0].title || "");
      }
      
      // Append amount as string
      fd.append("amount", String(total));

      // Append coupon if applied
      if (appliedCoupon) {
        fd.append("couponCode", appliedCoupon.code);
      }

      console.log("📡 Submitting order to backend...");
      
      // Add a timeout for the backend request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await apiFetch("/api/orders", {
          method: "POST",
          body: fd,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log("📥 Backend response received:", response.status);
        
        // Handle non-200 responses
        if (!response.ok) {
          const text = await response.text();
          console.error("❌ Order submission failed with status:", response.status, text);
          try {
            const json = JSON.parse(text);
            setServerMsg({ text: json.message || `Server error: ${response.status}`, isError: true });
          } catch (e) {
            setServerMsg({ text: `Order submission failed: ${response.status}`, isError: true });
          }
          setLoading(false);
          return;
        }

        const res = await response.json();
        console.log("✅ Order response data:", res);

        if (res.success) {
          setLoadingMsg("Order placed!");
          setServerMsg({ text: "Order placed successfully! Redirecting to dashboard...", isError: false });
          
          // Clear cart and form
          if (clearCart) clearCart();
          setForm({
              firstName: "",
              lastName: "",
              city: "",
              phone: "",
              email: "",
              notes: "",
              password: "",
              confirmPassword: "",
          });
          setScreenshot(null);
          setPreviewUrl("");

          // Redirect after a short delay so they can see the message
          setTimeout(() => {
            navigate("/student/dashboard");
          }, 2000);
        } else {
          setServerMsg({ text: res.message || "Order failed to place. Please try again.", isError: true });
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.error("❌ Request timed out");
          setServerMsg({ text: "Order submission timed out. The server is taking too long to respond. Please check your dashboard in a few minutes to see if the order was placed.", isError: true });
        } else {
          throw err;
        }
      }

    } catch (error) {
      console.error("🔥 Global submission error:", error);
      setServerMsg({ text: error.message || "An unexpected error occurred. Please check your connection or try again.", isError: true });
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Checkout Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2">
          
          {serverMsg.text && (
            <div className={`text-sm rounded-md px-3 py-2 border mb-4 ${
              serverMsg.isError 
                ? "bg-red-50 border-red-200 text-red-800" 
                : "bg-green-50 border-green-200 text-green-800"
            }`}>
              {serverMsg.text}
            </div>
          )}

          {user && (
            <div className="text-sm rounded-md px-3 py-2 bg-blue-50 border border-blue-100 text-blue-700 mb-6 flex items-center justify-between">
              <span>Logged in as <strong>{user.email}</strong></span>
              <button 
                type="button" 
                onClick={() => auth.signOut()} 
                className="text-xs font-semibold underline hover:text-blue-800"
              >
                Sign out
              </button>
            </div>
          )}

          {/* form body (Udemy-like compact form) */}
          <div className="grid grid-cols-1 gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="spark-input-group">
                <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder=" " className="input-field" />
                <User className="spark-input-icon" />
                <label className="floating-label">First name</label>
              </div>
              <div className="spark-input-group">
                <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder=" " className="input-field" />
                <User className="spark-input-icon" />
                <label className="floating-label">Last name</label>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="spark-input-group">
                <input name="city" value={form.city} onChange={handleChange} required placeholder=" " className="input-field" />
                <MapPin className="spark-input-icon" />
                <label className="floating-label">Town / City</label>
              </div>
              <div className="spark-input-group">
                <input name="phone" value={form.phone} onChange={handleChange} required placeholder=" " className="input-field" />
                <Phone className="spark-input-icon" />
                <label className="floating-label">WhatsApp number</label>
              </div>
            </div>

            <div className="spark-input-group">
              <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder=" " className="input-field" />
              <Mail className="spark-input-icon" />
              <label className="floating-label">Email address</label>
            </div>

            {!user && (
              <>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-100 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      {authMode === "signup" ? "Create an account" : "Log in to your account"}
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
                      className="text-xs text-[#0d9c06] font-semibold hover:underline"
                    >
                      {authMode === "signup" ? "Already have an account?" : "Need to create an account?"}
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="spark-input-group">
                      <input 
                        type="password" 
                        name="password" 
                        value={form.password} 
                        onChange={handleChange} 
                        required 
                        placeholder=" "
                        className="input-field" 
                      />
                      <Lock className="spark-input-icon" />
                      <label className="floating-label">Password</label>
                    </div>
                    {authMode === "signup" && (
                      <div className="spark-input-group">
                        <input 
                          type="password" 
                          name="confirmPassword" 
                          value={form.confirmPassword} 
                          onChange={handleChange} 
                          required 
                          placeholder=" "
                          className="input-field" 
                        />
                        <Lock className="spark-input-icon" />
                        <label className="floating-label">Confirm password</label>
                      </div>
                    )}
                  </div>
                  {authMode === "signup" && (
                    <p className="text-[10px] text-gray-500 mt-2">
                      Password must be at least 6 characters.
                    </p>
                  )}
                </div>
              </>
            )}

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

            <div className="spark-input-group">
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder=" " className="input-field" />
              <FileText className="spark-input-icon" />
              <label className="floating-label">Order notes (optional)</label>
            </div>

            <div>
              <button type="submit" disabled={loading} className="spark-submit-btn cursor-pointer">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {loadingMsg || "Processing..."}
                  </span>
                ) : "Place order"}
              </button>
            </div>
          </div>
        </form>

        {/* Right: Order Summary (Udemy-style card) */}
        <aside className="bg-white rounded-md shadow-sm border border-[#e4e5e7] p-6 sm:p-8 h-fit sticky top-20 cursor-pointer">
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

          <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Premium Header */}
            <div className="bg-linear-to-r from-[#0d9c06] via-[#0eb507] to-[#0d9c06] px-5 py-3.5 relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"></div>
              <h3 className="font-bold text-base text-white text-center relative z-10 flex items-center justify-center gap-2">
                <span className="text-xl">💳</span>
                <span>Payment Methods</span>
              </h3>
            </div>
            
            <div className="p-5">
              {/* QR Code Section - Enhanced */}
              <div className="mb-5 pb-5 border-b-2 border-dashed border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-8 h-0.5 bg-linear-to-r from-transparent to-gray-300"></div>
                  <p className="font-bold text-sm text-gray-800 uppercase tracking-wide">Scan QR Code</p>
                  <div className="w-8 h-0.5 bg-linear-to-l from-transparent to-gray-300"></div>
                </div>
                
                <div className="flex justify-center mb-3">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-linear-to-r from-yellow-400 to-amber-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-white p-3 rounded-xl border-2 border-gray-300 shadow-md">
                      <img 
                        src={qrCodeImage} 
                        alt="JazzCash/Raast QR Code" 
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                  </div>
                </div>
                
                {/* TILL ID - Enhanced */}
                <div className="bg-linear-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">TILL ID</p>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-2xl font-black text-gray-900 text-center tracking-[0.3em] mb-2 font-mono">981425710</p>
                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-yellow-300">
                    <span className="text-[10px] text-gray-700">Dial</span>
                    <span className="bg-gray-900 text-yellow-400 px-2 py-0.5 rounded font-bold text-xs">*786*10#</span>
                    <span className="text-[10px] text-gray-700">• Enter TILL ID</span>
                  </div>
                </div>
              </div>

              {/* Bank Transfer Section - Enhanced */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-8 h-0.5 bg-linear-to-r from-transparent to-blue-300"></div>
                  <p className="font-bold text-sm text-gray-800 uppercase tracking-wide">Bank Transfer</p>
                  <div className="w-8 h-0.5 bg-linear-to-l from-transparent to-blue-300"></div>
                </div>
                
                <div className="space-y-2">
                  {/* Account Name */}
                  <div className="flex justify-between items-center bg-linear-to-r from-gray-50 to-gray-100 rounded-lg px-4 py-2.5 border border-gray-200 hover:border-gray-300 transition-colors">
                    <span className="text-xs text-gray-600 font-semibold">Account Title</span>
                    <span className="font-bold text-sm text-gray-900">Spark Trainings</span>
                  </div>
                  
                  {/* Account Number */}
                  <div className="flex justify-between items-center bg-linear-to-r from-gray-50 to-gray-100 rounded-lg px-4 py-2.5 border border-gray-200 hover:border-gray-300 transition-colors">
                    <span className="text-xs text-gray-600 font-semibold">Account No</span>
                    <span className="font-bold text-sm text-gray-900 font-mono tracking-wide">2119337597428</span>
                  </div>
                  
                  {/* IBAN */}
                  <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-lg px-4 py-2.5 border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-indigo-700 font-bold uppercase tracking-wide">IBAN</span>
                      <span className="text-[9px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">International</span>
                    </div>
                    <p className="font-bold text-xs text-indigo-900 font-mono tracking-wider break-all">PK50UNIL0109000337597428</p>
                  </div>
                  
                  {/* Bank Name */}
                  <div className="bg-linear-to-r from-blue-500 to-blue-600 rounded-lg px-4 py-3 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-100 font-semibold">Bank</span>
                      <span className="font-bold text-base text-white">United Bank Limited</span>
                    </div>
                    <p className="text-[10px] text-blue-100 mt-1 text-right">UBL Pakistan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note - Enhanced */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 px-5 py-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">📸</span>
                <p className="text-xs text-blue-900 font-medium">
                  Upload payment screenshot above • Enrollment confirmed after verification
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CheckoutPage;