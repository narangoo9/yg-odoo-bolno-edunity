"use client";

import { create } from "zustand";

interface PersistentVideoState {
  courseId: string | null;
  lessonUrl: string | null;
  lessonTitle: string;
  sectionTitle: string;
  videoId: string | null;
  timestamp: number;
  isPlaying: boolean;
  minimized: boolean;
  setVideo: (input: {
    courseId: string;
    lessonUrl: string;
    lessonTitle: string;
    sectionTitle: string;
    videoId: string;
    timestamp: number;
    isPlaying?: boolean;
  }) => void;
  updateTimestamp: (timestamp: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  clear: () => void;
}

export const usePersistentVideoStore = create<PersistentVideoState>((set) => ({
  courseId: null,
  lessonUrl: null,
  lessonTitle: "",
  sectionTitle: "",
  videoId: null,
  timestamp: 0,
  isPlaying: false,
  minimized: false,
  setVideo: (input) =>
    set({
      courseId: input.courseId,
      lessonUrl: input.lessonUrl,
      lessonTitle: input.lessonTitle,
      sectionTitle: input.sectionTitle,
      videoId: input.videoId,
      timestamp: input.timestamp,
      isPlaying: input.isPlaying ?? true,
      minimized: false,
    }),
  updateTimestamp: (timestamp) => set({ timestamp }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setMinimized: (minimized) => set({ minimized }),
  clear: () =>
    set({
      courseId: null,
      lessonUrl: null,
      lessonTitle: "",
      sectionTitle: "",
      videoId: null,
      timestamp: 0,
      isPlaying: false,
      minimized: false,
    }),
}));
