import { screen, waitFor } from "@testing-library/react";
import type { FC } from "react";
import ImageLightbox from "src/components/image/ImageLightbox";
import {
  type ImageFragment,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  ImageTypeScopeEnum,
  RoleEnum,
} from "src/graphql";
import SetImageOrganizedGQL from "src/graphql/mutations/SetImageOrganized.gql";
import UpdateImageGQL from "src/graphql/mutations/UpdateImage.gql";
import ImageTypeGroupsGQL from "src/graphql/queries/ImageTypeGroups.gql";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it } from "vitest";

import { useDirectLabelEditor } from "../useDirectLabelEditor";

const reader = {
  authenticated: true,
  user: { id: "read-1", name: "reader", roles: [RoleEnum.READ] },
};
const editor = {
  authenticated: true,
  user: { id: "edit-1", name: "editor", roles: [RoleEnum.EDIT] },
};
const moderator = {
  authenticated: true,
  user: {
    id: "mod-1",
    name: "mod",
    roles: [RoleEnum.EDIT, RoleEnum.MODERATE],
  },
};

const vocabulary = {
  request: {
    query: ImageTypeGroupsGQL,
    variables: { target: ImageTypeScopeEnum.PERFORMER, includeDisabled: true },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      imageTypeGroups: [
        {
          __typename: "ImageTypeGroup" as const,
          key: ImageTypeGroupEnum.SHOT,
          name: "Style",
          description: null,
          enabled: true,
          types: [
            {
              __typename: "ImageType" as const,
              key: ImageTypeEnum.SHOT_PORTRAIT,
              name: "Portrait",
              description: null,
              enabled: true,
              conflicts_with: [],
              crop_template: null,
            },
          ],
        },
      ],
    },
  },
};

const image = (id: string, organized = false): ImageFragment => ({
  __typename: "Image" as const,
  id,
  url: `https://example.com/${id}.jpg`,
  width: 800,
  height: 1200,
  types: [],
  date: null,
  organized,
  originalImage: null,
});

const Gallery: FC<{ images: ImageFragment[] }> = ({ images }) => {
  const { renderEditor, editorLabel, confirmLeave, leavePrompt } =
    useDirectLabelEditor(ImageTypeScopeEnum.PERFORMER, images);
  return (
    <>
      <ImageLightbox
        images={images}
        renderEditor={renderEditor}
        editorLabel={editorLabel}
        confirmLeave={confirmLeave}
        onClose={() => {}}
      />
      {leavePrompt}
    </>
  );
};

const leaveQuestion = /Leave without applying them\?/;
const thumb = (index: number) =>
  document.querySelectorAll(".ImageLightbox-thumb")[index] as HTMLElement;

describe("useDirectLabelEditor leaving with pending labels", () => {
  it("asks before moving off an image with a label picked but not applied", async () => {
    const { user } = renderForm(<Gallery images={[image("a"), image("b")]} />, {
      auth: editor,
      mocks: [vocabulary],
    });

    await user.click(await screen.findByLabelText("Portrait"));
    await user.click(thumb(1));

    expect(await screen.findByText(leaveQuestion)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Stay" }));
    expect(screen.getByLabelText("Portrait")).toBeChecked();
  });

  it("drops the picked label when leaving anyway", async () => {
    const { user } = renderForm(<Gallery images={[image("a"), image("b")]} />, {
      auth: editor,
      mocks: [vocabulary],
    });

    await user.click(await screen.findByLabelText("Portrait"));
    await user.click(thumb(1));
    await user.click(await screen.findByRole("button", { name: "Leave" }));

    await user.click(thumb(0));
    expect(await screen.findByLabelText("Portrait")).not.toBeChecked();
    await user.click(thumb(1));
    expect(screen.queryByText(leaveQuestion)).toBeNull();
  });

  it("does not ask when nothing is pending", async () => {
    const { user } = renderForm(<Gallery images={[image("a"), image("b")]} />, {
      auth: editor,
      mocks: [vocabulary],
    });

    await screen.findByLabelText("Portrait");
    await user.click(thumb(1));
    expect(screen.queryByText(leaveQuestion)).toBeNull();
  });
});

describe("useDirectLabelEditor organized mark", () => {
  it("applies a pending label before setting the mark", async () => {
    let applied = false;
    const { user } = renderForm(<Gallery images={[image("a")]} />, {
      auth: moderator,
      mocks: [
        vocabulary,
        {
          request: {
            query: UpdateImageGQL,
            variables: {
              imageData: {
                id: "a",
                types: [ImageTypeEnum.SHOT_PORTRAIT],
                date: null,
              },
            },
          },
          result: () => {
            applied = true;
            return {
              data: {
                imageUpdate: {
                  ...image("a"),
                  types: [ImageTypeEnum.SHOT_PORTRAIT],
                },
              },
            };
          },
        },
        {
          request: {
            query: SetImageOrganizedGQL,
            variables: { input: { id: "a", organized: true } },
          },
          result: () => {
            expect(applied).toBe(true);
            return {
              data: {
                imageSetOrganized: {
                  ...image("a", true),
                  types: [ImageTypeEnum.SHOT_PORTRAIT],
                },
              },
            };
          },
        },
      ],
    });

    await user.click(await screen.findByLabelText("Portrait"));
    await user.click(screen.getByRole("checkbox", { name: "Organized" }));

    await waitFor(() => expect(applied).toBe(true));
  });
});

describe("useDirectLabelEditor for a viewer without EDIT", () => {
  it("shows the labels and date as a readout, with nothing to change", async () => {
    const labelled = {
      ...image("a"),
      types: [ImageTypeEnum.SHOT_PORTRAIT],
      date: "2021-05",
    };
    renderForm(<Gallery images={[labelled]} />, {
      auth: reader,
      mocks: [vocabulary],
    });

    const panel = await screen.findByRole("group", {
      name: "Image classification and date",
    });
    const summaries = panel.querySelectorAll(".ImageLabels-summary");
    expect(summaries[0]?.textContent).toContain("Portrait");
    expect(summaries[1]?.textContent).toContain("2021-05");
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByLabelText("Image date")).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Organized" })).toBeNull();
  });

  it("shows no panel for an unlabelled image", async () => {
    renderForm(<Gallery images={[image("a")]} />, {
      auth: reader,
      mocks: [vocabulary],
    });

    await screen.findByText("800×1200");
    expect(document.querySelector(".ImageLightbox-editor")).toBeNull();
  });
});
