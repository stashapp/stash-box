// Cross-role authorization grid. For each role, assert that the user is
// denied operations they shouldn't have. Driven against GraphQL because
// scraping the UI for hidden buttons is brittle — the directive layer is the
// real source of truth.
//
// If a role should NOT be allowed to call a mutation, expect a "unauthorized"
// (or similar) error. If they SHOULD be allowed, expect no error.

import { test, expect } from "../../support/fixtures";
import { graphqlAs } from "../../support/helpers/graphql";
import { adminApi, submitStudioCreateEdit, uniq } from "../../support/helpers/seed";

type Role = "read" | "vote" | "edit" | "modify" | "moderate";

const ALL_ROLES: Role[] = ["read", "vote", "edit", "modify", "moderate"];

const USERNAME: Record<Role, string> = {
  read: "e2e_read",
  vote: "e2e_vote",
  edit: "e2e_edit",
  modify: "e2e_modify",
  moderate: "e2e_moderate",
};

// Roles that ARE allowed to do each thing. RoleEnum.Implies (in
// internal/models/extension_role_enum.go) only escalates ADMIN — every other
// role implies itself + READ, nothing more. Users in the seed mostly get the
// single matching role, except `e2e_moderate` which is granted both MODERATE
// and EDIT (moderators need to be able to submit edits in the typical
// workflow), so it shows up wherever EDIT or MODERATE is required.
const ALLOWED: Record<string, Role[]> = {
  submitStudioEdit: ["edit", "moderate"], // requires EDIT
  voteOnEdit: ["vote"], // requires VOTE
  approveEdit: ["moderate"], // requires MODERATE
  studioCreateDirect: ["modify"], // requires MODIFY
  tagCategoryCreate: [], // requires ADMIN; none of these role-only users have it
  queryUsers: [], // requires ADMIN
};

async function tryCall(
  role: Role,
  mutation: string,
  variables: Record<string, unknown>,
): Promise<boolean /* succeeded */> {
  const api = await graphqlAs(USERNAME[role]);
  const res = await api.post("/graphql", {
    data: { query: mutation, variables },
    headers: { "content-type": "application/json" },
  });
  // Auth middleware can return a 401 with a plain-text body before the
  // request ever reaches the GraphQL handler; in that case there's no JSON
  // to parse and we treat it as a denial.
  if (!res.ok()) {
    await api.dispose();
    return false;
  }
  const text = await res.text();
  let body: { errors?: unknown[] } = {};
  try {
    body = JSON.parse(text);
  } catch {
    await api.dispose();
    return false;
  }
  await api.dispose();
  return !body.errors?.length;
}

function describeOp(
  name: keyof typeof ALLOWED,
  mutation: string,
  variables: () => Promise<Record<string, unknown>>,
) {
  test.describe(`@${name}`, () => {
    for (const role of ALL_ROLES) {
      const shouldAllow = ALLOWED[name].includes(role);
      test(`${role} role is ${shouldAllow ? "allowed" : "denied"}`, async () => {
        const succeeded = await tryCall(role, mutation, await variables());
        expect(succeeded).toBe(shouldAllow);
      });
    }
  });
}

describeOp(
  "submitStudioEdit",
  `mutation($input: StudioEditInput!) {
     studioEdit(input: $input) { id }
   }`,
  async () => ({
    input: { edit: { operation: "CREATE" }, details: { name: uniq("Studio") } },
  }),
);

describeOp(
  "studioCreateDirect",
  `mutation($input: StudioCreateInput!) {
     studioCreate(input: $input) { id }
   }`,
  async () => ({ input: { name: uniq("Studio") } }),
);

describeOp(
  "tagCategoryCreate",
  `mutation($input: TagCategoryCreateInput!) {
     tagCategoryCreate(input: $input) { id }
   }`,
  async () => ({ input: { name: uniq("cat"), group: "SCENE" } }),
);

describeOp(
  "queryUsers",
  `query { queryUsers(input: { page: 1, per_page: 1 }) { count } }`,
  async () => ({}),
);

// Vote + approve need a fresh pending edit per-test, so we set it up lazily.
test.describe("@voteOnEdit", () => {
  for (const role of ALL_ROLES) {
    const shouldAllow = ALLOWED.voteOnEdit.includes(role);
    test(`${role} role is ${shouldAllow ? "allowed" : "denied"}`, async () => {
      const editor = await graphqlAs("e2e_edit");
      const { id } = await submitStudioCreateEdit(editor, uniq("Studio"));
      await editor.dispose();
      const succeeded = await tryCall(
        role,
        `mutation($input: EditVoteInput!) {
           editVote(input: $input) { id }
         }`,
        { input: { id, vote: "ACCEPT" } },
      );
      expect(succeeded).toBe(shouldAllow);
    });
  }
});

test.describe("@approveEdit", () => {
  for (const role of ALL_ROLES) {
    const shouldAllow = ALLOWED.approveEdit.includes(role);
    test(`${role} role is ${shouldAllow ? "allowed" : "denied"}`, async () => {
      const editor = await graphqlAs("e2e_edit");
      const { id } = await submitStudioCreateEdit(editor, uniq("Studio"));
      await editor.dispose();
      const succeeded = await tryCall(
        role,
        `mutation($input: ApproveEditInput!) {
           approveEdit(input: $input) { id }
         }`,
        { input: { id } },
      );
      expect(succeeded).toBe(shouldAllow);
    });
  }
});

// Sanity check: ADMIN can do everything via the admin API context.
test("admin can perform all the mutations above", async () => {
  const admin = await adminApi();
  const mutations: [string, Record<string, unknown>][] = [
    [
      `mutation($input: StudioEditInput!) { studioEdit(input: $input) { id } }`,
      {
        input: {
          edit: { operation: "CREATE" },
          details: { name: uniq("Studio") },
        },
      },
    ],
    [
      `mutation($input: StudioCreateInput!) { studioCreate(input: $input) { id } }`,
      { input: { name: uniq("Studio") } },
    ],
    [
      `mutation($input: TagCategoryCreateInput!) { tagCategoryCreate(input: $input) { id } }`,
      { input: { name: uniq("cat"), group: "SCENE" } },
    ],
    [
      `query { queryUsers(input: { page: 1, per_page: 1 }) { count } }`,
      {},
    ],
  ];
  for (const [q, v] of mutations) {
    const res = await admin.post("/graphql", {
      data: { query: q, variables: v },
      headers: { "content-type": "application/json" },
    });
    const body = (await res.json()) as { errors?: unknown[] };
    expect(body.errors ?? []).toEqual([]);
  }
  await admin.dispose();
});
