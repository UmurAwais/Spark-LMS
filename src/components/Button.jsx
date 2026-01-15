import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Button = () => {
    return (
        <div>
            <Link 
                to="/register"
                className='bg-linear-to-r from-[#0d9c06] to-[#0b7e05] text-[15px] hover:shadow-xl cursor-pointer transition-all hover:scale-105 text-white text-sm rounded-md px-5 py-2.5 flex flex-row gap-1 items-center font-bold'
                target="_self"
                rel="noopener noreferrer"
            >
                Enroll Now
                <ArrowRight size={14} />
            </Link>
        </div>
    );
}

export default Button;