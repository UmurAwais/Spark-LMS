import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function LoadingBar() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Start loading on route change
    setIsLoading(true);
    setProgress(0);

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(60), 300);
    const timer3 = setTimeout(() => setProgress(90), 500);
    const timer4 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 200);
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [location.pathname]);

  if (!isLoading && progress === 100) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2px] bg-transparent z-9999 transition-opacity duration-200"
      style={{ opacity: isLoading ? 1 : 0 }}
    >
      <div
        className="h-full bg-[#0d9c06] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 3px #0d9c06'
        }}
      />
    </div>
  );
}
