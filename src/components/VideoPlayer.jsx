import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Monitor,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Sliders,
  ArrowLeft,
  Tv,
} from 'lucide-react';
import { getStreamSource, getEmbedCode } from '../services/dataService';
import { sanitizeId, sanitizeUrl } from '../utils/security';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00';
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

const isIPhoneDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && !window.MSStream)
  );
};

export default function VideoPlayer({ movie, cleanTitle, onEpisodeChange }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const hideControlsTimerRef = useRef(null);
  const tapTimeoutRef = useRef(null);
  const lastTapRef = useRef({ time: 0, x: 0 });

  // Stream & playback state
  const [streamUrl, setStreamUrl] = useState('');
  const [playerMode, setPlayerMode] = useState('direct'); // 'direct' (HTML5) | 'embed' (iframe)
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Time & Progress state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);

  // Audio / Volume state
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('mcdubindoflix_vol');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // UI / Display mode state
  const [fitMode, setFitMode] = useState('contain'); // contain | cover | fill
  const [fitToast, setFitToast] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoLandscape, setIsPseudoLandscape] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
    return 'portrait';
  });
  const [showControls, setShowControls] = useState(true);

  // Skip indicator ripples (-10s / +10s)
  const [skipIndicator, setSkipIndicator] = useState(null);

  // Extract embed URL for fallback
  const embedCode = getEmbedCode(movie);
  const safeEmbedCode = sanitizeId(embedCode);
  const embedUrl = safeEmbedCode ? `https://www.dubbindo.site/embed/${safeEmbedCode}` : '';
  const safeExternalUrl = sanitizeUrl(
    movie.url || (movie.slug ? `https://www.dubbindo.site/watch/${encodeURIComponent(movie.slug)}` : '')
  );

  // Track device physical orientation changes
  useEffect(() => {
    const handleOrientation = () => {
      const isLand = window.innerWidth > window.innerHeight;
      setDeviceOrientation(isLand ? 'landscape' : 'portrait');
    };
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Fetch direct stream URL when movie changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsBuffering(false);
    setHasError(false);
    setErrorMsg('');
    setCurrentTime(0);
    setDuration(0);
    setBufferedPercent(0);

    getStreamSource(movie)
      .then((source) => {
        if (!isMounted) return;
        if (source && source.url) {
          setStreamUrl(source.url);
          setPlayerMode('direct');
        } else if (embedUrl) {
          setStreamUrl('');
          setPlayerMode('embed');
          setIsLoading(false);
        } else {
          setHasError(true);
          setErrorMsg('Tautan video tidak dapat dijangkau.');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load stream:', err);
        if (embedUrl) {
          setPlayerMode('embed');
        } else {
          setHasError(true);
          setErrorMsg('Gagal memuat tayangan video.');
        }
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movie, embedUrl]);

  // Apply volume to HTML5 video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, streamUrl]);

  // Auto-hide controls logic
  const startHideControlsTimer = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !isScrubbing) {
        setShowControls(false);
      }
    }, 3500);
  }, [isPlaying, isScrubbing]);

  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    startHideControlsTimer();
  }, [startHideControlsTimer]);

  useEffect(() => {
    if (isPlaying) {
      startHideControlsTimer();
    } else {
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    }
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [isPlaying, startHideControlsTimer]);

  // Track standard Fullscreen API state
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      if (!isFs && !isPseudoLandscape) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [isPseudoLandscape]);

  // Track iOS Safari native fullscreen events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onBeginFs = () => setIsFullscreen(true);
    const onEndFs = () => {
      if (!isPseudoLandscape) setIsFullscreen(false);
    };

    video.addEventListener('webkitbeginfullscreen', onBeginFs);
    video.addEventListener('webkitendfullscreen', onEndFs);

    return () => {
      video.removeEventListener('webkitbeginfullscreen', onBeginFs);
      video.removeEventListener('webkitendfullscreen', onEndFs);
    };
  }, [streamUrl, isPseudoLandscape]);

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Play interrupted:', e));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    handleUserActivity();
  };

  // Skip ±10 seconds
  const skipSeconds = (delta) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(videoRef.current.currentTime + delta, duration || 999999));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    // Show visual badge indicator
    setSkipIndicator({
      type: delta > 0 ? 'forward' : 'rewind',
      text: delta > 0 ? '+10s' : '-10s',
    });
    setTimeout(() => setSkipIndicator(null), 800);

    handleUserActivity();
  };

  // Enter / Exit Simulated Landscape Fullscreen Mode (Works on iPhone with Portrait Lock ON!)
  const enterPseudoLandscape = () => {
    setIsPseudoLandscape(true);
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'instant' });
    handleUserActivity();
  };

  const exitPseudoLandscape = () => {
    setIsPseudoLandscape(false);
    setIsFullscreen(false);
    document.body.style.overflow = '';
    handleUserActivity();
  };

  // Fullscreen toggle (Handles desktop, Android, and iPhone landscape rotation)
  const toggleFullscreen = () => {
    // 1. If currently in pseudo landscape mode, exit it
    if (isPseudoLandscape) {
      exitPseudoLandscape();
      return;
    }

    // 2. If in native browser fullscreen, exit it
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock().catch(() => {});
      }
      setIsFullscreen(false);
      return;
    }

    // 3. iPhone / iOS:
    // User requested: "buat ketika fullscreen langsung miring atau landscape tanpa harus mematikan kunci orentasi"
    // On iPhone, standard element.requestFullscreen is not supported.
    // By activating pseudo landscape, we rotate the player 90 degrees so it instantly fills the screen in landscape!
    if (isIPhoneDevice()) {
      enterPseudoLandscape();
      return;
    }

    // 4. Desktop / Android / Other devices:
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current
          .requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
            if (screen.orientation && screen.orientation.lock) {
              screen.orientation.lock('landscape').catch(() => {});
            }
          })
          .catch(() => {
            enterPseudoLandscape();
          });
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
        setIsFullscreen(true);
      } else {
        enterPseudoLandscape();
      }
    } else {
      enterPseudoLandscape();
    }

    handleUserActivity();
  };

  // Dedicated launcher for Apple's native AVPlayer
  const openNativeIOSPlayer = () => {
    if (videoRef.current && videoRef.current.webkitEnterFullscreen) {
      videoRef.current.webkitEnterFullscreen();
    }
  };

  // Fit mode cycle
  const cycleFitMode = () => {
    let nextMode = 'contain';
    let label = 'Pas Layar (Fit)';
    if (fitMode === 'contain') {
      nextMode = 'cover';
      label = 'Penuh (Zoom)';
    } else if (fitMode === 'cover') {
      nextMode = 'fill';
      label = 'Regang (Stretch)';
    }
    setFitMode(nextMode);
    setFitToast(label);
    setTimeout(() => setFitToast(''), 1500);
    handleUserActivity();
  };

  // Volume slider & mute
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    localStorage.setItem('mcdubindoflix_vol', String(val));
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
    handleUserActivity();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
    handleUserActivity();
  };

  // Timeline / Scrubber events with rotated coordinates support
  const isRotated = isPseudoLandscape && deviceOrientation === 'portrait';

  const handleScrubberClick = (e) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPos = isRotated ? e.clientY - rect.top : e.clientX - rect.left;
    const totalSpan = isRotated ? rect.height : rect.width;
    const percentage = Math.max(0, Math.min(1, clickPos / totalSpan));
    const newTime = percentage * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    handleUserActivity();
  };

  const handleScrubberMouseMove = (e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPos = isRotated ? e.clientY - rect.top : e.clientX - rect.left;
    const totalSpan = isRotated ? rect.height : rect.width;
    const percentage = Math.max(0, Math.min(1, clickPos / totalSpan));
    setHoverPosition(percentage * 100);
    setHoverTime(percentage * duration);
  };

  const handleScrubberMouseLeave = () => {
    setHoverTime(null);
  };

  const handleScrubberTouch = (e) => {
    if (!progressBarRef.current || !videoRef.current || !duration || !e.touches[0]) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const clickPos = isRotated ? touch.clientY - rect.top : touch.clientX - rect.left;
    const totalSpan = isRotated ? rect.height : rect.width;
    const percentage = Math.max(0, Math.min(1, clickPos / totalSpan));
    const newTime = percentage * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    handleUserActivity();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          skipSeconds(-10);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skipSeconds(10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.min(1, v + 0.1);
            localStorage.setItem('mcdubindoflix_vol', String(next));
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.max(0, v - 0.1);
            localStorage.setItem('mcdubindoflix_vol', String(next));
            return next;
          });
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'escape':
          if (isPseudoLandscape) {
            e.preventDefault();
            exitPseudoLandscape();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, isMuted, volume, isPseudoLandscape]);

  // Double-tap gesture handler for mobile & desktop
  const handleVideoTap = (e) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    const pos = isRotated ? clientY - rect.top : clientX - rect.left;
    const span = isRotated ? rect.height : rect.width;

    if (now - lastTapRef.current.time < 320) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);

      if (pos < span * 0.4) {
        skipSeconds(-10);
      } else if (pos > span * 0.6) {
        skipSeconds(10);
      } else {
        togglePlay();
      }
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: pos };
      tapTimeoutRef.current = setTimeout(() => {
        setShowControls((prev) => !prev);
        if (!showControls) startHideControlsTimer();
      }, 300);
    }
  };

  // Video HTML5 event listeners
  const onTimeUpdate = () => {
    if (!videoRef.current || isScrubbing) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }

    if (videoRef.current.buffered.length > 0 && videoRef.current.duration) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBufferedPercent((bufferedEnd / videoRef.current.duration) * 100);
    }
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      videoRef.current.play().catch(() => {});
    }
  };

  const onWaiting = () => setIsBuffering(true);
  const onPlaying = () => {
    setIsBuffering(false);
    setIsLoading(false);
    setIsPlaying(true);
  };
  const onPause = () => setIsPlaying(false);
  const onError = (e) => {
    console.warn('HTML5 Video Error:', e);
    setIsBuffering(false);
    setIsLoading(false);
    if (embedUrl && playerMode === 'direct') {
      setPlayerMode('embed');
    } else {
      setHasError(true);
      setErrorMsg('Tayangan video tidak dapat dimuat. Silakan coba pemutar alternatif.');
    }
  };

  const playedPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Compute container styling for simulated landscape fullscreen
  const pseudoFullscreenStyles = isPseudoLandscape
    ? isRotated
      ? {
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '100vh',
          height: '100vw',
          transform: 'translate(-50%, -50%) rotate(90deg)',
          zIndex: 99999,
          borderRadius: 0,
          border: 'none',
          maxWidth: 'none',
          maxHeight: 'none',
        }
      : {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          borderRadius: 0,
          border: 'none',
          maxWidth: 'none',
          maxHeight: 'none',
        }
    : {};

  return (
    <div
      ref={containerRef}
      style={pseudoFullscreenStyles}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      className={`relative w-full aspect-video max-h-[min(76vh,780px)] bg-black overflow-hidden shadow-2xl select-none group flex items-center justify-center transition-all duration-300 ${
        isPseudoLandscape
          ? ''
          : 'rounded-2xl sm:rounded-3xl border border-[#242436]'
      } ${!showControls && isPlaying ? 'cursor-none' : 'cursor-default'}`}
    >
      {/* 1. Direct HTML5 Video Player */}
      {playerMode === 'direct' && streamUrl && (
        <video
          ref={videoRef}
          src={streamUrl}
          poster={movie.thumbnail}
          playsInline
          autoPlay
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onWaiting={onWaiting}
          onPlaying={onPlaying}
          onPause={onPause}
          onError={onError}
          onClick={handleVideoTap}
          className={`w-full h-full transition-transform duration-200 ${
            fitMode === 'cover'
              ? 'object-cover'
              : fitMode === 'fill'
              ? 'object-fill'
              : 'object-contain'
          }`}
        />
      )}

      {/* 2. Fallback Dubbindo Iframe Embed Player */}
      {playerMode === 'embed' && embedUrl && (
        <iframe
          key={embedUrl}
          src={embedUrl}
          title={cleanTitle}
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className={`w-full h-full border-0 ${
            fitMode === 'cover'
              ? 'object-cover scale-105'
              : fitMode === 'fill'
              ? 'object-fill'
              : 'object-contain'
          }`}
        />
      )}

      {/* Loading Screen Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 animate-in fade-in">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-[#E50914] animate-spin" />
            <Play className="w-5 h-5 text-white absolute inset-0 m-auto" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-200">
            Menghubungkan ke pemutar video...
          </p>
          <span className="text-[11px] text-slate-400">Sulih Suara Indonesia Full HD</span>
        </div>
      )}

      {/* Mid-Video Buffering Indicator */}
      {isBuffering && !isLoading && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          <div className="p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-3 shadow-2xl">
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-[#00E5FF] animate-spin" />
            <span className="text-xs font-medium text-slate-200">Buffering...</span>
          </div>
        </div>
      )}

      {/* Error Fallback Box */}
      {hasError && (
        <div className="absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-semibold text-white">Pemutar Video Mengalami Kendala</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {errorMsg || 'Server pemutar sedang sibuk atau video memerlukan pemutar alternatif.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {embedUrl && playerMode !== 'embed' && (
              <button
                onClick={() => {
                  setHasError(false);
                  setPlayerMode('embed');
                }}
                className="px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ganti ke Mode Web Embed</span>
              </button>
            )}
            {safeExternalUrl && (
              <a
                href={safeExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors flex items-center gap-1.5 border border-white/10"
              >
                <span>Buka di Dubbindo Resmi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Skip Indicators Ripple (-10s / +10s) */}
      {skipIndicator && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-25 pointer-events-none transition-all duration-300 ${
            skipIndicator.type === 'rewind' ? 'left-8 sm:left-16' : 'right-8 sm:right-16'
          }`}
        >
          <div className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-2xl animate-in zoom-in-95">
            {skipIndicator.type === 'rewind' ? (
              <RotateCcw className="w-7 h-7 text-[#00E5FF] animate-pulse" />
            ) : (
              <RotateCw className="w-7 h-7 text-[#00E5FF] animate-pulse" />
            )}
            <span className="text-xs font-bold tracking-wider">{skipIndicator.text}</span>
          </div>
        </div>
      )}

      {/* Fit Mode Toast Indicator */}
      {fitToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-25 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-[#00E5FF]/40 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
            <Monitor className="w-4 h-4 text-[#00E5FF]" />
            <span>Ukuran Layar: {fitToast}</span>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay */}
      {playerMode === 'direct' && !hasError && (
        <div
          className={`absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-300 ${
            showControls || !isPlaying
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          style={{
            paddingLeft: isPseudoLandscape ? 'max(16px, env(safe-area-inset-left, 16px))' : undefined,
            paddingRight: isPseudoLandscape ? 'max(16px, env(safe-area-inset-right, 16px))' : undefined,
            paddingBottom: isPseudoLandscape ? 'max(12px, env(safe-area-inset-bottom, 12px))' : undefined,
          }}
        >
          {/* Top Bar: Back button (in Fullscreen), Title & Quick Switches */}
          <div className="w-full bg-gradient-to-b from-black/85 via-black/45 to-transparent p-3 sm:p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              {/* Back / Exit Fullscreen Button */}
              {(isPseudoLandscape || isFullscreen) && (
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-medium backdrop-blur transition-all active:scale-95 shadow shrink-0"
                  title="Keluar Layar Penuh"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Kembali</span>
                </button>
              )}

              <span className="bg-[#E50914] text-white text-[10px] font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wider">
                DUB INDO
              </span>
              <span className="text-xs sm:text-sm font-medium text-white truncate drop-shadow">
                {cleanTitle}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Apple AVPlayer native fullscreen launcher for iOS */}
              {videoRef.current && typeof videoRef.current.webkitEnterFullscreen === 'function' && (
                <button
                  onClick={openNativeIOSPlayer}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15 text-[11px] font-medium backdrop-blur transition-colors flex items-center gap-1.5"
                  title="Buka Pemutar Asli iOS (Apple AVPlayer)"
                >
                  <Tv className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span className="hidden md:inline">Pemutar iOS</span>
                </button>
              )}

              {/* Quick Web Embed Switcher */}
              {embedUrl && (
                <button
                  onClick={() => setPlayerMode('embed')}
                  className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-white/15 text-[11px] font-medium backdrop-blur transition-colors flex items-center gap-1.5"
                  title="Beralih ke Pemutar Web Iframe"
                >
                  <Sliders className="w-3 h-3 text-[#00E5FF]" />
                  <span className="hidden sm:inline">Mode Web</span>
                </button>
              )}
            </div>
          </div>

          {/* Center Play / Pause & ±10s Skip Buttons */}
          <div className="w-full flex items-center justify-center gap-6 sm:gap-10 pointer-events-auto">
            {/* -10s Button */}
            <button
              onClick={() => skipSeconds(-10)}
              className="p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white border border-white/15 hover:border-white/40 transition-all transform active:scale-90 flex flex-col items-center justify-center group/skip shadow-xl"
              title="Mundur 10 Detik (J atau Panah Kiri)"
            >
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-slate-200 group-hover/skip:text-white" />
              <span className="text-[9px] font-bold -mt-0.5 text-slate-300">10</span>
            </button>

            {/* Big Play / Pause Button */}
            <button
              onClick={togglePlay}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#E50914] hover:bg-red-700 text-white flex items-center justify-center transition-all transform active:scale-95 shadow-2xl shadow-red-600/40 hover:scale-105"
              title={isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
              ) : (
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current translate-x-0.5" />
              )}
            </button>

            {/* +10s Button */}
            <button
              onClick={() => skipSeconds(10)}
              className="p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white border border-white/15 hover:border-white/40 transition-all transform active:scale-90 flex flex-col items-center justify-center group/skip shadow-xl"
              title="Maju 10 Detik (L atau Panah Kanan)"
            >
              <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-slate-200 group-hover/skip:text-white" />
              <span className="text-[9px] font-bold -mt-0.5 text-slate-300">10</span>
            </button>
          </div>

          {/* Bottom Control Bar (Two Dedicated Rows: Scrubber on Top, Buttons Below) */}
          <div className="w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-6 pb-3 sm:pb-4 px-3 sm:px-6 flex flex-col gap-2">
            {/* ROW 1: Dedicated Scrubber / Progress Bar (Zero Overlap with any buttons) */}
            <div
              ref={progressBarRef}
              onClick={handleScrubberClick}
              onMouseMove={handleScrubberMouseMove}
              onMouseLeave={handleScrubberMouseLeave}
              onTouchStart={handleScrubberTouch}
              onTouchMove={handleScrubberTouch}
              className="relative w-full h-3 sm:h-4 flex items-center cursor-pointer group/bar"
            >
              {/* Background Track */}
              <div className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full relative overflow-hidden transition-all group-hover/bar:h-2">
                {/* Buffered Track */}
                <div
                  className="absolute top-0 left-0 h-full bg-white/40 rounded-full transition-all duration-200"
                  style={{ width: `${bufferedPercent}%` }}
                />
                {/* Played Track */}
                <div
                  className="absolute top-0 left-0 h-full bg-[#E50914] rounded-full"
                  style={{ width: `${playedPercentage}%` }}
                />
              </div>

              {/* Scrubber Knob */}
              <div
                className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full shadow-md border-2 border-[#E50914] transform -translate-x-1/2 scale-0 group-hover/bar:scale-100 transition-transform pointer-events-none"
                style={{ left: `${playedPercentage}%` }}
              />

              {/* Hover Timestamp Tooltip */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-white text-[11px] font-medium border border-white/20 shadow pointer-events-none"
                  style={{ left: `${hoverPosition}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>

            {/* ROW 2: Bottom Control Actions (Nicely Spaced Left & Right) */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {/* Left Action Group */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Play / Pause Toggle */}
                <button
                  onClick={togglePlay}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                  title={isPlaying ? 'Jeda' : 'Putar'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  )}
                </button>

                {/* Rewind -10s */}
                <button
                  onClick={() => skipSeconds(-10)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center"
                  title="Mundur 10 Detik"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Forward +10s */}
                <button
                  onClick={() => skipSeconds(10)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center"
                  title="Maju 10 Detik"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Volume & Mute Section */}
                <div
                  className="relative flex items-center gap-1.5 group/vol"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <button
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    title={isMuted ? 'Batal Bisukan (M)' : 'Bisukan (M)'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  {/* Volume Slider */}
                  <div
                    className={`flex items-center overflow-hidden transition-all duration-200 ${
                      showVolumeSlider ? 'w-16 sm:w-20 opacity-100' : 'w-0 sm:w-16 opacity-0 sm:opacity-90'
                    }`}
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
                      title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                    />
                  </div>
                </div>

                {/* Time Display */}
                <div className="text-[11px] sm:text-xs font-medium text-slate-300 tabular-nums pl-1 flex items-center gap-1.5">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-slate-500">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Action Group */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Fit Mode Button */}
                <button
                  onClick={cycleFitMode}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 border border-white/10 shadow"
                  title="Ubah Ukuran Video (Fit / Zoom / Stretch)"
                >
                  <Monitor className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span className="hidden md:inline">
                    {fitMode === 'contain'
                      ? 'Pas Layar'
                      : fitMode === 'cover'
                      ? 'Penuh'
                      : 'Regang'}
                  </span>
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                  title={isPseudoLandscape || isFullscreen ? 'Keluar Layar Penuh (F)' : 'Layar Penuh (F)'}
                >
                  {isPseudoLandscape || isFullscreen ? (
                    <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-[#00E5FF]" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Web Player Mode Controls (When in Iframe Mode) */}
      {playerMode === 'embed' && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {streamUrl && (
            <button
              onClick={() => setPlayerMode('direct')}
              className="px-3 py-1.5 rounded-xl bg-[#E50914] text-white text-xs font-medium shadow-lg hover:bg-red-700 transition-all flex items-center gap-1.5"
              title="Beralih ke Pemutar Langsung Tanpa Iklan"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Mode Bebas Iklan</span>
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-black/75 backdrop-blur text-white border border-white/20 hover:bg-black/90 shadow"
            title={isPseudoLandscape || isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isPseudoLandscape || isFullscreen ? <Minimize className="w-4 h-4 text-[#00E5FF]" /> : <Maximize className="w-4 h-4 text-white" />}
          </button>
        </div>
      )}
    </div>
  );
}
