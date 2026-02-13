import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { API_URL } from '../config';

export default function VideoPlayer({ videoUrl, previewUrl, title, poster, isPreview = false, onEnded, onPlay, onPause }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Use preview URL if in preview mode, otherwise use full video URL
  let videoSource = isPreview ? previewUrl : videoUrl;
  
  // Prefix with API_URL if it's a relative path
  if (videoSource && !videoSource.startsWith('http')) {
    videoSource = `${API_URL}${videoSource}`;
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value) / 100;
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        const container = videoRef.current.parentElement;
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        }
      }
    }
  };

  const skipTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div 
      className="relative w-full max-w-[1000px] mx-auto bg-black rounded-lg sm:rounded-2xl overflow-hidden group shadow-2xl border border-white/10"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        if (isPlaying) setShowControls(false);
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => {
          setIsPlaying(true);
          if (onPlay) onPlay();
        }}
        onPause={() => {
          setIsPlaying(false);
          if (onPause) onPause();
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onClick={togglePlay}
        src={videoSource}
        preload="auto"
        poster={poster}
        playsInline
      >
        Your browser does not support the video tag.
      </video>

      {/* Subtle Gradient only */}
      <div className={`absolute inset-0 bg-linear-to-t from-black/60 via-transparent pointer-events-none transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`} />

      {/* Minimal Center Play Button */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <button
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 cursor-pointer"
          >
            <Play size={32} className="text-white ml-1" fill="currentColor" />
          </button>
        </div>
      )}

      {/* Minimal Controls */}
      <div 
        className={`absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-30 transition-all duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 sm:p-3">
          {/* Progress Bar */}
          <div className="relative group/progress mb-2 sm:mb-3">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={(currentTime / duration) * 100 || 0}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0d9c06] relative"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-5">
              <button onClick={togglePlay} className="text-white hover:text-[#0d9c06] transition-colors">
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>

              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="text-white/80 hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-16 transition-all duration-300 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div className="text-white/70 text-[10px] sm:text-xs font-medium tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <button onClick={toggleFullscreen} className="text-white/80 hover:text-white transition-transform hover:scale-110">
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Header Overlay */}
      {title && (showControls || !isPlaying) && (
        <div className="absolute top-0 left-0 right-0 p-3 sm:p-6 flex justify-between items-start z-30 pointer-events-none">
          <div className="bg-black/20 backdrop-blur-md px-3 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-2xl border border-white/10 pointer-events-auto">
            <h3 className="text-white font-semibold text-[10px] sm:text-sm tracking-wide truncate max-w-[150px] sm:max-w-none">{title}</h3>
          </div>
          
          <button 
            onClick={() => { if(videoRef.current) videoRef.current.currentTime = 0 }}
            className="bg-black/20 backdrop-blur-md p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-white/10 text-white/70 hover:text-white transition-colors pointer-events-auto cursor-pointer"
            title="Restart Video"
          >
            <RotateCcw size={14} className="sm:hidden" />
            <RotateCcw size={16} className="hidden sm:block" />
          </button>
        </div>
      )}

      {/* Custom Styles for Slider/Range Inputs */}
      <style>{`
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }
        
        @media (min-width: 640px) {
          .slider::-webkit-slider-thumb {
            width: 12px;
            height: 12px;
          }
        }
        
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 8px;
          width: 8px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
        }
        
        @media (min-width: 640px) {
          input[type='range']::-webkit-slider-thumb {
            height: 12px;
            width: 12px;
          }
        }
      `}</style>
    </div>
  );
}


