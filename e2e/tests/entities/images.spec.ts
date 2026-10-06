import type { Page } from "@playwright/test";
import { test, expect } from "../../support/fixtures";
import {
  adminApi,
  createPerformer,
  createStudio,
  gql,
  uniq,
} from "../../support/helpers/seed";
import { graphqlAs } from "../../support/helpers/graphql";
import { approveEdit } from "../../support/helpers/workflow";
import {
  tinyJpegPath,
  uniqueTinyJpegPath,
} from "../../support/fixtures/tiny-jpeg";
import {
  squarePngPath,
  SQUARE_PNG_SIZE,
} from "../../support/fixtures/square-png";

test("studio image upload via UI: edit lands with the uploaded image attached", async ({
  editPage,
  moderatePage,
}) => {
  const admin = await adminApi();
  const original = await createStudio(admin, { name: uniq("ImgStudio") });
  await admin.dispose();

  await editPage.goto(`/studios/${original.id}/edit`);
  await editPage.waitForLoadState("networkidle");
  await editPage.getByRole("tab", { name: "Images" }).click();

  // EditImages: file picker → "Upload" button → imageCreate mutation. Each
  // step is explicit; setInputFiles alone does not fire the upload
  const fileInput = editPage.locator('input[type="file"]').first();
  await fileInput.setInputFiles(tinyJpegPath());

  // Studio images have no crop templates or labels, so the staged file is
  // a plain preview: none of the performer editor's crop stage leaks in
  await expect(editPage.locator(".CropStep-preview img")).toBeVisible();
  await expect(editPage.locator(".CropFrame")).toHaveCount(0);
  await expect(editPage.getByRole("button", { name: "Zoom in" })).toHaveCount(
    0,
  );
  await expect(editPage.getByRole("radio")).toHaveCount(0);

  await editPage.getByRole("button", { name: "Upload" }).click();

  // The Upload button unmounts once the mutation lands and the staged file
  // clears, so it going away is the signal the upload finished
  await expect(editPage.getByRole("button", { name: "Upload" })).toHaveCount(
    0,
    {
      timeout: 15_000,
    },
  );

  // Submit the edit from the Confirm tab
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("attach image via e2e");
  await expect(
    editPage.getByRole("button", { name: "Submit Edit" }),
  ).toBeEnabled({ timeout: 15_000 });
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  await approveEdit(moderatePage, editId);

  // Studio should now have at least one image with the dimensions libvips
  // returned for our 1x1 JFIF
  const verify = await adminApi();
  const data = await gql<{
    findStudio: {
      images: { id: string; width: number; height: number }[];
    } | null;
  }>(
    verify,
    `query($id: ID!) {
       findStudio(id: $id) { images { id width height } }
     }`,
    { id: original.id },
  );
  await verify.dispose();
  expect(data.findStudio?.images.length).toBeGreaterThan(0);
});

test("imageCreate role gate: EDIT allowed via URL, READ denied", async () => {
  // Drive imageCreate via the `url:` input (the file path would require an
  // apollo-upload multipart request; the role check is the same either way).
  // The URL doesn't need to resolve — we're only after the directive
  // outcome, so we expect EDIT to fail (no fetch / unsupported url) but
  // *not* with "not authorized". READ should hit "not authorized".
  const MUTATION = `mutation($input: ImageCreateInput!) {
    imageCreate(input: $input) { id }
  }`;
  const VARS = { input: { url: "https://example.invalid/nope.jpg" } };

  const editor = await graphqlAs("e2e_edit");
  const editorRes = await editor.post("/graphql", {
    data: { query: MUTATION, variables: VARS },
    headers: { "content-type": "application/json" },
  });
  const editorBody = (await editorRes.json()) as {
    errors?: { message: string }[];
  };
  await editor.dispose();
  // EDIT passes the directive; any error must be about the URL, not auth.
  if (editorBody.errors?.length) {
    expect(editorBody.errors[0].message).not.toMatch(/not authorized/i);
  }

  const reader = await graphqlAs("e2e_read");
  const readerRes = await reader.post("/graphql", {
    data: { query: MUTATION, variables: VARS },
    headers: { "content-type": "application/json" },
  });
  const readerBody = (await readerRes.json()) as {
    errors?: { message: string }[];
  };
  await reader.dispose();
  expect(readerBody.errors?.[0]?.message ?? "").toMatch(/not authorized/i);
});

test("imageDestroy role gate: MODIFY allowed (resolver-level), EDIT denied", async () => {
  // EDIT user is rejected at the directive level. We don't actually delete
  // anything as MODIFY — that would need an existing image id and exercises
  // the same path as upload-then-delete; we just verify the directive lets
  // MODIFY past. Pass a random uuid; the resolver will error, but with a
  // not-found message rather than a denial.
  const MUTATION = `mutation($input: ImageDestroyInput!) {
    imageDestroy(input: $input)
  }`;
  const VARS = {
    input: { id: "00000000-0000-4000-8000-000000000000" },
  };

  const editor = await graphqlAs("e2e_edit");
  const editorRes = await editor.post("/graphql", {
    data: { query: MUTATION, variables: VARS },
    headers: { "content-type": "application/json" },
  });
  const editorBody = (await editorRes.json()) as {
    errors?: { message: string }[];
  };
  await editor.dispose();
  expect(editorBody.errors?.[0]?.message ?? "").toMatch(/not authorized/i);

  const modifier = await graphqlAs("e2e_modify");
  const modifierRes = await modifier.post("/graphql", {
    data: { query: MUTATION, variables: VARS },
    headers: { "content-type": "application/json" },
  });
  const modifierBody = (await modifierRes.json()) as {
    errors?: { message: string }[];
  };
  await modifier.dispose();
  // MODIFY passes the directive; any error here is from the resolver
  // failing to find a real image, not from auth.
  if (modifierBody.errors?.length) {
    expect(modifierBody.errors[0].message).not.toMatch(/not authorized/i);
  }
});

// Picks one label option in whichever group it belongs to, on whichever
// image the lightbox editor is focused on
const chooseLabel = async (page: Page, name: string) => {
  await page.locator(".ImageLabels-option", { hasText: name }).first().click();
  await expect(
    page.locator(".ImageLabels-option-selected", { hasText: name }),
  ).toBeVisible();
};

// Labels and date only reach the server once Apply is clicked
const applyLabels = async (page: Page) => {
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("button", { name: "Applying..." })).toHaveCount(
    0,
    { timeout: 15_000 },
  );
};

test("performer image labels via UI: dropdowns and date reach the image directly", async ({
  editPage,
  moderatePage,
}) => {
  const admin = await adminApi();
  const performer = await createPerformer(admin, { name: uniq("LabelPerf") });
  await admin.dispose();

  await editPage.goto(`/performers/${performer.id}/edit`);
  await editPage.waitForLoadState("networkidle");
  await editPage.getByRole("tab", { name: "Images" }).click();

  // Uploaded rather than seeded from a URL: images are stored files, and every
  // URL-only image shares the empty checksum, so only one can exist at a time.
  // A unique image rather than the shared fixture, since labels are now a
  // property of the image itself and this test sets them
  await editPage
    .locator('input[type="file"]')
    .first()
    .setInputFiles(uniqueTinyJpegPath("label-dropdowns"));
  await editPage.getByRole("button", { name: "Upload" }).click();
  await expect(editPage.getByRole("button", { name: "Upload" })).toHaveCount(
    0,
    {
      timeout: 15_000,
    },
  );

  // Labelling happens in the lightbox, on one image at a time
  await editPage.locator(".ImageInput-image").first().click();
  await editPage.waitForSelector(".ImageLightbox-editor", { timeout: 15_000 });

  await chooseLabel(editPage, "Portrait");
  await chooseLabel(editPage, "Face");
  await editPage.getByLabel("Image date").fill("2019-06");
  await applyLabels(editPage);

  await editPage.locator(".ImageLightbox-close").click();

  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("label image via e2e");
  await expect(
    editPage.getByRole("button", { name: "Submit Edit" }),
  ).toBeEnabled({ timeout: 15_000 });
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  const editId = editPage.url().split("/").pop()!;

  // Only attachment is part of this edit now: labels were already saved above,
  // independent of whether this edit is ever approved
  await approveEdit(moderatePage, editId);

  const verify = await adminApi();
  const data = await gql<{
    findPerformer: {
      images: { types: string[]; date: string | null }[];
    } | null;
  }>(
    verify,
    `query($id: ID!) {
       findPerformer(id: $id) { images { types date } }
     }`,
    { id: performer.id },
  );
  await verify.dispose();

  const images = data.findPerformer?.images ?? [];
  expect(images).toHaveLength(1);
  expect(images[0].types.sort()).toEqual(["CROP_FACE", "SHOT_PORTRAIT"]);
  expect(images[0].date).toBe("2019-06");
});

test("performer page shows each image's labels", async ({
  editPage,
  moderatePage,
  readPage,
}) => {
  const admin = await adminApi();
  const performer = await createPerformer(admin, { name: uniq("GalleryPerf") });
  await admin.dispose();

  await editPage.goto(`/performers/${performer.id}/edit`);
  await editPage.waitForLoadState("networkidle");
  await editPage.getByRole("tab", { name: "Images" }).click();

  await editPage
    .locator('input[type="file"]')
    .first()
    .setInputFiles(uniqueTinyJpegPath("gallery-labels"));
  await editPage.getByRole("button", { name: "Upload" }).click();
  await expect(editPage.getByRole("button", { name: "Upload" })).toHaveCount(
    0,
    {
      timeout: 15_000,
    },
  );

  await editPage.locator(".ImageInput-image").first().click();
  await editPage.waitForSelector(".ImageLightbox-editor", { timeout: 15_000 });
  await chooseLabel(editPage, "Candid");
  await editPage.getByLabel("Image date").fill("2021");
  await applyLabels(editPage);
  await editPage.locator(".ImageLightbox-close").click();

  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("gallery labels e2e");
  await expect(
    editPage.getByRole("button", { name: "Submit Edit" }),
  ).toBeEnabled({ timeout: 15_000 });
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  await approveEdit(moderatePage, editPage.url().split("/").pop() ?? "");

  await readPage.goto(`/performers/${performer.id}`);
  await readPage.waitForLoadState("networkidle");

  await readPage.locator(".performer-photo button.Image").click();
  const readout = readPage.locator(
    ".ImageLightbox-editor .ImageLabels-summary",
  );
  await expect(readout.filter({ hasText: "Candid" })).toBeVisible();
  await expect(readout.filter({ hasText: "2021" })).toBeVisible();
  await expect(readPage.getByRole("radio")).toHaveCount(0);
  await expect(readPage.getByRole("button", { name: "Apply" })).toHaveCount(0);
});

test("moderator organizes a labelled image from the review feed, locking it", async ({
  editPage,
  moderatePage,
}) => {
  const admin = await adminApi();
  const performer = await createPerformer(admin, { name: uniq("ReviewPerf") });
  await admin.dispose();

  // A contributor uploads and labels an image, attached via the usual edit
  await editPage.goto(`/performers/${performer.id}/edit`);
  await editPage.waitForLoadState("networkidle");
  await editPage.getByRole("tab", { name: "Images" }).click();
  await editPage
    .locator('input[type="file"]')
    .first()
    .setInputFiles(uniqueTinyJpegPath("review-feed"));
  await editPage.getByRole("button", { name: "Upload" }).click();
  await expect(editPage.getByRole("button", { name: "Upload" })).toHaveCount(
    0,
    { timeout: 15_000 },
  );
  await editPage.locator(".ImageInput-image").first().click();
  await editPage.waitForSelector(".ImageLightbox-editor", { timeout: 15_000 });
  await chooseLabel(editPage, "Portrait");
  await applyLabels(editPage);
  await editPage.locator(".ImageLightbox-close").click();
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("review feed e2e");
  await expect(
    editPage.getByRole("button", { name: "Submit Edit" }),
  ).toBeEnabled({ timeout: 15_000 });
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  await approveEdit(moderatePage, editPage.url().split("/").pop() ?? "");

  // The feed is not for contributors
  await editPage.goto("/image-review");
  await expect(editPage.getByText(/Forbidden/)).toBeVisible();

  // The moderator finds the image in the feed and signs it off
  await moderatePage.goto("/image-review");
  await moderatePage.waitForLoadState("networkidle");
  const row = moderatePage.locator("tr", { hasText: performer.name });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Mark organized" }).click();
  await expect(row).toHaveCount(0, { timeout: 15_000 });

  // Organized only locks metadata
  await editPage.goto(`/performers/${performer.id}/edit`);
  await editPage.waitForLoadState("networkidle");
  await editPage.getByRole("tab", { name: "Images" }).click();
  await expect(editPage.locator(".ImageInput-remove").first()).toBeVisible({
    timeout: 15_000,
  });
  await editPage.locator(".ImageInput-image").first().click();
  await editPage.waitForSelector(".ImageLightbox-editor", { timeout: 15_000 });
  await expect(
    editPage.locator(".ImageLightbox-editor").getByRole("radio"),
  ).toHaveCount(0);
  await expect(editPage.getByRole("button", { name: "Apply" })).toHaveCount(0);

  await moderatePage.goto(`/performers/${performer.id}/edit`);
  await moderatePage.waitForLoadState("networkidle");
  await moderatePage.getByRole("tab", { name: "Images" }).click();
  await moderatePage
    .locator('input[type="file"]')
    .first()
    .setInputFiles(uniqueTinyJpegPath("review-feed-second"));
  await moderatePage.getByRole("button", { name: "Upload" }).click();
  await expect(
    moderatePage.getByRole("button", { name: "Upload" }),
  ).toHaveCount(0, { timeout: 15_000 });
  await moderatePage.locator(".ImageInput-image").first().click();
  await moderatePage.waitForSelector(".ImageLightbox-editor", {
    timeout: 15_000,
  });
  const chip = moderatePage.locator(
    ".ImageLightbox-thumb.selected .ImageLightbox-thumb-organized",
  );
  const mark = moderatePage
    .locator(".ImageLightbox-editor")
    .getByLabel("Organized");
  await expect(mark).toBeChecked();
  await expect(chip).toHaveCount(1);
  await mark.click();
  await expect(mark).not.toBeChecked({ timeout: 15_000 });
  await expect(chip).toHaveCount(0);

  await chooseLabel(moderatePage, "Candid");
  await mark.click();
  await expect(mark).toBeChecked({ timeout: 15_000 });
  await expect(chip).toHaveCount(1);
  await moderatePage.reload();
  await moderatePage.waitForLoadState("networkidle");
  await moderatePage.getByRole("tab", { name: "Images" }).click();
  await moderatePage.locator(".ImageInput-image").first().click();
  await moderatePage.waitForSelector(".ImageLightbox-editor", {
    timeout: 15_000,
  });
  await expect(
    moderatePage.locator(".ImageLightbox-editor .ImageLabels-summary"),
  ).toContainText("Candid");
});

test("moderator narrows the feed to one user and reverts a bad relabeling", async ({
  editPage,
  moderatePage,
}) => {
  const admin = await adminApi();
  const performer = await createPerformer(admin, { name: uniq("RevertPerf") });
  await admin.dispose();

  // A contributor uploads and labels an image, attached via the usual edit
  await editPage.goto(`/performers/${performer.id}/edit`);
  await editPage.waitForLoadState("networkidle");
  await editPage.getByRole("tab", { name: "Images" }).click();
  await editPage
    .locator('input[type="file"]')
    .first()
    .setInputFiles(uniqueTinyJpegPath("revert-feed"));
  await editPage.getByRole("button", { name: "Upload" }).click();
  await expect(editPage.getByRole("button", { name: "Upload" })).toHaveCount(
    0,
    { timeout: 15_000 },
  );
  await editPage.locator(".ImageInput-image").first().click();
  await editPage.waitForSelector(".ImageLightbox-editor", { timeout: 15_000 });
  await chooseLabel(editPage, "Portrait");
  await applyLabels(editPage);
  await editPage.locator(".ImageLightbox-close").click();
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("revert feed e2e");
  await expect(
    editPage.getByRole("button", { name: "Submit Edit" }),
  ).toBeEnabled({ timeout: 15_000 });
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  await approveEdit(moderatePage, editPage.url().split("/").pop() ?? "");

  // The same contributor then swaps the label for a wrong one
  await editPage.goto(`/performers/${performer.id}/edit`);
  await editPage.waitForLoadState("networkidle");
  await editPage.getByRole("tab", { name: "Images" }).click();
  await editPage.locator(".ImageInput-image").first().click();
  await editPage.waitForSelector(".ImageLightbox-editor", { timeout: 15_000 });
  await chooseLabel(editPage, "Candid");
  await applyLabels(editPage);

  // The moderator surveys that user's work via the By-column funnel, then
  // reverts the row: the labels return to the state before the last change
  await moderatePage.goto("/image-review");
  await moderatePage.waitForLoadState("networkidle");
  const row = moderatePage.locator("tr", { hasText: performer.name });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row).toContainText("Candid");
  await row
    .getByRole("button", { name: "Show only this user's categorizations" })
    .click();
  await expect(moderatePage.getByText("Show everything")).toBeVisible();
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Revert" }).click();
  // The revert takes over the attribution, so the row drains out of the
  // suspect's filtered list...
  await expect(row).toHaveCount(0, { timeout: 15_000 });
  // ...and the full feed shows the restored labels, awaiting sign-off
  await moderatePage.getByText("Show everything").click();
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row).toContainText("Portrait");
  await expect(row).not.toContainText("Candid");
});
test("performer image crop via UI: the frame drawn is the image stored", async ({
  editPage,
  moderatePage,
}) => {
  const admin = await adminApi();
  const performer = await createPerformer(admin, { name: uniq("CropPerf") });
  await admin.dispose();

  await editPage.goto(`/performers/${performer.id}/edit`);
  await editPage.waitForLoadState("networkidle");
  await editPage.getByRole("tab", { name: "Images" }).click();

  await editPage
    .locator('input[type="file"]')
    .first()
    .setInputFiles(squarePngPath());

  await expect(editPage.getByRole("button", { name: "Upload" })).toBeVisible();

  // Choosing the crop is what applies its template:
  // one control, so a chosen frame and a chosen label cannot disagree
  await chooseLabel(editPage, "Face");

  const handle = editPage.getByRole("button", { name: "Resize se" });
  await expect(handle).toBeVisible({ timeout: 15_000 });
  await expect(
    editPage.getByRole("button", { name: "Crop and upload" }),
  ).toBeVisible();

  // A real pointer drag, which is the whole reason this test is here:
  // the frame's geometry is unit-tested, but nothing else drives it through an actual browser
  const box = await handle.boundingBox();
  if (!box) throw new Error("the resize handle has no box to drag");
  await editPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await editPage.mouse.down();
  await editPage.mouse.move(box.x - 60, box.y - 60, { steps: 10 });
  await editPage.mouse.up();

  await editPage.getByRole("button", { name: "Crop and upload" }).click();
  await expect(
    editPage.getByRole("button", { name: "Crop and upload" }),
  ).toHaveCount(0, { timeout: 20_000 });

  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("crop image via e2e");
  await expect(
    editPage.getByRole("button", { name: "Submit Edit" }),
  ).toBeEnabled({ timeout: 15_000 });
  await editPage.getByRole("button", { name: "Submit Edit" }).click();
  await editPage.waitForURL(/\/edits\/[0-9a-f-]+/i, { timeout: 15_000 });
  await approveEdit(moderatePage, editPage.url().split("/").pop() ?? "");

  const verify = await adminApi();
  const data = await gql<{
    findPerformer: {
      images: { types: string[]; width: number; height: number }[];
    } | null;
  }>(
    verify,
    `query($id: ID!) {
       findPerformer(id: $id) {
         images { types width height }
       }
     }`,
    { id: performer.id },
  );
  await verify.dispose();

  const [stored] = data.findPerformer?.images ?? [];
  expect(stored?.types).toContain("CROP_FACE");

  expect(stored.width).toBeLessThan(SQUARE_PNG_SIZE);
  expect(stored.height).toBeGreaterThan(stored.width);

  // The crop can then be held against the frame it claims from either
  // place a moderator signs images off: the review feed's lightbox...
  await moderatePage.goto("/image-review");
  await moderatePage.waitForLoadState("networkidle");
  const row = moderatePage.locator("tr", { hasText: performer.name });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.locator("button.Image").click();
  await moderatePage.getByRole("button", { name: "Show guides" }).click();
  await expect(
    moderatePage.locator(".CropOverlay-guide").first(),
  ).toBeVisible();
  await moderatePage.locator(".ImageLightbox-close").click();

  // ...and the performer page's, where the Organized switch also lives
  await moderatePage.goto(`/performers/${performer.id}`);
  await moderatePage.waitForLoadState("networkidle");
  await moderatePage.locator(".performer-photo button.Image").click();
  await expect(
    moderatePage.locator(".ImageLightbox-editor").getByLabel("Organized"),
  ).toBeVisible();
  await expect(
    moderatePage.locator(".CropOverlay-guide").first(),
  ).toBeVisible();
  await expect(
    moderatePage.getByRole("button", { name: "Hide guides" }),
  ).toBeVisible();

  // Signing off there vouches for the framing as much as the labels, so from
  // then on the edit form's Re-crop can only add a new image alongside it
  const mark = moderatePage
    .locator(".ImageLightbox-editor")
    .getByLabel("Organized");
  await mark.click();
  await expect(mark).toBeChecked({ timeout: 15_000 });
  await moderatePage.goto(`/performers/${performer.id}/edit`);
  await moderatePage.waitForLoadState("networkidle");
  await moderatePage.getByRole("tab", { name: "Images" }).click();
  await moderatePage.locator(".ImageInput-image").first().click();
  await moderatePage.getByRole("button", { name: "Re-crop" }).click();
  await expect(
    moderatePage.getByText("Organized, so the crop is added as a new image"),
  ).toBeVisible();
  await expect(
    moderatePage.getByRole("checkbox", { name: "Add as a new image" }),
  ).toHaveCount(0);
  await expect(
    moderatePage.getByRole("button", { name: "Save as new image" }),
  ).toBeVisible();
});
