import { test, expect } from "@playwright/test";

const TEST_EMAIL = `test-${Date.now()}@elearn-e2e.mn`;
const TEST_PASSWORD = "TestPass123!";
const TEST_NAME = "E2E Test User";

test.describe("Authentication", () => {
  test("нүүр хуудас ачааллана", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ELearn/);
  });

  test("бүртгэлгүй хэрэглэгч dashboard руу орвол login хуудас руу чиглүүлнэ", async ({ page }) => {
    await page.goto("/student");
    await expect(page).toHaveURL(/\/login/);
  });

  test("бүртгүүлэх форм ажиллана", async ({ page }) => {
    await page.goto("/register");

    await page.fill('input[name="name"]', TEST_NAME);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('button[type="submit"]');

    // Амжилттай бол verify email мессеж харагдана
    await expect(page.locator("text=Имэйлээ шалгана уу")).toBeVisible({ timeout: 10_000 });
  });

  test("буруу credential-аар нэвтрэхэд алдаа гарна", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "wrong@email.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator("[role='alert'], .text-red, .text-destructive").first())
      .toBeVisible({ timeout: 5_000 });
  });

  test("нууц үг мартсан форм ажиллана", async ({ page }) => {
    await page.goto("/forgot-password");

    await page.fill('input[name="email"]', "any@email.com");
    await page.click('button[type="submit"]');

    // Хэрэглэгч байгаа эсэхийг илчлэхгүй — үргэлж success харуулна
    await expect(page.locator("text=/имэйл|email/i")).toBeVisible({ timeout: 5_000 });
  });
});
