// Scene fingerprint surfaces. These cover the API path stash-app uses to
// push fingerprints, plus the moderator-only UI for moving/deleting them.
//
// The fingerprint table is rendered inside the scene detail page
// (FingerprintTable.tsx); the action buttons are only shown to MODERATE+ on
// the live page, which means we drive them as admin (admin implies moderate).

import { test, expect } from "../../support/fixtures";
import {
  adminApi,
  createScene,
  createStudio,
  gql,
  randomHex,
  submitFingerprint,
  uniq,
} from "../../support/helpers/seed";
import { graphqlAs } from "../../support/helpers/graphql";

async function fetchSceneFingerprints(api: import("@playwright/test").APIRequestContext, sceneId: string) {
  const data = await gql<{
    findScene: { fingerprints: { hash: string }[] } | null;
  }>(
    api,
    `query($id: ID!) {
       findScene(id: $id) { fingerprints { hash algorithm } }
     }`,
    { id: sceneId },
  );
  return data.findScene?.fingerprints ?? [];
}

test("READ user can submit a fingerprint and it appears on the scene page", async ({
  adminPage,
}) => {
  // Seed a scene as admin.
  const admin = await adminApi();
  const studio = await createStudio(admin);
  const scene = await createScene(admin, { studioId: studio.id });
  await admin.dispose();

  // Submit a fingerprint as e2e_read (the stash-app push path is gated by
  // READ; everyone with a session can do it).
  const reader = await graphqlAs("e2e_read");
  const { hash } = await submitFingerprint(reader, {
    sceneId: scene.id,
  });
  await reader.dispose();

  // View the scene detail page; the fingerprint hash should be linked in the
  // fingerprint table.
  await adminPage.goto(`/scenes/${scene.id}`);
  // Fingerprints live in a tab on the scene detail page.
  await adminPage.getByRole("tab", { name: "Fingerprints" }).click();
  await expect(adminPage.getByRole("link", { name: hash })).toBeVisible({
    timeout: 10_000,
  });
});

test("moderator can delete a fingerprint via the UI", async ({ adminPage }) => {
  const admin = await adminApi();
  const studio = await createStudio(admin);
  const scene = await createScene(admin, { studioId: studio.id });
  await admin.dispose();

  // Seed a fingerprint as a READ user so user_submitted=false for admin —
  // this puts the row in the "needs moderator action" state where the
  // delete-selected button is the path to remove it.
  const reader = await graphqlAs("e2e_read");
  const { hash } = await submitFingerprint(reader, { sceneId: scene.id });
  await reader.dispose();

  await adminPage.goto(`/scenes/${scene.id}`);
  await adminPage.getByRole("tab", { name: "Fingerprints" }).click();
  await expect(adminPage.getByRole("link", { name: hash })).toBeVisible();

  // The fingerprint row's selection checkbox sits in the first <td> of the
  // row containing the hash. Bootstrap renders it as role=checkbox.
  const row = adminPage.locator("tr").filter({ hasText: hash });
  await row.getByRole("checkbox").check();

  // The toolbar button is labelled "Move Selected (N)" / "Delete Selected (N)";
  // use a regex so we don't care about the count number.
  await adminPage.getByRole("button", { name: /Delete Selected/i }).click();
  // Modal: red "Delete" button. The page also has a top-level "Delete" link
  // for the scene, so scope to the modal.
  await adminPage
    .locator(".modal")
    .getByRole("button", { name: /^Delete$/i })
    .click();

  // Verify via GraphQL that the fingerprint is gone.
  const admin2 = await adminApi();
  const remaining = await fetchSceneFingerprints(admin2, scene.id);
  await admin2.dispose();
  expect(remaining.map((f) => f.hash)).not.toContain(hash);
});

test("moderator can move a fingerprint to another scene via the UI", async ({
  adminPage,
}) => {
  const admin = await adminApi();
  const studio = await createStudio(admin);
  const sceneA = await createScene(admin, {
    studioId: studio.id,
    title: uniq("SrcScene"),
  });
  const sceneB = await createScene(admin, {
    studioId: studio.id,
    title: uniq("DstScene"),
  });
  await admin.dispose();

  const reader = await graphqlAs("e2e_read");
  const { hash } = await submitFingerprint(reader, { sceneId: sceneA.id });
  await reader.dispose();

  await adminPage.goto(`/scenes/${sceneA.id}`);
  await adminPage.getByRole("tab", { name: "Fingerprints" }).click();
  const row = adminPage.locator("tr").filter({ hasText: hash });
  await row.getByRole("checkbox").check();

  await adminPage.getByRole("button", { name: /Move Selected/i }).click();

  const modal = adminPage.locator(".modal");
  await modal.getByPlaceholder("Enter scene ID").fill(sceneB.id);
  // The modal looks up the scene by id; wait for the target preview to
  // appear (it renders the scene's title once the lookup resolves) before
  // clicking Move.
  await expect(modal.getByText(sceneB.title!)).toBeVisible({ timeout: 10_000 });
  await modal.getByRole("button", { name: /^Move$/i }).click();

  // Post-condition: fingerprint removed from sceneA and present on sceneB.
  const admin2 = await adminApi();
  const onA = await fetchSceneFingerprints(admin2, sceneA.id);
  const onB = await fetchSceneFingerprints(admin2, sceneB.id);
  await admin2.dispose();
  expect(onA.map((f) => f.hash)).not.toContain(hash);
  expect(onB.map((f) => f.hash)).toContain(hash);
});

test("user can unmatch their own fingerprint submission", async ({}) => {
  // The "user_submitted" check controls visibility of the unmatch icon. Drive
  // submission + unmatch as the same user, then verify via the unmatch
  // mutation directly (the UI uses an icon-only button which is brittle to
  // address through the DOM). This keeps the test as a behavioural assertion
  // on the mutation rather than the icon click.
  const admin = await adminApi();
  const studio = await createStudio(admin);
  const scene = await createScene(admin, { studioId: studio.id });
  await admin.dispose();

  const reader = await graphqlAs("e2e_read");
  const { hash, algorithm } = await submitFingerprint(reader, {
    sceneId: scene.id,
    algorithm: "OSHASH",
    hash: randomHex(16),
  });

  // Submit again with vote=REMOVE — equivalent to clicking unmatch.
  await gql(
    reader,
    `mutation($input: FingerprintSubmission!) {
       submitFingerprint(input: $input)
     }`,
    {
      input: {
        scene_id: scene.id,
        fingerprint: { hash, algorithm, duration: 1234 },
        vote: "REMOVE",
      },
    },
  );
  await reader.dispose();

  // After unmatch, our submission no longer counts; the only thing keeping
  // the row visible would be other users' submissions, of which there are
  // none here, so the fingerprint should drop off the scene entirely.
  const admin2 = await adminApi();
  const remaining = await fetchSceneFingerprints(admin2, scene.id);
  await admin2.dispose();
  expect(remaining.map((f) => f.hash)).not.toContain(hash);
});
