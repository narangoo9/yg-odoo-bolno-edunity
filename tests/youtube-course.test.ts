import {
  getTimestampLines,
  parseTimestampSections,
  parseTimeToSeconds,
} from "@/lib/youtube-course";

describe("YouTube course timestamp parsing", () => {
  it("parses every timestamp chapter from the full description", () => {
    const input = [
      "00:00 Course Intro",
      "02:15 Planning",
      "05:00 Data loading",
      "08:00 Navigation",
      "10:30 Routing",
      "14:00 Layouts",
      "18:20 Loading UI",
      "21:10 Error pages",
      "25:00 Server actions",
      "30:00 Database setup",
      "35:00 Authentication",
      "40:00 Middleware",
      "45:00 Deployment",
      "50:00 Final project",
    ].join("\n");

    const sections = parseTimestampSections(input, 3600);

    expect(getTimestampLines(input)).toHaveLength(14);
    expect(sections).toHaveLength(14);
    expect(sections[0]).toMatchObject({
      order: 1,
      title: "Course Intro",
      startSeconds: 0,
      endSeconds: 135,
    });
    expect(sections[9]).toMatchObject({
      order: 10,
      title: "Database setup",
      startSeconds: 1800,
      endSeconds: 2100,
    });
    expect(sections[13]).toMatchObject({
      order: 14,
      title: "Final project",
      startSeconds: 3000,
      endSeconds: 3600,
    });
  });

  it("parses 18 chapters without applying a four-section limit", () => {
    const input = Array.from({ length: 18 }, (_, index) => {
      const minute = String(index * 3).padStart(2, "0");
      return `${minute}:00 Chapter ${index + 1}`;
    }).join("\n");

    const sections = parseTimestampSections(input, 3600);

    expect(getTimestampLines(input)).toHaveLength(18);
    expect(sections).toHaveLength(18);
    expect(sections[17]).toMatchObject({
      order: 18,
      title: "Chapter 18",
      startSeconds: 3060,
      endSeconds: 3600,
    });
  });

  it("supports required timestamp formats and removes duplicate starts", () => {
    const input = [
      "00:00 Intro",
      "0:00 Duplicate Intro",
      "00:05 - Dash",
      "00:10 | Pipe",
      "00:15 — Em dash",
      "00:20: Colon",
      "00:25 • Bullet",
      "01:02:30 Advanced Topic",
      "1:02:35 Next Topic",
      "not a timestamp",
    ].join("\n");

    const sections = parseTimestampSections(input);

    expect(getTimestampLines(input)).toHaveLength(9);
    expect(sections.map((section) => section.title)).toEqual([
      "Intro",
      "Dash",
      "Pipe",
      "Em dash",
      "Colon",
      "Bullet",
      "Advanced Topic",
      "Next Topic",
    ]);
    expect(sections.map((section) => section.startSeconds)).toEqual([
      0,
      5,
      10,
      15,
      20,
      25,
      3750,
      3755,
    ]);
  });

  it("converts mm:ss and h:mm:ss timestamps to seconds", () => {
    expect(parseTimeToSeconds("0:00")).toBe(0);
    expect(parseTimeToSeconds("01:02:30")).toBe(3750);
    expect(parseTimeToSeconds("1:02:30")).toBe(3750);
    expect(parseTimeToSeconds("12:99")).toBeNull();
  });
});
