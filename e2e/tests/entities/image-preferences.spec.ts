import { test, expect } from "../../support/fixtures";
import { graphqlAs } from "../../support/helpers/graphql";
import { gql } from "../../support/helpers/seed";

// The stored key behind a display name, which is all the screen shows
const keyNamed = async (name: string) => {
  const api = await graphqlAs("e2e_edit");
  const data = await gql<{
    imageTypeGroups: { types: { key: string; name: string }[] }[];
  }>(api, `query { imageTypeGroups { types { key name } } }`);
  await api.dispose();

  const match = data.imageTypeGroups
    .flatMap((group) => group.types)
    .find((type) => type.name === name);
  if (!match) throw new Error(`no image type named ${name}`);
  return match.key;
};

const groupPreferencesOf = async (username: string) => {
  const api = await graphqlAs(username);
  const data = await gql<{ me: { image_type_group_preferences: string[] } }>(
    api,
    `query { me { image_type_group_preferences } }`,
  );
  await api.dispose();
  return data.me.image_type_group_preferences;
};

const preferencesOf = async (username: string) => {
  const api = await graphqlAs(username);
  const data = await gql<{ me: { image_type_preferences: string[] } }>(
    api,
    `query { me { image_type_preferences } }`,
  );
  await api.dispose();
  return data.me.image_type_preferences;
};

test("image preference screen saves an order and clears it", async ({
  editPage,
}) => {
  try {
    await editPage.goto("/users/e2e_edit/image-types");
    await editPage.waitForLoadState("networkidle");

    const firstGroup = editPage.locator(".card-body").first();
    const rows = firstGroup.locator(".DragList-row");
    const nameOf = (index: number) =>
      rows.nth(index).locator(".DragList-content").innerText();

    const wasSecond = await nameOf(1);

    // Promote the second type of the first group
    await rows.nth(1).locator(".DragList-handle").dragTo(rows.nth(0));

    expect(await nameOf(0)).toBe(wasSecond);

    await editPage.getByRole("button", { name: "Save", exact: true }).click();
    await expect(editPage.getByText("Preferences saved.")).toBeVisible();

    // We save the full ordering every time
    const saved = await preferencesOf("e2e_edit");
    expect(saved.length).toBeGreaterThan(1);
    expect(saved[0]).toBe(await keyNamed(wasSecond));

    // Groups reorder the same way, and are the stronger of the two
    const groupRows = editPage.locator(".DragList.is-block > .DragList-row");
    const groupNames = () => editPage.locator(".card-header b").allInnerTexts();
    const groupsBefore = await groupNames();

    await groupRows
      .nth(0)
      .locator("> .DragList-handle")
      .dragTo(groupRows.nth(1), { targetPosition: { x: 20, y: 12 } });

    expect((await groupNames())[0]).toBe(groupsBefore[1]);

    await editPage.getByRole("button", { name: "Save", exact: true }).click();
    await expect(editPage.getByText("Preferences saved.")).toBeVisible();
    expect((await groupPreferencesOf("e2e_edit")).length).toBeGreaterThan(1);

    await editPage.getByRole("button", { name: "Use site default" }).click();
    await expect(editPage.getByText("Preferences saved.")).toBeVisible();

    expect(await preferencesOf("e2e_edit")).toEqual([]);
    expect(await groupPreferencesOf("e2e_edit")).toEqual([]);
  } finally {
    // Shared fixture user so we want them to go back to the default ordering
    const api = await graphqlAs("e2e_edit");
    await gql(
      api,
      `mutation { updateImageTypePreferences(input: { types: [], groups: [] }) }`,
    );
    await api.dispose();
  }
});
