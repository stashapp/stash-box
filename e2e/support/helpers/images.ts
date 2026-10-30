import { expect, type Page } from "@playwright/test";

export async function openImageCategorization(page: Page) {
  await page
    .locator(".ImageLightbox-side")
    .getByRole("button", { name: "Categorization", exact: true })
    .click();
  await expect(page.locator(".ImageLightbox-editor")).toBeVisible();
}
