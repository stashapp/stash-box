// Image upload + role gates. The upload path goes through the UI's
// EditImages component (file picker → imageCreate mutation → image_ids in
// the entity edit). Role-gate tests assert the @hasRole directives on
// imageCreate (EDIT) and imageDestroy (MODIFY) without touching the file
// backend.

import { test, expect } from "../../support/fixtures";
import { adminApi, createStudio, gql, uniq } from "../../support/helpers/seed";
import { graphqlAs } from "../../support/helpers/graphql";
import { approveEdit } from "../../support/helpers/workflow";
import { tinyJpegPath } from "../../support/fixtures/tiny-jpeg";

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
  // step is explicit; setInputFiles alone doesn't fire the upload.
  const fileInput = editPage.locator('input[type="file"]').first();
  await fileInput.setInputFiles(tinyJpegPath());
  await editPage.getByRole("button", { name: "Upload", exact: true }).click();

  // The "Uploading image..." spinner shows while the mutation is in flight;
  // once it clears, the image preview is in place.
  await expect(editPage.getByText(/Uploading image/i)).toHaveCount(0, {
    timeout: 15_000,
  });

  // Submit the edit from the Confirm tab.
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
  // returned for our 1x1 JFIF.
  const verify = await adminApi();
  const data = await gql<{
    findStudio: { images: { id: string; width: number; height: number }[] } | null;
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
