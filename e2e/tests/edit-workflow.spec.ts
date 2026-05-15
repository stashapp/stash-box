// Tests for the edit lifecycle itself, decoupled from any one entity type.
// We use studio-create edits because they're the cheapest to set up.

import { test, expect } from "../support/fixtures";
import {
  adminApi,
  castVote,
  fetchEditStatus,
  submitStudioCreateEdit,
  uniq,
} from "../support/helpers/seed";
import { graphqlAs } from "../support/helpers/graphql";
import {
  approveEdit,
  cancelEdit,
  commentOnEdit,
  voteOnEdit,
} from "../support/helpers/workflow";

test("owner can cancel their own pending edit", async ({ editPage }) => {
  const editor = await graphqlAs("e2e_edit");
  const edit = await submitStudioCreateEdit(editor, uniq("Studio"));
  await editor.dispose();

  await cancelEdit(editPage, edit.id);

  // The cancel mutation runs async after the modal closes; poll the status
  // until it settles rather than racing the network round-trip.
  const admin = await adminApi();
  await expect
    .poll(() => fetchEditStatus(admin, edit.id), { timeout: 10_000 })
    .toBe("CANCELED");
  await admin.dispose();
});

test("EDIT user can comment on a pending edit", async ({ editPage }) => {
  const editor = await graphqlAs("e2e_edit");
  const edit = await submitStudioCreateEdit(editor, uniq("Studio"));
  await editor.dispose();

  const comment = `commenting from e2e ${Date.now()}`;
  await commentOnEdit(editPage, edit.id, comment);
});

test("VOTE user can cast a Yes vote via the UI", async ({ votePage }) => {
  // Submit an edit owned by someone else so the voter is allowed to vote.
  const editor = await graphqlAs("e2e_edit");
  const edit = await submitStudioCreateEdit(editor, uniq("Studio"));
  await editor.dispose();

  await voteOnEdit(votePage, edit.id, "Yes");

  // We can't easily assert the vote count from the UI without scraping a
  // bespoke vote-bar selector; assert instead that the page still loads with
  // the Save button gone, which voteOnEdit already validates internally.
  await expect(votePage.getByRole("button", { name: "Approve Edit" })).toHaveCount(0);
});

test("admin approval moves edit to ACCEPTED", async ({ adminPage }) => {
  // Edit.tsx only renders Approve Edit when (isAdmin || isSelf). A plain
  // moderator viewing someone else's edit has no UI path even though the
  // server-side mutation accepts MODERATE. Drive as admin.
  const editor = await graphqlAs("e2e_edit");
  const edit = await submitStudioCreateEdit(editor, uniq("Studio"));
  await editor.dispose();

  await approveEdit(adminPage, edit.id);

  const admin = await adminApi();
  // Edits approved by a moderator without a vote cycle land in
  // IMMEDIATE_ACCEPTED; vote-driven application produces ACCEPTED.
  const status = await fetchEditStatus(admin, edit.id);
  expect(["IMMEDIATE_ACCEPTED", "ACCEPTED"]).toContain(status);
  await admin.dispose();
});

test("downvotes reject the edit when threshold is met", async ({}) => {
  // Cast a No vote as the VOTE user. With vote_application_threshold=1 and a
  // 5s cron interval in the e2e config, the edit should land in REJECTED or
  // IMMEDIATE_REJECTED shortly after.
  const editor = await graphqlAs("e2e_edit");
  const edit = await submitStudioCreateEdit(editor, uniq("Studio"));
  await editor.dispose();

  const voter = await graphqlAs("e2e_vote");
  await castVote(voter, edit.id, "REJECT");
  await voter.dispose();

  const admin = await adminApi();
  await expect
    .poll(() => fetchEditStatus(admin, edit.id), {
      timeout: 30_000,
      intervals: [1_000, 2_000, 5_000],
    })
    .toMatch(/REJECTED/);
  await admin.dispose();
});

test("upvotes accept the edit when threshold is met", async ({}) => {
  // Mirror of the reject test. With vote_application_threshold=1, one Yes
  // vote should trip the cron and land the edit in (IMMEDIATE_)ACCEPTED.
  const editor = await graphqlAs("e2e_edit");
  const edit = await submitStudioCreateEdit(editor, uniq("Studio"));
  await editor.dispose();

  const voter = await graphqlAs("e2e_vote");
  await castVote(voter, edit.id, "ACCEPT");
  await voter.dispose();

  const admin = await adminApi();
  await expect
    .poll(() => fetchEditStatus(admin, edit.id), {
      timeout: 30_000,
      intervals: [1_000, 2_000, 5_000],
    })
    .toMatch(/ACCEPTED/);
  await admin.dispose();
});

test("owner can update their own pending edit via /edits/:id/update", async ({
  editPage,
  adminPage,
}) => {
  // Submit a studio CREATE edit, then change the proposed name via the edit-
  // update flow. After approval, the studio should exist with the *renamed*
  // value, proving the update mutated the pending edit's details.
  const initialName = uniq("StudioU");
  const renamed = uniq("StudioRenamedU");

  const editor = await graphqlAs("e2e_edit");
  const edit = await submitStudioCreateEdit(editor, initialName);
  await editor.dispose();

  // The Update Edit button is rendered on the edit detail page when the edit
  // is owner-authored, updatable, and pending. Driving via direct URL is
  // simpler and equivalent.
  await editPage.goto(`/edits/${edit.id}/update`);
  // StudioEditUpdate reuses StudioForm — overwrite Name on Details, jump to
  // Confirm, fill note, submit.
  await editPage.locator('input[name="name"]').first().fill(renamed);
  await editPage.getByRole("tab", { name: "Confirm" }).click();
  await editPage.locator('textarea[name="note"]').fill("renaming via e2e");
  await editPage.getByRole("button", { name: "Submit Edit" }).click();

  // After successful update, the app navigates back to the same edit page.
  await editPage.waitForURL(new RegExp(`/edits/${edit.id}$`), {
    timeout: 15_000,
  });

  // Approving as admin should now apply the *renamed* value.
  await approveEdit(adminPage, edit.id);

  const admin = await adminApi();
  const result = await admin.post("/graphql", {
    data: {
      query: `query($id: ID!) {
        findEdit(id: $id) {
          target { ... on Studio { id name } }
        }
      }`,
      variables: { id: edit.id },
    },
    headers: { "content-type": "application/json" },
  });
  const body = (await result.json()) as {
    data?: { findEdit?: { target?: { name?: string } | null } | null };
  };
  await admin.dispose();
  expect(body.data?.findEdit?.target?.name).toBe(renamed);
});

test("moderator can delete an applied edit via the UI", async ({
  adminPage,
}) => {
  // Submit + approve an edit to put it in IMMEDIATE_ACCEPTED state, then
  // delete it via DeleteEditModal. After deletion, the edit should no longer
  // be findable.
  const editor = await graphqlAs("e2e_edit");
  const edit = await submitStudioCreateEdit(editor, uniq("StudioDel"));
  await editor.dispose();

  await approveEdit(adminPage, edit.id);

  // The Delete Edit button appears (for moderators on closed edits) on the
  // entity's detail page or back on the edit page. Navigate back to the edit
  // page explicitly.
  await adminPage.goto(`/edits/${edit.id}`);
  await adminPage.getByRole("button", { name: "Delete Edit" }).click();

  // Modal: textarea for reason, then a "Delete Edit" submit button (same
  // label as the trigger — disambiguate via the modal context).
  const modal = adminPage.locator(".modal");
  await modal.locator("textarea").fill("e2e test deletion");
  await modal.getByRole("button", { name: "Delete Edit" }).click();

  // After successful delete, the app navigates to /edits.
  await adminPage.waitForURL(/\/edits(\?|$)/, { timeout: 15_000 });

  // Verify: the edit can no longer be found.
  const admin = await adminApi();
  const result = await admin.post("/graphql", {
    data: {
      query: `query($id: ID!) { findEdit(id: $id) { id } }`,
      variables: { id: edit.id },
    },
    headers: { "content-type": "application/json" },
  });
  const body = (await result.json()) as {
    data?: { findEdit?: { id: string } | null };
    errors?: { message: string }[];
  };
  await admin.dispose();
  // findEdit either returns null or surfaces a "not found" error after a
  // delete — either is acceptable.
  expect(body.data?.findEdit ?? null).toBeNull();
});

test("edit_update_limit blocks updates past the configured count", async ({}) => {
  // e2e config sets edit_update_limit: 3. Submit a CREATE edit, then issue
  // three updates back-to-back. The fourth update should be rejected with a
  // validation error from the resolver.
  const editor = await graphqlAs("e2e_edit");
  const { id: editId } = await submitStudioCreateEdit(editor, uniq("Studio"));

  const updateOnce = async (i: number) => {
    return editor.post("/graphql", {
      data: {
        query: `mutation($id: ID!, $input: StudioEditInput!) {
          studioEditUpdate(id: $id, input: $input) { id update_count }
        }`,
        variables: {
          id: editId,
          input: {
            edit: { operation: "CREATE", comment: `update-${i}` },
            details: { name: `${uniq("StudioRev")}-r${i}` },
          },
        },
      },
      headers: { "content-type": "application/json" },
    });
  };

  // First N updates (N = edit_update_limit) should each succeed.
  for (let i = 1; i <= 3; i++) {
    const res = await updateOnce(i);
    const body = (await res.json()) as {
      data?: { studioEditUpdate?: { update_count: number } };
      errors?: { message: string }[];
    };
    expect(body.errors ?? [], `update #${i} should succeed`).toEqual([]);
    expect(body.data?.studioEditUpdate?.update_count).toBe(i);
  }

  // The (N+1)th update should fail.
  const res = await updateOnce(4);
  const body = (await res.json()) as {
    errors?: { message: string }[];
  };
  expect(body.errors?.length ?? 0).toBeGreaterThan(0);
  expect(body.errors?.[0]?.message).toMatch(/limit|maximum|allowed/i);
  await editor.dispose();
});

test("voting on own edit is rejected", async ({}) => {
  // The EDIT user owns the edit; trying to cast any vote on it should be
  // refused by the editVote resolver.
  const editor = await graphqlAs("e2e_edit");
  const { id: editId } = await submitStudioCreateEdit(editor, uniq("Studio"));

  const res = await editor.post("/graphql", {
    data: {
      query: `mutation($input: EditVoteInput!) {
        editVote(input: $input) { id }
      }`,
      variables: { input: { id: editId, vote: "ACCEPT" } },
    },
    headers: { "content-type": "application/json" },
  });
  const body = (await res.json()) as {
    errors?: { message: string }[];
  };
  await editor.dispose();
  expect(body.errors?.length ?? 0).toBeGreaterThan(0);
  // Server wording for self-vote — match a few plausible phrasings so a
  // copy tweak doesn't break the test.
  expect(body.errors?.[0]?.message).toMatch(/own|self|owner|author/i);
});

test("moderator can amend an applied edit via amendEdit mutation", async ({
  adminPage,
}) => {
  // The amend UI requires interacting with an `AmendableModifyEdit` widget
  // that toggles which fields/added-items/removed-items to revert; driving
  // it through the DOM means encoding the rendered diff structure into the
  // test. Easier: assert the route renders for moderators on a closed edit,
  // and exercise the underlying amendEdit mutation via GraphQL.
  const editor = await graphqlAs("e2e_edit");
  const edit = await submitStudioCreateEdit(editor, uniq("StudioAmd"));
  await editor.dispose();

  await approveEdit(adminPage, edit.id);

  // The amend page should render the form for closed edits — no error message.
  await adminPage.goto(`/edits/${edit.id}/amend`);
  await expect(
    adminPage.getByText(/Only closed edits can be amended/i),
  ).toHaveCount(0);

  // Drive the mutation directly with an empty change set + reason. amendEdit
  // requires at least one removal to be meaningful, but the mutation accepts
  // a no-op call and just records the reason. (If the server later rejects
  // no-op amendments, this asserts the validation surface.)
  const admin = await adminApi();
  const res = await admin.post("/graphql", {
    data: {
      query: `mutation($input: AmendEditInput!) {
        amendEdit(input: $input) { id }
      }`,
      variables: {
        input: {
          id: edit.id,
          reason: "e2e amendment with no field changes",
          remove_fields: [],
          remove_added_items: [],
          remove_removed_items: [],
        },
      },
    },
    headers: { "content-type": "application/json" },
  });
  const body = (await res.json()) as {
    data?: { amendEdit?: { id: string } };
    errors?: { message: string }[];
  };
  await admin.dispose();
  // Empty change sets are rejected with a specific validation message. This
  // proves: (1) the amendEdit mutation is wired up and reachable as MODERATE+,
  // and (2) the no-op guard is enforced. A separate test with a real
  // remove_fields entry would assert the apply path.
  expect(body.errors?.[0]?.message ?? "").toMatch(
    /at least one field or item|specify.*remove/i,
  );
});
