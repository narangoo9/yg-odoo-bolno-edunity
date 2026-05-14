"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import {
  createCourseFromYouTube,
  previewYouTubeCourseImport,
} from "@/modules/courses/application/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/index";
import { toast } from "@/components/ui/toaster";
import {
  extractYouTubeVideoId,
  formatSeconds,
  getYouTubeThumbnailUrls,
  parseTimeToSeconds,
  type ParsedCourseSection,
} from "@/lib/youtube-course";

interface EditableSection {
  id: string;
  title: string;
  start: string;
  end: string;
}

function toEditable(section: ParsedCourseSection): EditableSection {
  return {
    id: `${section.order}-${section.startSeconds}`,
    title: section.title,
    start: formatSeconds(section.startSeconds),
    end: formatSeconds(section.endSeconds),
  };
}

function toSeconds(value: string, allowEmpty = false) {
  const trimmed = value.trim();
  if (allowEmpty && !trimmed) return null;
  return parseTimeToSeconds(trimmed);
}

export function CreateYouTubeCourseForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [timestampText, setTimestampText] = useState("");
  const [duration, setDuration] = useState("");
  const [videoId, setVideoId] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [sections, setSections] = useState<EditableSection[]>([]);
  const [message, setMessage] = useState("");

  const previewVideoId = useMemo(() => extractYouTubeVideoId(youtubeUrl), [youtubeUrl]);

  const updateSection = (id: string, patch: Partial<EditableSection>) => {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    );
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSections((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addSection = () => {
    setSections((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: `Section ${current.length + 1}`,
        start: current.at(-1)?.end || current.at(-1)?.start || "0:00",
        end: "",
      },
    ]);
  };

  const handlePreview = () => {
    const id = extractYouTubeVideoId(youtubeUrl);
    if (!id) {
      setMessage("Invalid YouTube URL.");
      return;
    }

    setVideoId(id);
    setCoverImage(getYouTubeThumbnailUrls(id).maxres);
    setMessage("");

    startTransition(async () => {
      const result = await previewYouTubeCourseImport({
        youtubeUrl,
        descriptionText: timestampText,
        durationSeconds: duration ? Number(duration) : null,
      });

      if ("error" in result) {
        setMessage(result.error ?? "Could not preview YouTube course.");
        return;
      }

      setVideoId(result.data.sourceYoutubeId);
      setCoverImage(result.data.coverImage);
      setTitle(result.data.title || title);
      if (result.data.description && !timestampText) setTimestampText(result.data.description);
      if (result.data.durationSeconds && !duration) setDuration(String(result.data.durationSeconds));

      if (result.data.sections.length === 0) {
        setSections([]);
        setMessage(
          result.data.descriptionFetchError ??
            "No timestamp sections found. Please paste timestamps manually or add sections manually.",
        );
        return;
      }

      setSections(result.data.sections.map(toEditable));
      setMessage(`${result.data.sections.length} timestamp sections detected`);
    });
  };

  const buildPayload = () => {
    const id = videoId || extractYouTubeVideoId(youtubeUrl);
    if (!id) return { error: "Invalid YouTube URL" as const };
    if (!title.trim()) return { error: "Course title is required" as const };
    if (sections.length === 0) return { error: "At least one section is required" as const };

    const parsed = sections.map((section, index) => {
      const startSeconds = toSeconds(section.start);
      const endSeconds = toSeconds(section.end, true);
      return {
        title: section.title.trim(),
        order: index + 1,
        startSeconds,
        endSeconds,
      };
    });

    for (const section of parsed) {
      if (!section.title) return { error: "Every section needs a title" as const };
      if (section.startSeconds == null) return { error: "Invalid section start time" as const };
      if (section.endSeconds != null && section.endSeconds <= section.startSeconds) {
        return { error: "Section end time must be greater than start time" as const };
      }
    }

    const starts = parsed.map((section) => section.startSeconds as number);
    if (new Set(starts).size !== starts.length) return { error: "Duplicate section start time" as const };
    if (starts.some((start, index) => index > 0 && start < starts[index - 1])) {
      return { error: "Sections must be sorted by start time" as const };
    }

    return {
      data: {
        sourceYoutubeUrl: youtubeUrl,
        sourceYoutubeId: id,
        title: title.trim(),
        coverImage: coverImage || getYouTubeThumbnailUrls(id).maxres,
        durationSeconds: duration ? Number(duration) : null,
        sections: parsed.map((section, index) => ({
          title: section.title,
          order: index + 1,
          startSeconds: section.startSeconds as number,
          endSeconds: section.endSeconds,
        })),
      },
    };
  };

  const handleSave = () => {
    const payload = buildPayload();
    if ("error" in payload) {
      toast({ type: "error", title: payload.error ?? "Invalid course data" });
      return;
    }

    startTransition(async () => {
      setMessage(`Saving ${payload.data.sections.length} sections`);
      const result = await createCourseFromYouTube(payload.data);
      if ("error" in result) {
        toast({ type: "error", title: "Could not save course" });
        return;
      }

      toast({ type: "success", title: "Draft course saved" });
      router.push(`/instructor/courses/${result.data.id}`);
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="youtubeUrl">YouTube URL</Label>
            <Input
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
            />
            {previewVideoId ? (
              <p className="text-xs text-muted-foreground">Detected video ID: {previewVideoId}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timestampText">YouTube description / timestamps</Label>
            <Textarea
              id="timestampText"
              rows={7}
              value={timestampText}
              onChange={(event) => setTimestampText(event.target.value)}
              placeholder={"00:00 Intro\n02:15 Variables\n05:40 Functions"}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration seconds (optional)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={handlePreview} disabled={isPending} className="w-full">
                {isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Preview Sections
              </Button>
            </div>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {message}
        </div>
      ) : null}

      {(videoId || title || sections.length > 0) ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
            <img
              src={coverImage || (videoId ? getYouTubeThumbnailUrls(videoId).fallback : "")}
              alt=""
              className="aspect-video w-full rounded-md border border-border object-cover"
              onError={(event) => {
                if (videoId) event.currentTarget.src = getYouTubeThumbnailUrls(videoId).fallback;
              }}
            />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="courseTitle">Course title</Label>
                <Input
                  id="courseTitle"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter course title"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                One course will be created from video ID <span className="font-mono">{videoId}</span>.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Sections</h2>
            <p className="text-xs text-muted-foreground">
              {sections.length > 0
                ? `${sections.length} timestamp sections detected. Edit timestamp ranges before saving.`
                : "No timestamp sections found. Please paste timestamps manually or add sections manually."}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSection}>
            <Plus size={14} className="mr-1" /> Add Section
          </Button>
        </div>

        <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {sections.map((section, index) => (
            <div key={section.id} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1fr_100px_100px_auto]">
              <Input
                value={section.title}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
                placeholder="Section title"
              />
              <Input
                value={section.start}
                onChange={(event) => updateSection(section.id, { start: event.target.value })}
                placeholder="0:00"
              />
              <Input
                value={section.end}
                onChange={(event) => updateSection(section.id, { end: event.target.value })}
                placeholder="optional"
              />
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="icon" onClick={() => moveSection(index, -1)}>
                  <ArrowUp size={14} />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => moveSection(index, 1)}>
                  <ArrowDown size={14} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setSections((current) => current.filter((item) => item.id !== section.id))}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button type="button" size="lg" disabled={isPending} onClick={handleSave} className="w-full">
        {isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
        {sections.length > 0 ? `Save Draft (${sections.length} sections)` : "Save Draft"}
      </Button>
    </div>
  );
}
