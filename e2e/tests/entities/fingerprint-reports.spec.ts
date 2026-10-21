import { test, expect } from "../../support/fixtures";
import { adminApi, createScene, createStudio, gql, submitFingerprint } from "../../support/helpers/seed";
import { graphqlAs } from "../../support/helpers/graphql";

test("reader reports an association and moderator moves it from the queue", async ({ readPage, moderatePage }) => {
  const admin = await adminApi();
  const studio = await createStudio(admin);
  const source = await createScene(admin, { studioId: studio.id });
  const target = await createScene(admin, { studioId: studio.id });
  const reader = await graphqlAs("e2e_read");
  const { hash } = await submitFingerprint(reader, { sceneId: source.id });

  await readPage.goto(`/scenes/${source.id}`);
  await readPage.getByRole("tab", { name: "Fingerprints", exact: true }).click();
  await readPage.getByRole("row").filter({ hasText: hash }).getByRole("button", { name: "Report", exact: true }).click();
  const reportDialog = readPage.getByRole("dialog");
  await reportDialog.getByLabel("Correct scene (optional)").fill(new URL(`/scenes/${target.id}`, readPage.url()).href);
  await reportDialog.getByLabel("Comment (optional)").fill("Fingerprint belongs to a different release");
  await reportDialog.getByRole("button", { name: "Submit report" }).click();
  await expect(reportDialog).toBeHidden();

  await moderatePage.goto("/fingerprint-reports");
  const row = moderatePage.getByRole("row").filter({ hasText: hash });
  await expect(row).toContainText("Fingerprint belongs to a different release");
  await row.getByRole("button", { name: "Move fingerprint", exact: true }).click();
  const moveDialog = moderatePage.getByRole("dialog");
  await expect(moveDialog.getByPlaceholder("Enter scene ID")).toHaveValue(target.id);
  await moveDialog.getByRole("button", { name: /^Move/ }).click();
  await expect(moveDialog).toBeHidden();
  await expect(row).toHaveCount(0);
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
  await expect(row).toHaveCount(0);
  await moderatePage.getByLabel("Report status").selectOption("INCORRECT");
  await expect(row).toContainText("INCORRECT");
  const data = await gql<{ findScene: { fingerprints: { hash: string; submissions: number }[] } }>(admin, `query($id:ID!){findScene(id:$id){fingerprints{hash submissions}}}`, { id: source.id });
  expect(data.findScene.fingerprints.find((fp) => fp.hash === hash)?.submissions).toBe(1);
  await readPage.goto("/fingerprint-reports");
  await expect(readPage.getByText("Moderator access required.")).toBeVisible();
  await reader.dispose();
  await admin.dispose();
});
