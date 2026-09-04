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
  await page
    .locator(".EditImages-labels-option", { hasText: name })
    .first()
    .click();
  await expect(
    page.locator(".EditImages-labels-option-selected", { hasText: name }),
  ).toBeVisible();
};

// Labels and date only reach the server once Apply is clicked, and a
// non-moderator session gets one more prompt first: applying locks the
// field in for good, so it is worth confirming before it happens.
const applyLabels = async (page: Page) => {
  await page.getByRole("button", { name: "Apply" }).click();
  await page
    .getByRole("dialog", { name: /moderator/i })
    .getByRole("button", { name: "Apply" })
    .click();
  await expect(
    page.getByRole("button", { name: "Applying..." }),
  ).toHaveCount(0, { timeout: 15_000 });
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
  // property of the image itself and this test sets them.
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

  // Only attachment is part of this edit now -- labels already saved above,
  // independent of whether this edit is ever approved.
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

  await editPage.goto(`/performers/${performer.id}`);
  await editPage.waitForLoadState("networkidle");

  // On the performer page the labels live over the image in the lightbox
  // rather than in a list beneath it: a labelled performer looks like an
  // unlabelled one until you go looking
  await editPage.locator(".performer-photo button.Image").click();
  const labels = editPage.locator(".ImageLightbox-main .ImageLightbox-labels");
  await expect(labels).toBeVisible();
  await expect(labels.getByText("Candid")).toBeVisible();
  await expect(labels.getByText("2021")).toBeVisible();
});

