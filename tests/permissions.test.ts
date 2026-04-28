import { hasRole, canManageCourse, isAdminOrAbove, isSuperAdmin } from "@/shared/utils/permissions";

describe("permissions", () => {
  describe("hasRole", () => {
    it("SUPER_ADMIN has all roles", () => {
      expect(hasRole("SUPER_ADMIN", "STUDENT")).toBe(true);
      expect(hasRole("SUPER_ADMIN", "INSTRUCTOR")).toBe(true);
      expect(hasRole("SUPER_ADMIN", "ORG_ADMIN")).toBe(true);
      expect(hasRole("SUPER_ADMIN", "SUPER_ADMIN")).toBe(true);
    });

    it("STUDENT does not have elevated roles", () => {
      expect(hasRole("STUDENT", "STUDENT")).toBe(true);
      expect(hasRole("STUDENT", "INSTRUCTOR")).toBe(false);
      expect(hasRole("STUDENT", "ORG_ADMIN")).toBe(false);
      expect(hasRole("STUDENT", "SUPER_ADMIN")).toBe(false);
    });

    it("INSTRUCTOR has student role but not admin", () => {
      expect(hasRole("INSTRUCTOR", "STUDENT")).toBe(true);
      expect(hasRole("INSTRUCTOR", "INSTRUCTOR")).toBe(true);
      expect(hasRole("INSTRUCTOR", "ORG_ADMIN")).toBe(false);
    });
  });

  describe("isAdminOrAbove", () => {
    it("returns true for ORG_ADMIN and SUPER_ADMIN", () => {
      expect(isAdminOrAbove("ORG_ADMIN")).toBe(true);
      expect(isAdminOrAbove("SUPER_ADMIN")).toBe(true);
    });
    it("returns false for STUDENT and INSTRUCTOR", () => {
      expect(isAdminOrAbove("STUDENT")).toBe(false);
      expect(isAdminOrAbove("INSTRUCTOR")).toBe(false);
    });
  });

  describe("canManageCourse", () => {
    it("super admin can manage any course", () => {
      expect(canManageCourse("SUPER_ADMIN", "user-1", "instructor-2")).toBe(true);
    });

    it("instructor can manage own course", () => {
      expect(canManageCourse("INSTRUCTOR", "user-1", "user-1")).toBe(true);
    });

    it("instructor cannot manage other's course", () => {
      expect(canManageCourse("INSTRUCTOR", "user-1", "user-2")).toBe(false);
    });

    it("org admin can manage courses in their org", () => {
      expect(canManageCourse("ORG_ADMIN", "user-1", "instructor-2", "org-1", "org-1")).toBe(true);
    });

    it("org admin cannot manage courses in different org", () => {
      expect(canManageCourse("ORG_ADMIN", "user-1", "instructor-2", "org-1", "org-2")).toBe(false);
    });

    it("student cannot manage any course", () => {
      expect(canManageCourse("STUDENT", "user-1", "user-1")).toBe(false);
    });
  });
});
