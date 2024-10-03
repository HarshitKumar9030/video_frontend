"use client";

import React, { useState, useRef, useEffect } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Captions,
  SkipBack,
  SkipForward,
  Minimize,
  RefreshCw,
  Repeat,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toast } from "@/components/ui/toast";

interface VideoPlayerProps {
  videoId: string;
  initialToken: string;
}

interface Caption {
  start: number;
  end: number;
  text: string;
}

const sampleCaptions = {
  en: [
    { start: 0, end: 5, text: "Welcome to our video!" },
    { start: 5, end: 10, text: "This is a sample caption in English." },
    {
      start: 10,
      end: 15,
      text: "Captions can be very helpful for accessibility.",
    },
  ],
  es: [
    { start: 0, end: 5, text: "¡Bienvenido a nuestro video!" },
    {
      start: 5,
      end: 10,
      text: "Este es un subtítulo de ejemplo en español.",
    },
    {
      start: 10,
      end: 15,
      text: "Los subtítulos pueden ser muy útiles para la accesibilidad.",
    },
  ],
};

export default function VideoPlayer({
  videoId,
  initialToken,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null); // Hidden video for preview
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [token, setToken] = useState(initialToken);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState("720p");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const [isLooping, setIsLooping] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [streamUrls, setStreamUrls] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(0);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [selectedCaptionLanguage, setSelectedCaptionLanguage] = useState<
    keyof typeof sampleCaptions | null
  >(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showCaptionsMenu, setShowCaptionsMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showPlaybackSpeedMenu, setShowPlaybackSpeedMenu] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const hls = new Hls();
    fetchVideoInfo();

    return () => {
      hls.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, token, quality]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      updateBufferedAmount();
    };
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleProgress = updateBufferedAmount;

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("progress", handleProgress);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("progress", handleProgress);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.loop = isLooping;
  }, [isLooping]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const fetchVideoInfo = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/video/stream/${videoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 401) {
        setIsTokenExpired(true);
        showToastMessage("Session expired. Please log in again.");
        return;
      }
      const data = await response.json();
      setStreamUrls(data.streamUrls);
      setAvailableQualities(Object.keys(data.streamUrls));
      loadVideo(data.streamUrls[quality], currentTime);
      loadPreviewVideo(data.streamUrls[quality]);
    } catch (error) {
      console.error("Error loading video:", error);
      showToastMessage("Error loading video. Please try again.");
    }
  };

  const loadVideo = (url: string, startTime: number) => {
    const video = videoRef.current;
    if (!video) return;

    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.currentTime = startTime;
      video.play().catch((error) => {
        console.error("Error auto-playing video:", error);
      });
    });
  };

  const loadPreviewVideo = (url: string) => {
    const previewVideo = previewVideoRef.current;
    if (!previewVideo) return;

    const hlsPreview = new Hls();
    hlsPreview.loadSource(url);
    hlsPreview.attachMedia(previewVideo);
    hlsPreview.on(Hls.Events.MANIFEST_PARSED, () => {
      // Do nothing
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const refreshToken = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/video/${videoId}/refresh-token`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setIsTokenExpired(false);
        showToastMessage("Token refreshed successfully");
        fetchVideoInfo();
      } else {
        showToastMessage("Failed to refresh token. Please log in again.");
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      showToastMessage("Error refreshing token. Please try again.");
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3400);
    const minutes = Math.floor((time % 3400) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const updateBufferedAmount = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.buffered.length > 0) {
      setBuffered(
        video.buffered.end(video.buffered.length - 1) / video.duration
      );
    }
  };

  const handlePreviewMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    setPreviewPosition(position);
    updatePreview(position);
  };

  const updatePreview = (position: number) => {
    const previewVideo = previewVideoRef.current;
    const preview = previewRef.current;
    if (!previewVideo || !preview) return;

    const previewTime = position * duration;

    const canvasContext = preview.getContext("2d");
    if (!canvasContext) return;

    previewVideo.currentTime = previewTime;

    previewVideo.addEventListener(
      "seeked",
      () => {
        canvasContext.drawImage(
          previewVideo,
          0,
          0,
          preview.width,
          preview.height
        );
      },
      { once: true }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const video = videoRef.current;
    if (!video) return;

    switch (e.key.toLowerCase()) {
      case "k":
      case " ":
        e.preventDefault();
        togglePlay();
        break;
      case "j":
      case "arrowleft":
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 10);
        break;
      case "l":
      case "arrowright":
        e.preventDefault();
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        break;
      case "arrowup":
        e.preventDefault();
        handleVolumeChange([Math.min(1, video.volume + 0.1)]);
        break;
      case "arrowdown":
        e.preventDefault();
        handleVolumeChange([Math.max(0, video.volume - 0.1)]);
        break;
      case "f":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "m":
        e.preventDefault();
        toggleMute();
        break;
      case "c":
        e.preventDefault();
        setShowCaptionsMenu(!showCaptionsMenu);
        break;
      case "s":
        e.preventDefault();
        setShowSettingsMenu(!showSettingsMenu);
        break;
      default:
        break;
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    handleSeek([position * duration]);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto bg-zinc-300"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        setShowControls(false);
        setShowSettingsMenu(false);
        setShowCaptionsMenu(false);
        setShowQualityMenu(false);
        setShowPlaybackSpeedMenu(false);
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        className="w-full h-auto"
        onContextMenu={(e) => e.preventDefault()}
      />
      <video
        ref={previewVideoRef}
        className="hidden"
        muted
        onContextMenu={(e) => e.preventDefault()}
      />
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <RefreshCw className="w-12 h-12 text-white animate-spin" />
        </div>
      )}
      {captions && (
        <div className="absolute bottom-16 left-0 right-0 text-center text-white bg-black bg-opacity-75 py-2 px-4">
          {
            captions.find(
              (cap) => currentTime >= cap.start && currentTime < cap.end
            )?.text
          }
        </div>
      )}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
          <div
            className="relative w-full h-1 bg-zinc-300 rounded-full mb-4 cursor-pointer group"
            onMouseEnter={() => setShowPreview(true)}
            onMouseLeave={() => setShowPreview(false)}
            onMouseMove={handlePreviewMove}
            onClick={handleProgressBarClick}
          >
            <div
              className="absolute top-0 left-0 h-full bg-red-400 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div
              className="absolute top-0 left-0 h-full bg-zinc-400 rounded-full"
              style={{ width: `${buffered * 100}%` }}
            />
            {showPreview && (
              <div
                className="absolute bottom-full mb-2 transform -translate-x-1/2"
                style={{ left: `${previewPosition * 100}%` }}
              >
                <canvas
                  ref={previewRef}
                  width={160}
                  height={90}
                  className="w-40 h-auto rounded-md overflow-hidden border border-zinc-400"
                />
                <div className="text-black text-xs bg-white bg-opacity-75 px-2 py-1 rounded-md text-center mt-1">
                  {formatTime(previewPosition * duration)}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center space-x-4">
              <Button
                className="hover:scale-105 !text-zinc-400 !bg-transparent"
                variant="ghost"
                size="icon"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-zinc-400" />
                ) : (
                  <Play className="h-6 w-6 bg-clip-border text-zinc-400" />
                )}
              </Button>
              <Button
                className="hover:scale-105 !text-zinc-400 !bg-transparent"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(
                      0,
                      videoRef.current.currentTime - 10
                    );
                  }
                }}
              >
                <SkipBack className="h-6 w-6 text-zinc-400" />
              </Button>
              <Button
                className="hover:scale-105 !text-zinc-400 !bg-transparent"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.min(
                      duration,
                      videoRef.current.currentTime + 10
                    );
                  }
                }}
              >
                <SkipForward className="h-6 w-6 text-zinc-400" />
              </Button>
              <div className="flex items-center space-x-2">
                <Button
                  className="hover:scale-105 !text-zinc-400 !bg-transparent"
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-6 w-6 text-zinc-400" />
                  ) : (
                    <Volume2 className="h-6 w-6 text-zinc-400" />
                  )}
                </Button>
                <div className="relative w-24">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-full rounded bg-zinc-400"
                  />
                </div>
              </div>
              <span className="text-zinc-400 text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center space-x-4 relative mt-4 sm:mt-0">
              <Button
                variant="ghost"
                size="icon"
                className="hover:scale-105  !bg-transparent"
                onClick={() => setIsLooping(!isLooping)}
              >
                <Repeat
                  className={`h-6 w-6 ${
                    isLooping ? "text-red-400" : "text-zinc-400"
                  }`}
                />
              </Button>
              <div className="relative">
                <Button
                  className="hover:scale-105 !text-zinc-400 !bg-transparent"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowCaptionsMenu(!showCaptionsMenu);
                    setShowSettingsMenu(false);
                    setShowQualityMenu(false);
                    setShowPlaybackSpeedMenu(false);
                  }}
                >
                  <Captions
                    className={`h-6 w-6 ${
                      captions ? "text-red-400" : "text-zinc-400"
                    }`}
                  />
                </Button>
                {showCaptionsMenu && (
                  <div className="absolute bottom-12 right-0 bg-white text-zinc-900 shadow-lg rounded-md p-2 w-48">
                    <div className="font-semibold mb-2">Subtitles/CC</div>
                    <button
                      className={`w-full text-left px-2 py-1 hover:bg-zinc-200 rounded ${
                        selectedCaptionLanguage === null
                          ? "font-bold"
                          : "font-normal"
                      }`}
                      onClick={() => {
                        setCaptions(null);
                        setSelectedCaptionLanguage(null);
                        setShowCaptionsMenu(false);
                      }}
                    >
                      {selectedCaptionLanguage === null && (
                        <Check className="w-4 h-4 inline-block mr-2" />
                      )}
                      Off
                    </button>
                    {Object.keys(sampleCaptions).map((lang) => (
                      <button
                        key={lang}
                        className={`w-full text-left px-2 py-1 hover:bg-zinc-200 rounded ${
                          selectedCaptionLanguage === lang
                            ? "font-bold"
                            : "font-normal"
                        }`}
                        onClick={() => {
                          setCaptions(
                            sampleCaptions[lang as keyof typeof sampleCaptions]
                          );
                          setSelectedCaptionLanguage(
                            lang as keyof typeof sampleCaptions
                          );
                          setShowCaptionsMenu(false);
                        }}
                      >
                        {selectedCaptionLanguage === lang && (
                          <Check className="w-4 h-4 inline-block mr-2" />
                        )}
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <Button
                  className="hover:scale-105 !text-zinc-400 !bg-transparent"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowSettingsMenu(!showSettingsMenu);
                    setShowCaptionsMenu(false);
                    setShowQualityMenu(false);
                    setShowPlaybackSpeedMenu(false);
                  }}
                >
                  <Settings className="h-6 w-6 text-zinc-400" />
                </Button>
                {showSettingsMenu && (
                  <div className="absolute bottom-12 right-0 bg-white text-zinc-900 shadow-lg rounded-md p-2 w-48">
                    <button
                      className="w-full text-left px-2 py-3 hover:bg-zinc-200 rounded"
                      onClick={() => {
                        setShowPlaybackSpeedMenu(true);
                        setShowSettingsMenu(false);
                      }}
                    >
                      Playback Speed
                    </button>
                    <button
                      className="w-full text-left px-2 py-3 hover:bg-zinc-200 rounded"
                      onClick={() => {
                        setShowQualityMenu(true);
                        setShowSettingsMenu(false);
                      }}
                    >
                      Quality
                    </button>
                    {/* Add more settings options here */}
                  </div>
                )}
                {showPlaybackSpeedMenu && (
                  <div className="absolute bottom-12 right-0 bg-white text-zinc-900 shadow-lg rounded-md p-2 w-48">
                    <div className="font-semibold p-1 text-center my-2">Playback Speed</div>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                      <button
                        key={speed}
                        className={`w-full text-left px-2 py-[0.42rem] hover:bg-zinc-200 rounded ${
                          playbackSpeed === speed ? "font-bold" : "font-normal"
                        }`}
                        onClick={() => {
                          setPlaybackSpeed(speed);
                          setShowPlaybackSpeedMenu(false);
                        }}
                      >
                        {playbackSpeed === speed && (
                          <Check className="w-4 h-4 inline-block mr-2" />
                        )}
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
                {showQualityMenu && (
                  <div className="absolute bottom-12 right-0 bg-white text-zinc-900 shadow-lg rounded-md p-2 w-48">
                    <div className="font-semibold my-2 text-center p-1 ">Select Quality</div>
                    {availableQualities.map((qualityOption) => (
                      <button
                        key={qualityOption}
                        className={`w-full text-left px-2 py-2 hover:bg-zinc-200 rounded ${
                          quality === qualityOption
                            ? "font-bold"
                            : "font-normal"
                        }`}
                        onClick={() => {
                          setQuality(qualityOption);
                          setShowQualityMenu(false);
                        }}
                      >
                        {quality === qualityOption && (
                          <Check className="w-4 h-4 inline-block mr-2" />
                        )}
                        {qualityOption}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                className="hover:scale-105 !text-zinc-400 !bg-transparent"
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-8 w-8 text-zinc-400" />
                ) : (
                  <Maximize className="h-8 w-8 text-zinc-400" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      {showToast && <Toast>{toastMessage}</Toast>}
    </div>
  );
}
