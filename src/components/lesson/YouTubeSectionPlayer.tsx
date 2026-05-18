"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YouTubePlayer }) => void;
            onStateChange?: (event: { data: number; target: YouTubePlayer }) => void;
          };
        },
      ) => YouTubePlayer;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  loadVideoById(input: { videoId: string; startSeconds: number; endSeconds: number }): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  pauseVideo(): void;
  playVideo(): void;
  stopVideo(): void;
  destroy(): void;
}

interface Props {
  videoId: string;
  startSeconds: number;
  endSeconds: number;
  title: string;
  theater?: boolean;
  onEnded?: () => void;
  onProgress?: (seconds: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
}

let apiReadyPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiReadyPromise) return apiReadyPromise;

  apiReadyPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return apiReadyPromise;
}

export function YouTubeSectionPlayer({
  videoId,
  startSeconds,
  endSeconds,
  title,
  theater = false,
  onEnded,
  onProgress,
  onPlayingChange,
}: Props) {
  const reactId = useId();
  const containerId = `yt-section-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const playerRef = useRef<YouTubePlayer | null>(null);
  const endedRef = useRef(onEnded);
  const progressRef = useRef(onProgress);
  const playingRef = useRef(onPlayingChange);
  const hasEndedRef = useRef(false);
  const boundsRef = useRef({ start: startSeconds, end: endSeconds });
  const [isReady, setIsReady] = useState(false);
  const [hasPlayer, setHasPlayer] = useState(false);

  boundsRef.current = { start: startSeconds, end: endSeconds };

  useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    progressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    playingRef.current = onPlayingChange;
  }, [onPlayingChange]);

  useEffect(() => {
    hasEndedRef.current = false;
  }, [videoId, startSeconds, endSeconds]);

  const finishSection = (player?: YouTubePlayer | null) => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    try {
      player?.pauseVideo();
    } catch {
      // Player may already be destroyed during navigation
    }
    endedRef.current?.();
  };

  const enforceBounds = (player: YouTubePlayer) => {
    if (typeof player.getCurrentTime !== "function") return;
    const { start, end } = boundsRef.current;
    const time = player.getCurrentTime();

    if (time < start - 0.5) {
      player.seekTo(start, true);
      return;
    }

    progressRef.current?.(time);

    if (time >= end - 0.25) {
      finishSection(player);
    }
  };

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;

      const loadSegment = (player: YouTubePlayer) => {
        player.loadVideoById({
          videoId,
          startSeconds,
          endSeconds,
        });
      };

      if (!playerRef.current) {
        playerRef.current = new window.YT.Player(containerId, {
          videoId,
          playerVars: {
            start: startSeconds,
            end: endSeconds,
            rel: 0,
            enablejsapi: 1,
            modestbranding: 1,
            playsinline: 1,
            ...(typeof window !== "undefined" ? { origin: window.location.origin } : {}),
          },
          events: {
            onReady: (event) => {
              setIsReady(true);
              loadSegment(event.target);
            },
            onStateChange: (event) => {
              const playing = event.data === window.YT?.PlayerState?.PLAYING;
              playingRef.current?.(playing);
              if (event.data === window.YT?.PlayerState?.ENDED) {
                finishSection(event.target);
                return;
              }
              if (playing) {
                enforceBounds(event.target);
              }
            },
          },
        });
        setHasPlayer(true);
        return;
      }

      setHasPlayer(true);
      setIsReady(true);
      hasEndedRef.current = false;
      loadSegment(playerRef.current);
    });

    return () => {
      cancelled = true;
    };
  }, [containerId, videoId, startSeconds, endSeconds]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || hasEndedRef.current) return;
      enforceBounds(player);
    }, 500);

    return () => window.clearInterval(interval);
  }, [videoId, startSeconds, endSeconds]);

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, []);

  return (
    <div
      className={cn("h-full w-full overflow-hidden bg-black", !theater && "rounded-2xl shadow-[0_8px_40px_rgba(124,58,237,0.15)]")}
      data-testid="youtube-section-player"
      data-youtube-id={videoId}
      data-start-seconds={startSeconds}
      data-end-seconds={endSeconds}
    >
      <div className={cn("relative w-full", theater ? "h-full min-h-[inherit]" : "aspect-video")}>
        <div id={containerId} title={title} className="absolute inset-0 h-full w-full" />
        {!hasPlayer && !isReady ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            title={title}
            src={`https://www.youtube.com/embed/${videoId}?start=${startSeconds}&end=${endSeconds}&rel=0&enablejsapi=1&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : null}
      </div>
    </div>
  );
}
