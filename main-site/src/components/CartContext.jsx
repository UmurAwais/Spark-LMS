import React, { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Built-in coupons (change here)
  const COUPONS = {
    SPARK10: { type: 'percent', value: 10, label: '10% off' },
    FLAT500: { type: 'fixed', value: 500, label: 'Rs. 500 off' },
  };

  const addToCart = (course) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === course.id);
      if (exists) return prev; // one course only once
      return [...prev, { ...course, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setItems([]);

  const applyCoupon = (code) => {
    if (!code) return { ok: false, message: 'Enter coupon code' };
    const key = String(code).trim().toUpperCase();
    const found = COUPONS[key];
    if (!found) {
      setAppliedCoupon(null);
      return { ok: false, message: 'Invalid coupon' };
    }
    setAppliedCoupon(found);
    return { ok: true, message: `Applied: ${found.label}`, coupon: found };
  };

  const clearCoupon = () => setAppliedCoupon(null);

  const value = { items, addToCart, removeFromCart, clearCart, appliedCoupon, applyCoupon, clearCoupon };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}