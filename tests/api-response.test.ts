import { ok, badRequest, unauthorized, forbidden, notFound, paginate } from "@/shared/utils/api-response";

describe("api-response", () => {
  describe("ok", () => {
    it("returns 200 with data", async () => {
      const res = ok({ hello: "world" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ hello: "world" });
    });
  });

  describe("badRequest", () => {
    it("returns 400 with error", async () => {
      const res = badRequest("Invalid");
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Invalid");
    });
  });

  describe("unauthorized", () => {
    it("returns 401", () => {
      expect(unauthorized().status).toBe(401);
    });
  });

  describe("forbidden", () => {
    it("returns 403", () => {
      expect(forbidden().status).toBe(403);
    });
  });

  describe("notFound", () => {
    it("returns 404", () => {
      expect(notFound().status).toBe(404);
    });
  });

  describe("paginate", () => {
    it("calculates pagination metadata correctly", () => {
      const result = paginate([1, 2, 3], 25, 2, 10);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it("has no prev on page 1", () => {
      const result = paginate([], 30, 1, 10);
      expect(result.pagination.hasPrev).toBe(false);
      expect(result.pagination.hasNext).toBe(true);
    });

    it("has no next on last page", () => {
      const result = paginate([], 30, 3, 10);
      expect(result.pagination.hasNext).toBe(false);
    });
  });
});
