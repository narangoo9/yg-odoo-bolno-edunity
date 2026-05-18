import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/modules/auth/domain/schemas";

describe("auth schemas", () => {
  describe("loginSchema", () => {
    it("accepts valid input", () => {
      const result = loginSchema.safeParse({ email: "test@example.com", password: "password123" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({ email: "not-email", password: "password" });
      expect(result.success).toBe(false);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    // Public signup is USER only — role field removed from schema
    const validInput = {
      name: "Test User",
      email: "test@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    };

    it("accepts valid input", () => {
      expect(registerSchema.safeParse(validInput).success).toBe(true);
    });

    it("requires password to have uppercase", () => {
      expect(registerSchema.safeParse({
        ...validInput,
        password: "password1",
        confirmPassword: "password1",
      }).success).toBe(false);
    });

    it("requires password to have a number", () => {
      expect(registerSchema.safeParse({
        ...validInput,
        password: "Password",
        confirmPassword: "Password",
      }).success).toBe(false);
    });

    it("requires minimum 8 character password", () => {
      expect(registerSchema.safeParse({
        ...validInput,
        password: "Pass1",
        confirmPassword: "Pass1",
      }).success).toBe(false);
    });

    it("requires passwords to match", () => {
      expect(registerSchema.safeParse({
        ...validInput,
        confirmPassword: "Different1",
      }).success).toBe(false);
    });

    it("registers without a role field (always USER)", () => {
      // role field was removed — public signup is USER only
      const result = registerSchema.parse(validInput);
      expect(result.name).toBe("Test User");
    });
  });

  describe("resetPasswordSchema", () => {
    it("requires matching passwords", () => {
      const result = resetPasswordSchema.safeParse({
        token: "some-token",
        password: "NewPass1",
        confirmPassword: "Different1",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("validates email", () => {
      expect(forgotPasswordSchema.safeParse({ email: "valid@email.com" }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: "bad" }).success).toBe(false);
    });
  });
});

