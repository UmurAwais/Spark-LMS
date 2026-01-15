import React, { useEffect, useState } from "react";
import desktopImg from "../assets/Home Banner.webp";
import mobileImg from "../assets/Home Banner Mobile.jpg";

const ImageBanner = ({ mobile, desktop }) => {
  const [currentImg, setCurrentImg] = useState(desktop || desktopImg);

  useEffect(() => {
    const updateImage = () => {
      if (window.innerWidth < 640) {
        setCurrentImg(mobile || mobileImg);
      } else {
        setCurrentImg(desktop || desktopImg);
      }
    };

    updateImage();
    window.addEventListener("resize", updateImage);
    return () => window.removeEventListener("resize", updateImage);
  }, [mobile, desktop]);

  return (
    <div className="w-full mx-auto max-w-[1440px]">
      <div
        className="
          h-[250px] sm:h-80 lg:h-[420px] 
          w-full 
          bg-cover bg-center bg-no-repeat 
          overflow-hidden
        "
        style={{ backgroundImage: `url(${currentImg})` }}
      >
        {/* Optional: overlay */}
        {/* <div className="absolute inset-0 bg-black/20"></div> */}
      </div>
    </div>
  );
};

export default ImageBanner;