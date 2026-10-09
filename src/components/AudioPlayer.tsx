import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
} from "lucide-react";
import { formatSeconds, downloadAudio } from "../utils/audioUtils";

interface AudioPlayerProps {
  audioUrl: string | null;
  title: string;
  subtitle?: string;
  totalDurationSec?: number;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  title,
  subtitle,
  totalDurationSec,
  onEnded,
  onTimeUpdate,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(totalDurationSec || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    if (audioRef.current) {
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }
  }, [audioUrl]);

  useEffect(() => {
    if (totalDurationSec && totalDurationSec > 0) {
      setDuration(totalDurationSec);
    }
  }, [totalDurationSec]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Playback failed:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curr = audioRef.current.currentTime;
      setCurrentTime(curr);
      if (onTimeUpdate) onTimeUpdate(curr);
      if (!totalDurationSec && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const skipSeconds = (offset: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + offset)
      );
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) setIsMuted(true);
      else setIsMuted(false);
    }
  };

  if (!audioUrl) return null;

  const effectiveDuration = duration > 0 ? duration : 0.01;
  const progressPercent = Math.min(100, (currentTime / effectiveDuration) * 100);

  return (
    <div className="bg-slate-900 border-t border-amber-500/30 text-white shadow-2xl p-4 sm:p-5 sticky bottom-0 z-50 backdrop-blur-xl bg-slate-900/95 transition-all">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
      />

      <div className="max-w-6xl mx-auto flex flex-col gap-3">
        {/* Top bar: Title + Waveform simulation + Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm sm:text-base text-amber-200 truncate flex items-center gap-2">
                {title}
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  24kHz WAV
                </span>
              </h4>
              {subtitle && (
                <p className="text-xs text-slate-400 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Animated Frequency Bars when playing */}
          <div className="hidden md:flex items-center gap-1 h-6 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
            {[18, 32, 22, 40, 26, 38, 14, 28, 36, 20].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-gradient-to-t from-amber-500 to-orange-400 rounded-full transition-all duration-150"
                style={{
                  height: isPlaying ? `${Math.max(6, (h * (Math.sin(currentTime * 8 + i) + 1.2)) / 2)}px` : "6px",
                  opacity: isPlaying ? 0.9 : 0.3,
                }}
              />
            ))}
            <span className="text-[11px] font-mono text-slate-400 ml-2">
              Gemini 3.8 TTS
            </span>
          </div>

          {/* Download master button */}
          <button
            onClick={() => downloadAudio(audioUrl, `${title.replace(/\s+/g, "_")}.wav`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all shrink-0 active:scale-95"
            title="Download Master WAV (24kHz 16-bit)"
          >
            <Download className="w-4 h-4" />
            <span>डाउनलोड WAV</span>
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-12 text-right">
            {formatSeconds(currentTime)}
          </span>
          <div className="relative flex-1 group py-1">
            <input
              type="range"
              min={0}
              max={effectiveDuration}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-800 group-hover:h-2.5 rounded-lg appearance-none cursor-pointer accent-amber-500 transition-all"
            />
            <div
              className="absolute left-0 top-1 bottom-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg pointer-events-none transition-all"
              style={{ width: `${progressPercent}%`, height: "8px", top: "4px" }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 w-12">
            {formatSeconds(duration)}
          </span>
        </div>

        {/* Playback Controls & Speed */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => skipSeconds(-10)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="10 सेकंड पीछे (Skip -10s)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform active:scale-90"
              title={isPlaying ? "रोकें (Pause)" : "चलाएं (Play)"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => skipSeconds(10)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="10 सेकंड आगे (Skip +10s)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Presets */}
          <div className="flex items-center gap-1 bg-slate-800/90 rounded-lg p-1 border border-slate-700/60">
            <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all ${
                  playbackRate === rate
                    ? "bg-amber-500 text-slate-950 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
