"use client";

import { useEffect, useId, useRef, useState } from "react";

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
      PlayerState?: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  loadVideoById(input: { videoId: string; startSeconds: number; endSeconds: number }): void;
  getCurrentTime(): number;
  pauseVideo(): void;
  playVideo(): void;
  stopVideo(): void;
  destroy(): void;
}

interface Props {
  videoId: string;
  startSeconds: number;
  endSeconds?: number | null;
  title: string;
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
  const [isReady, setIsReady] = useState(false);
  const [hasPlayer, setHasPlayer] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;

      if (!playerRef.current) {
        playerRef.current = new window.YT.Player(containerId, {
          videoId,
          playerVars: {
            start: startSeconds,
            ...(endSeconds != null ? { end: endSeconds } : {}),
            rel: 0,
            enablejsapi: 1,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              setIsReady(true);
              event.target.loadVideoById({
                videoId,
                startSeconds,
                endSeconds: endSeconds ?? startSeconds + 86400,
              });
            },
            onStateChange: (event) => {
              playingRef.current?.(event.data === 1);
              if (event.data === window.YT?.PlayerState?.ENDED && !hasEndedRef.current) {
                hasEndedRef.current = true;
                endedRef.current?.();
              }
            },
          },
        });
        setHasPlayer(true);
        return;
      }

      setHasPlayer(true);
      setIsReady(true);
      playerRef.current.loadVideoById({
        videoId,
        startSeconds,
        endSeconds: endSeconds ?? startSeconds + 86400,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [containerId, videoId, startSeconds, endSeconds]);

  useEffect(() => {
    if (endSeconds == null) return;

    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      if (typeof player.getCurrentTime !== "function" || typeof player.pauseVideo !== "function") return;
      const currentTime = player.getCurrentTime();
      progressRef.current?.(currentTime);
      if (!hasEndedRef.current && currentTime >= endSeconds) {
        hasEndedRef.current = true;
        player.pauseVideo();
        endedRef.current?.();
      }
    }, 750);

    return () => window.clearInterval(interval);
  }, [endSeconds, videoId, startSeconds]);

  useEffect(() => {
    if (endSeconds != null) return;

    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;
      progressRef.current?.(player.getCurrentTime());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [endSeconds, videoId, startSeconds]);

  useEffect(() => {
    const player = playerRef.current;
    return () => {
      player?.destroy();
      playerRef.current = null;
    };
  }, []);

  return (
    <div
      className="overflow-hidden rounded-2xl bg-black shadow-[0_8px_40px_rgba(124,58,237,0.15)]"
      data-testid="youtube-section-player"
      data-youtube-id={videoId}
      data-start-seconds={startSeconds}
      data-end-seconds={endSeconds ?? ""}
    >
      <div className="aspect-video">
        <div id={containerId} title={title} className="h-full w-full" />
        {!hasPlayer && !isReady ? (
          <iframe
            className="h-full w-full"
            title={title}
            src={`https://www.youtube.com/embed/${videoId}?start=${startSeconds}${endSeconds != null ? `&end=${endSeconds}` : ""}&rel=0&enablejsapi=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : null}
      </div>
    </div>
  );
}
