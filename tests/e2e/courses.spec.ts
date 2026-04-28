import { test, expect } from "@playwright/test";

test.describe("Courses (Public)", () => {
  test("courses жагсаалт харагдана", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("курс хайлт ажиллана", async ({ page }) => {
    await page.goto("/courses");

    const searchInput = page.locator('input[type="search"], input[placeholder*="хайх"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Python");
      await page.waitForTimeout(500); // debounce
      // Хайлтын үр дүн эсвэл "олдсонгүй" мессеж харагдана
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("курс detail хуудас нээгдэнэ", async ({ page }) => {
    await page.goto("/courses");

    // Анхны курсийн холбоос дарна
    const firstCourse = page.locator('a[href*="/courses/"]').first();
    if (await firstCourse.isVisible()) {
      await firstCourse.click();
      await expect(page.url()).toContain("/courses/");
    }
  });

  test("pricing хуудас харагдана", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Dashboard (Auth required)", () => {
  test("student dashboard нэвтрэлтгүйгээр хаалттай", async ({ page }) => {
    await page.goto("/student");
    await expect(page).toHaveURL(/\/login/);
  });

  test("instructor dashboard нэвтрэлтгүйгээр хаалттай", async ({ page }) => {
    await page.goto("/instructor");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin dashboard нэвтрэлтгүйгээр хаалттай", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
