import React, { createContext, useContext, useState } from "react";
import { apiFetch } from "../config";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

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

  const applyCoupon = async (code) => {
    if (!code) return { ok: false, message: 'Enter coupon code' };
    
    try {
      const trimmedCode = String(code).trim().toUpperCase();
      const res = await apiFetch(`/api/coupons/validate/${trimmedCode}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setAppliedCoupon(null);
        return { ok: false, message: data.message || 'Invalid coupon' };
      }

      setAppliedCoupon(data.coupon);
      return { ok: true, message: `Applied: ${data.coupon.label}`, coupon: data.coupon };
    } catch (err) {
      console.error('Coupon validation error:', err);
      return { ok: false, message: 'Error validating coupon' };
    }
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