// Notifications subsystem: subscription preferences, read state, and the
// edit-comment round-trip. Two-actor flows here — one user produces an
// event, another observes it as a notification.

import { test, expect } from "../support/fixtures";
import { adminApi, gql, submitStudioCreateEdit, uniq } from "../support/helpers/seed";
import { graphqlAs } from "../support/helpers/graphql";

const queryNotifications = (api: import("@playwright/test").APIRequestContext, unreadOnly = false) =>
  gql<{
    queryNotifications: {
      count: number;
      notifications: { read: boolean; data: { __typename: string } }[];
    };
  }>(
    api,
    `query($input: QueryNotificationsInput!) {
       queryNotifications(input: $input) {
         count
         notifications { read data { __typename } }
       }
     }`,
    { input: { page: 1, per_page: 50, unread_only: unreadOnly } },
  );

test("updateNotificationSubscriptions persists for the current user", async () => {
  // Read current subs, swap to a smaller set, verify, restore.
  const api = await graphqlAs("e2e_read");
  const before = await gql<{
    me: { notification_subscriptions: string[] };
  }>(api, `query { me { notification_subscriptions } }`);
  const previous = before.me.notification_subscriptions;

  await gql(
    api,
    `mutation($s: [NotificationEnum!]!) {
       updateNotificationSubscriptions(subscriptions: $s)
     }`,
    { s: ["FAVORITE_PERFORMER_SCENE"] },
  );

  const after = await gql<{ me: { notification_subscriptions: string[] } }>(
    api,
    `query { me { notification_subscriptions } }`,
  );
  expect(after.me.notification_subscriptions).toEqual(["FAVORITE_PERFORMER_SCENE"]);

  // Restore so we don't leak state into other tests.
  await gql(
    api,
    `mutation($s: [NotificationEnum!]!) {
       updateNotificationSubscriptions(subscriptions: $s)
     }`,
    { s: previous },
  );
  await api.dispose();
});

test("comment on an edit produces a CommentOwnEdit notification for the owner", async () => {
  // Subscriber: e2e_edit (default subs include COMMENT_OWN_EDIT).
  // Actor: e2e_admin posts a comment via GraphQL.
  const owner = await graphqlAs("e2e_edit");
  const { id: editId } = await submitStudioCreateEdit(owner, uniq("Studio"));

  // Record how many CommentOwnEdit notifications the owner already has so the
  // assertion is delta-based (parallel tests can leave the owner with a
  // non-zero starting count).
  const initial = await queryNotifications(owner);
  const initialCommentCount = initial.queryNotifications.notifications.filter(
    (n) => n.data.__typename === "CommentOwnEdit",
  ).length;

  // Admin (a different user) posts a comment on the owner's edit.
  const admin = await adminApi();
  await gql(
    admin,
    `mutation($input: EditCommentInput!) {
       editComment(input: $input) { id }
     }`,
    { input: { id: editId, comment: `e2e ${Date.now()}` } },
  );
  await admin.dispose();

  // Poll until the owner sees the new CommentOwnEdit notification.
  await expect
    .poll(
      async () => {
        const r = await queryNotifications(owner);
        return r.queryNotifications.notifications.filter(
          (n) => n.data.__typename === "CommentOwnEdit",
        ).length;
      },
      { timeout: 10_000, intervals: [200, 500, 1_000] },
    )
    .toBeGreaterThan(initialCommentCount);

  await owner.dispose();
});

test("markNotificationsRead clears unread_only results", async () => {
  // Produce a notification for owner, then bulk-mark-read, then assert
  // unread_only returns nothing of that type for them.
  const owner = await graphqlAs("e2e_edit");
  const { id: editId } = await submitStudioCreateEdit(owner, uniq("Studio"));

  const admin = await adminApi();
  await gql(
    admin,
    `mutation($input: EditCommentInput!) {
       editComment(input: $input) { id }
     }`,
    { input: { id: editId, comment: `e2e-read ${Date.now()}` } },
  );
  await admin.dispose();

  // Wait for the notification to land.
  await expect
    .poll(
      async () => {
        const r = await queryNotifications(owner, true);
        return r.queryNotifications.notifications.length;
      },
      { timeout: 10_000 },
    )
    .toBeGreaterThan(0);

  // Mark all unread notifications read.
  await gql(owner, `mutation { markNotificationsRead }`);

  // unread_only should now return 0.
  const after = await queryNotifications(owner, true);
  expect(after.queryNotifications.count).toBe(0);
  expect(after.queryNotifications.notifications.length).toBe(0);

  await owner.dispose();
});
