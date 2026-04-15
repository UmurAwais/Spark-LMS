import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop.jsx";
import ApiStatusIndicator from "./components/ApiStatusIndicator";
import SparkotSupportChat from "./components/SparkotSupportChat";

export default function App() {
  return (
    <div className="w-full overflow-hidden">
      <ScrollToTop /> 
      <Header />
      <Outlet />   {/* child pages render here */}
      <Footer />
      <SparkotSupportChat />
      <ApiStatusIndicator />
    </div>
  );
}