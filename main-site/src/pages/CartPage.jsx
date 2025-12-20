// src/pages/CartPage.jsx
import React, { useMemo, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { X, CheckCircle, Trash2 } from "lucide-react";
import { useCart } from "../components/CartContext";

// helper: Rs. 12,000 -> 12000
function parsePrice(price) {
  if (typeof price === "number") return price;
  const n = parseInt(String(price).replace(/[^\d]/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}
function formatRs(n) {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}


export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, appliedCoupon, applyCoupon } = useCart();
  const location = useLocation();
  const addedCourseId = location.state?.addedCourseId;

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (acc, item) => acc + parsePrice(item.price) * item.quantity,
      0
    );
    // compute coupon discount if any
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') discount = Math.round(subtotal * (appliedCoupon.value / 100));
      else discount = appliedCoupon.value;
    }
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
  }, [items, appliedCoupon]);

  return (
    <div className="bg-[#f7f9fa] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Success banner when coming from Enroll button */}
        {addedCourseId && (
          <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-[#0d9c06]">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Course has been added to your cart.</span>
            </div>
            <Link
              to="/online-courses"
              className="text-xs font-semibold text-[#0d9c06] hover:underline cursor-pointer"
            >
              Continue browsing
            </Link>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* LEFT: cart items */}
          <div className="space-y-4">
            {/* <h1 className="text-xl sm:text-2xl font-bold text-[#1c1d1f]">
              Cart
            </h1> */}

            {items.length === 0 ? (
              <div className="rounded-md bg-white border border-[#e4e5e7] p-8 text-center text-sm text-[#6a6f73]">
                Your cart is empty.{" "}
                <Link
                  to="/online-courses"
                  className="font-semibold text-[#0d9c06] hover:underline cursor-pointer"
                >
                  Browse online courses
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-md bg-white border border-[#e4e5e7] overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 text-xs font-semibold uppercase text-[#6a6f73] border-b border-[#e4e5e7]">
                    <span>Course</span>
                    <span className="text-right">Price</span>
                    <span className="text-right">Quantity</span>
                    <span className="text-right">Subtotal</span>
                  </div>

                  {/* items */}
                  <div className="divide-y divide-[#f0f0f0]">
                    {items.map((item) => {
                      const priceNum = parsePrice(item.price);
                      const subtotal = priceNum * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 sm:px-6 py-4"
                        >
                          {/* product info */}
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="mt-1 text-[#6a6f73] hover:text-red-600"
                              aria-label="Remove course"
                            >
                              <X className="h-4 w-4" />
                            </button>

                            <div className="h-16 w-24 shrink-0 overflow-hidden rounded">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            </div>

                            <div className="flex flex-col justify-center">
                              <p className="text-sm font-semibold text-[#1c1d1f]">
                                {item.title}
                              </p>
                              {item.duration && (
                                <p className="text-xs text-[#6a6f73]">
                                  {item.duration} • Online course
                                </p>
                              )}
                            </div>
                          </div>

                          {/* price */}
                          <div className="flex items-center justify-between sm:block">
                            <span className="sm:hidden text-xs text-[#6a6f73]">
                              Price
                            </span>
                            <p className="text-sm font-semibold text-[#1c1d1f]">
                              {formatRs(priceNum)}
                            </p>
                          </div>

                          {/* quantity (fixed 1 for now) */}
                          <div className="flex items-center justify-between sm:block">
                            <span className="sm:hidden text-xs text-[#6a6f73]">
                              Quantity
                            </span>
                            <div className="inline-flex items-center gap-2 text-sm">
                              <span className="px-3 py-1 rounded border border-[#e4e5e7] bg-[#f7f9fa]">
                                {item.quantity}
                              </span>
                              {/* you can later add +/- buttons here */}
                            </div>
                          </div>

                          {/* subtotal */}
                          <div className="flex items-center justify-between sm:block">
                            <span className="sm:hidden text-xs text-[#6a6f73]">
                              Subtotal
                            </span>
                            <p className="text-sm font-semibold text-[#1c1d1f]">
                              {formatRs(subtotal)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coupon row (functional) */}
                <div className="rounded-md bg-white border border-[#e4e5e7] p-5 flex flex-col sm:flex-row gap-3 items-stretch shadow-sm">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:border-[#0d9c06] focus:ring-2 focus:ring-green-200 transition-all outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const resp = await applyCoupon(couponInput);
                      setCouponMsg(resp.message);
                      if (resp.ok) setCouponInput('');
                    }}
                    className="px-8 py-3 bg-[#0d9c06] text-white rounded-md font-semibold hover:bg-[#0b7e05] transition-all cursor-pointer shadow-sm hover:shadow-md sm:w-auto whitespace-nowrap"
                  >
                    Apply coupon
                  </button>
                </div>
                {couponMsg && <div className="mt-2 text-sm text-[#7a4b00]">{couponMsg}</div>}
              </>
            )}
          </div>

          {/* RIGHT: totals */}
          <div className="space-y-4">
            <div className="rounded-md bg-white border border-[#e4e5e7] p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#1c1d1f] mb-4">
                Cart totals
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
                  <span className="text-[#6a6f73]">Subtotal</span>
                  <span className="font-semibold text-[#1c1d1f]">{formatRs(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-[#0d9c06]">
                    <span>Discount</span>
                    <span className="font-semibold">-{formatRs(totals.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[#6a6f73]">Total</span>
                  <span className="text-xl font-bold text-[#1c1d1f]">{formatRs(totals.total)}</span>
                </div>
              </div>

              <div className="flex mt-5">
                <button
                  onClick={() => navigate("/checkout", { state: { items } })}
                  className="spark-submit-btn"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
            <Link
              to="/online-courses"
              className="block text-center text-sm font-semibold text-[#0d9c06] hover:underline cursor-pointer"
            >
              ← Continue browsing online courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
