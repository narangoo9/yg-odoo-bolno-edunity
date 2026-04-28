import { formatCurrency, formatDuration, getInitials, truncate } from "@/lib/utils";
import { slugify } from "@/shared/utils/slug";

describe("lib/utils", () => {
  describe("formatCurrency", () => {
    it("formats MNT with no decimals", () => {
      const result = formatCurrency(50000, "MNT");
      expect(result).toContain("50,000");
    });

    it("handles zero", () => {
      const result = formatCurrency(0, "MNT");
      expect(result).toContain("0");
    });
  });

  describe("formatDuration", () => {
    it("formats hours and minutes", () => {
      expect(formatDuration(3700)).toBe("1ц 1м");
    });
    it("formats minutes and seconds", () => {
      expect(formatDuration(125)).toBe("2м 5с");
    });
    it("formats seconds only", () => {
      expect(formatDuration(45)).toBe("45с");
    });
  });

  describe("getInitials", () => {
    it("returns first letters of first two words", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });
    it("handles single name", () => {
      expect(getInitials("Madonna")).toBe("M");
    });
    it("handles 3+ words", () => {
      expect(getInitials("John Edgar Doe")).toBe("JE");
    });
  });

  describe("truncate", () => {
    it("returns full string if shorter", () => {
      expect(truncate("Hello", 10)).toBe("Hello");
    });
    it("truncates and adds ellipsis", () => {
      expect(truncate("Hello world this is long", 10)).toBe("Hello worl…");
    });
  });
});

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special chars", () => {
    expect(slugify("Next.js 15 Course!")).toBe("next-js-15-course");
  });

  it("handles multiple spaces", () => {
    expect(slugify("hello    world")).toBe("hello-world");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("--hello world--")).toBe("hello-world");
  });
});
