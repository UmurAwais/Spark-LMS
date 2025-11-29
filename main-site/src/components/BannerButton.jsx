import React from 'react'
import { Link } from "react-router-dom";

const BannerButton = () => {
  return (
    <div>
        <div className="bg-black h-16 w-full flex justify-center items-center">
            <Link to="/contact" className="text-white text-[20px] font-semibold hover:underline cursor-pointer">
                Start Your Journey Now!
            </Link>
        </div>
    </div>
  )
}

export default BannerButton