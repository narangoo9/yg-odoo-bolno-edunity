import { hasRole, canManageCourse, isAdminOrAbove, isSuperAdmin } from "@/shared/utils/permissions";

describe("permissions", () => {
  describe("hasRole", () => {
    it("SUPER_ADMIN has all roles", () => {
      expect(hasRole("SUPER_ADMIN", "USER")).toBe(true);
      expect(hasRole("SUPER_ADMIN", "COMPANY")).toBe(true);
      expect(hasRole("SUPER_ADMIN", "SUPER_ADMIN")).toBe(true);
    });

    it("USER does not have elevated roles", () => {
      expect(hasRole("USER", "USER")).toBe(true);
      expect(hasRole("USER", "COMPANY")).toBe(false);
      expect(hasRole("USER", "SUPER_ADMIN")).toBe(false);
    });

    it("COMPANY has user and company permissions", () => {
      expect(hasRole("COMPANY", "USER")).toBe(true);
      expect(hasRole("COMPANY", "COMPANY")).toBe(true);
      expect(hasRole("COMPANY", "SUPER_ADMIN")).toBe(false);
    });
  });

  describe("isAdminOrAbove", () => {
    it("returns true for COMPANY and SUPER_ADMIN", () => {
      expect(isAdminOrAbove("COMPANY")).toBe(true);
      expect(isAdminOrAbove("SUPER_ADMIN")).toBe(true);
    });
    it("returns false for USER", () => {
      expect(isAdminOrAbove("USER")).toBe(false);
    });
  });

  describe("canManageCourse", () => {
    it("super admin can manage any course", () => {
      expect(canManageCourse("SUPER_ADMIN", "user-1", "instructor-2")).toBe(true);
    });

    it("company user can manage own course", () => {
      expect(canManageCourse("COMPANY", "user-1", "user-1")).toBe(true);
    });

    it("company user cannot manage another company's course", () => {
      expect(canManageCourse("COMPANY", "user-1", "user-2")).toBe(false);
    });

    it("company user can manage courses in their org", () => {
      expect(canManageCourse("COMPANY", "user-1", "instructor-2", "org-1", "org-1")).toBe(true);
    });

    it("company user cannot manage courses in different org", () => {
      expect(canManageCourse("COMPANY", "user-1", "instructor-2", "org-1", "org-2")).toBe(false);
    });

    it("user cannot manage any course", () => {
      expect(canManageCourse("USER", "user-1", "user-1")).toBe(false);
    });
  });
});
