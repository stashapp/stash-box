import { test, expect } from "../../support/fixtures";
import { adminApi, createScene, createStudio, gql, submitFingerprint } from "../../support/helpers/seed";
import { graphqlAs } from "../../support/helpers/graphql";

test("external client reports an association and a move completes it in the queue", async ({ readPage, moderatePage }) => {
  const admin = await adminApi();
  const studio = await createStudio(admin);
  const source = await createScene(admin, { studioId: studio.id });
  const target = await createScene(admin, { studioId: studio.id });
  const reader = await graphqlAs("e2e_read");
  const { hash } = await submitFingerprint(reader, { sceneId: source.id });

  await gql(reader, `mutation($input:FingerprintReportInput!){reportFingerprint(input:$input){id}}`, { input: { scene_id: source.id, hash, algorithm: "OSHASH", correct_scene_id: target.id, comment: "Fingerprint belongs to a different release" } });
  await readPage.goto(`/scenes/${source.id}`);
  await readPage.getByRole("tab", { name: "Fingerprints", exact: true }).click();
  const fingerprintRow = readPage.getByRole("row").filter({ hasText: hash });
  await expect(fingerprintRow).toBeVisible();
  await expect(fingerprintRow.getByRole("button", { name: "Report", exact: true })).toHaveCount(0);

  const other = await submitFingerprint(admin, { sceneId: target.id });
  await gql(reader, `mutation($input:FingerprintReportInput!){reportFingerprint(input:$input){id}}`, { input: { scene_id: target.id, hash: other.hash, algorithm: "OSHASH", comment: "Unrelated scene report" } });
  await moderatePage.goto(`/scenes/${source.id}#fingerprints`);
  await expect(moderatePage.locator(".reports-list")).toHaveCount(0);
  const reportedRow = moderatePage.getByRole("row").filter({ hasText: hash });
  await reportedRow.getByRole("button", { name: "View fingerprint reports" }).click();
  const popover = moderatePage.locator(".popover");
  await expect(popover).toContainText("Fingerprint belongs to a different release");
  await expect(popover).toContainText("Suggested scene:");
  await expect(popover).not.toContainText("Unrelated scene report");

  await moderatePage.goto("/fingerprint-reports");
  await expect(moderatePage.getByLabel("Report status")).toHaveValue("");
  const row = moderatePage.getByRole("row").filter({ hasText: hash });
  await expect(row.locator(".text-white")).toBeVisible();
  await expect(row).toContainText("Fingerprint belongs to a different release");
  await expect(row.getByRole("button", { name: "Move fingerprint", exact: true })).toHaveCount(0);
  await gql(admin, `mutation($input:MoveFingerprintSubmissionsInput!){sceneMoveFingerprintSubmissions(input:$input)}`, { input: { source_scene_id: source.id, target_scene_id: target.id, fingerprints: [{ hash, algorithm: "OSHASH" }] } });
  await moderatePage.reload();
  await expect(row.locator(".text-success")).toBeVisible();
  await moderatePage.getByLabel("Report status").selectOption("COMPLETED");
  await expect(row).toContainText("COMPLETED");
  await expect.poll(async () => {
    const data = await gql<{ findScene: { fingerprints: { hash: string; submissions: number }[] } }>(admin, `query($id:ID!){findScene(id:$id){fingerprints{hash submissions}}}`, { id: target.id });
    return data.findScene.fingerprints.find((fp) => fp.hash === hash)?.submissions;
  }).toBe(1);
  await reader.dispose();
  await admin.dispose();
});

test("moderator closes a report as incorrect without changing submissions", async ({ moderatePage, readPage }) => {
  const admin = await adminApi();
  const studio = await createStudio(admin);
  const source = await createScene(admin, { studioId: studio.id });
  const { hash } = await submitFingerprint(admin, { sceneId: source.id });
  const reader = await graphqlAs("e2e_read");
  await gql(reader, `mutation($input:FingerprintReportInput!){reportFingerprint(input:$input){id}}`, { input: { scene_id: source.id, hash, algorithm: "OSHASH", comment: "Please investigate" } });
  await moderatePage.goto("/fingerprint-reports");
  const row = moderatePage.getByRole("row").filter({ hasText: hash });
  await row.getByRole("button", { name: "Close as incorrect" }).click();
  await expect(row.locator(".text-danger")).toBeVisible();
  await moderatePage.getByLabel("Report status").selectOption("INCORRECT");
  await expect(row).toContainText("INCORRECT");
  const data = await gql<{ findScene: { fingerprints: { hash: string; submissions: number }[] } }>(admin, `query($id:ID!){findScene(id:$id){fingerprints{hash submissions}}}`, { id: source.id });
  expect(data.findScene.fingerprints.find((fp) => fp.hash === hash)?.submissions).toBe(1);
  await readPage.goto("/fingerprint-reports");
  await expect(readPage.getByText("Moderator access required.")).toBeVisible();
  await reader.dispose();
  await admin.dispose();
});
