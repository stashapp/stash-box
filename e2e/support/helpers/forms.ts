import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Fill and submit one of the multi-tab entity forms (studio, performer, scene).
 * Returns the new edit's id, parsed from the URL the app redirects to after
 * submission.
 *
 * Not all forms expose `placeholder="Name"` (performer's doesn't), so we
 * target the underlying `name="name"` input — that's stable across all
 * react-hook-form `register("name")` calls.
 */
export async function submitMultiTabEntityForm(
  page: Page,
  opts: { name: string; note?: string },
): Promise<string> {
  // The form initialises asynchronously and can briefly mount + remount as
  // react-hook-form's defaults resolve; filling too early can be overwritten
  // by the form's reset. Waiting for the network to settle is enough to
  // dodge this race.
  await page.waitForLoadState("networkidle");
  await page.locator('input[name="name"]').first().fill(opts.name);
  await page.getByRole("tab", { name: "Confirm" }).click();
  await page
    .locator('textarea[name="note"]')
    .fill(opts.note ?? "e2e test edit");
  await page.getByRole("button", { name: "Submit Edit" }).click();
  await page.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  return extractEditId(page.url());
}

/**
 * Pick an option from a react-select widget. Pass a `scope` locator narrowed
 * to a single .react-select__control (e.g. by Form.Group containing a known
 * label) so we don't accidentally drive the wrong widget on a page that has
 * several.
 *
 * Prefer {@link pickFromSelect} for new tests — it uses the widget's
 * accessible label via the react-select `inputId` prop, which is far more
 * stable than class-name scoping.
 */
export async function pickReactSelectOption(
  page: Page,
  scope: Locator,
  query: string,
) {
  await scope.click();
  await page.keyboard.type(query);
  const option = page.locator(".react-select__option").first();
  await option.waitFor({ state: "visible", timeout: 10_000 });
  await option.click();
}

/**
 * Pick an option from a react-select widget by its surrounding form label.
 * Requires the widget to have `inputId` set and a `<Form.Label htmlFor=...>`
 * pointing at it. This is the recommended pattern — instead of scoping by
 * class names + child react-select internals, we target the accessible
 * input element directly. Works because:
 *   - getByLabel() resolves to the hidden <input> react-select renders
 *   - typing into that input opens the menu and filters options
 *   - modern react-select sets role="option" on each menu item, so
 *     getByRole('option', { name }) is unambiguous
 */
export async function pickFromSelect(
  page: Page,
  label: string,
  query: string,
  optionName: string | RegExp = query,
) {
  const input = page.getByLabel(label, { exact: true });
  await input.click();
  await input.fill(query);
  const option = page.getByRole("option", { name: optionName }).first();
  await option.waitFor({ state: "visible", timeout: 10_000 });
  await option.click();
}

/** Tag form is single-page (no tabs) but has the same Submit Edit pattern. */
export async function submitTagForm(
  page: Page,
  opts: { name: string; note?: string },
): Promise<string> {
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Name").first().fill(opts.name);
  await page
    .locator('textarea[name="note"]')
    .fill(opts.note ?? "e2e test edit");
  await page.getByRole("button", { name: "Submit Edit" }).click();
  await page.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  return extractEditId(page.url());
}

export function extractEditId(url: string): string {
  const m = url.match(/\/edits\/([0-9a-f-]+)/i);
  if (!m) throw new Error(`no edit id in url ${url}`);
  return m[1];
}

/** Visit an entity's detail page and assert its name is rendered. */
export async function expectEntityVisible(
  page: Page,
  path: string,
  name: string,
) {
  await page.goto(path);
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
}
