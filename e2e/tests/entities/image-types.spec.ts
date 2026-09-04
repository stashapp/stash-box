import { test, expect } from "../../support/fixtures";
import {
  adminApi,
  createPerformer,
  gql,
  uniq,
} from "../../support/helpers/seed";
import { tinyJpegPath } from "../../support/fixtures/tiny-jpeg";

// The admin image type screen: which of the vocabulary this instance uses and
// in what order. The taxonomy itself is seeded by migration so ordering and
// switching entries off cover the entirety of an admins power

// Everything here writes instance-wide state and puts it back afterwards, so
// these cannot overlap: the screen refetches on any change, and a concurrent
// write would replace what the test under way had just toggled on screen.
test.describe.configure({ mode: "serial" });

type Group = { key: string; types: { key: string }[] };

const readOrder = async () => {
  const admin = await adminApi();
  const data = await gql<{ imageTypeGroups: Group[] }>(
    admin,
    `query { imageTypeGroups { key types { key } } }`,
  );
  await admin.dispose();
  return data.imageTypeGroups;
};

// Ordering is instance-wide state, so a test that changes it puts it back
const restoreOrder = async (groups: Group[]) => {
  const admin = await adminApi();
  await gql(
    admin,
    `mutation($input: ImageTypeOrderInput!) {
       imageTypeOrderUpdate(input: $input) { key }
     }`,
    {
      input: {
        groups: groups.map((g) => g.key),
        types: groups.flatMap((g) => g.types.map((t) => t.key)),
      },
    },
  );
  await admin.dispose();
};

test("admin reorders image type groups and types through the UI", async ({
  adminPage,
}) => {
  const before = await readOrder();

  try {
    await adminPage.goto("/image-types");
    await adminPage.waitForLoadState("networkidle");

    // Groups render in priority order; demote the first one
    const groupRows = adminPage.locator(".DragList.is-block > .DragList-row");
    await groupRows
      .nth(0)
      .locator("> .DragList-handle")
      .dragTo(groupRows.nth(1), { targetPosition: { x: 20, y: 12 } });

    // Then demote the first type inside what is now the leading group
    const typeRows = adminPage
      .locator(".card-body")
      .first()
      .locator(".DragList-row");
    await typeRows.nth(0).locator(".DragList-handle").dragTo(typeRows.nth(1));

    await adminPage.getByRole("button", { name: "Save Order" }).click();

    // Saving is instance-wide so we need to confirm through the modal
    await adminPage.getByRole("button", { name: "Save for everyone" }).click();
    await expect(adminPage.getByText("Order saved.")).toBeVisible();

    const after = await readOrder();
    expect(after[0].key).toBe(before[1].key);
    expect(after[1].key).toBe(before[0].key);

    // The group that moved to the front had its first two types swapped.
    const moved = after.find((g) => g.key === before[1].key);
    expect(moved?.types[0].key).toBe(before[1].types[1].key);
    expect(moved?.types[1].key).toBe(before[1].types[0].key);
  } finally {
    await restoreOrder(before);
  }
});

// Switching a type off is instance-wide too, so it is restored the same way
const restoreEnabled = async () => {
  const admin = await adminApi();
  await gql(
    admin,
    `mutation {
       imageTypeSetEnabled(input: { disabled_groups: [], disabled_types: [] }) { key }
     }`,
  );
  await admin.dispose();
};

test("admin switches a type off and it stops being offered", async ({
  adminPage,
  editPage,
}) => {
  try {
    await adminPage.goto("/image-types");
    await adminPage.waitForLoadState("networkidle");

    // Whichever type leads the first group, skipping the few other specs
    // label with: switching one off is instance-wide and takes effect at once,
    // so disabling one of those would fail a spec running alongside this one.
    // Chosen by position rather than named, since the taxonomy is reorderable.
    const inUseElsewhere = ["Portrait", "Face", "Candid"];
    const names = await adminPage
      .locator(".card-body")
      .first()
      .locator(".DragList-row .DragList-content > span")
      .allInnerTexts();

    const typeName = names.find((name) => !inUseElsewhere.includes(name));
    if (!typeName) throw new Error("no type left to switch off");

    const toggle = adminPage.getByRole("checkbox", { name: `Use ${typeName}` });
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    // Once again we must pass the modal to save instance-wide state
    await adminPage.getByRole("button", { name: "Save Order" }).click();
    await adminPage.getByRole("button", { name: "Save for everyone" }).click();
    await expect(adminPage.getByText("Order saved.")).toBeVisible();
    await expect(toggle).not.toBeChecked();

    // Now someone labeling an image will not be offered the disabled groups/types
    const admin = await adminApi();
    const performer = await createPerformer(admin, {
      name: uniq("DisabledPerf"),
    });
    await admin.dispose();

    await editPage.goto(`/performers/${performer.id}/edit`);
    await editPage.waitForLoadState("networkidle");
    await editPage.getByRole("tab", { name: "Images" }).click();

    await editPage
      .locator('input[type="file"]')
      .first()
      .setInputFiles(tinyJpegPath());
    await editPage.getByRole("button", { name: "Upload" }).click();
    await expect(
      editPage.getByRole("button", { name: "Upload" }),
    ).toHaveCount(0, {
      timeout: 15_000,
    });

    await editPage.locator(".ImageInput-image").first().click();
    await editPage.waitForSelector(".ImageLightbox-editor", {
      timeout: 15_000,
    });

    // Check that anything at all is offered so an empty picker doesn't pass the test
    await expect(
      editPage.locator(".EditImages-labels-option").first(),
    ).toBeVisible();
    await expect(
      editPage.locator(".EditImages-labels-option", { hasText: typeName }),
    ).toHaveCount(0);
  } finally {
    await restoreEnabled();
  }
});
