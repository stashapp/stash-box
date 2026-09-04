import { screen, waitFor, within } from "@testing-library/react";
import { largestCenteredRect } from "src/components/cropFrame";
import {
  type ImageFragment,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  type ImageTypeGroupsQuery,
} from "src/graphql";
import RecropImageGQL from "src/graphql/mutations/RecropImage.gql";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it, vi } from "vitest";

import RecropEditor from "../RecropEditor";

type Groups = ImageTypeGroupsQuery["imageTypeGroups"];

const image = (types: ImageTypeEnum[]): ImageFragment => ({
  __typename: "Image" as const,
  id: "img-1",
  url: "https://example.com/img-1.jpg",
  width: 800,
  height: 1200,
  types,
  date: null,
});

const groupsWithTemplate = (aspectRatio: number): Groups => [
  {
    __typename: "ImageTypeGroup" as const,
    enabled: true,
    key: ImageTypeGroupEnum.CROP,
    name: "Crop",
    description: null,
    types: [
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.CROP_FACE,
        name: "Face",
        description: null,
        conflicts_with: [],
        crop_template: {
          __typename: "CropTemplate" as const,
          aspect_ratio: aspectRatio,
          guides: [],
        },
      },
    ],
  },
];

describe("RecropEditor", () => {
  it("draws the crop frame for the given image", () => {
    renderForm(
      <RecropEditor
        image={image([])}
        groups={[]}
        isModerator={false}
        typesCommitted={false}
        dateCommitted={false}
        canAddAsNew
        onClose={vi.fn()}
        onRecropped={vi.fn()}
      />,
    );

    expect(document.querySelector(".CropFrame")).not.toBeNull();
  });

  // Nothing to save until the frame differs from the whole picture: a
  // re-crop that changes nothing is not an action worth sending.
  it("disables saving until the frame is not the full picture", () => {
    renderForm(
      <RecropEditor
        image={image([])}
        groups={[]}
        isModerator={false}
        typesCommitted={false}
        dateCommitted={false}
        canAddAsNew
        onClose={vi.fn()}
        onRecropped={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Save crop" })).toBeDisabled();
  });

  // Re-cropping defaults to the template the image is already labelled with,
  // so the frame starts pre-shaped rather than at a bare full frame -- which
  // is itself already a savable crop, since the template's aspect ratio
  // (square) differs from the image's own (2:3).
  it("starts from the template the image is already labelled with", () => {
    renderForm(
      <RecropEditor
        image={image([ImageTypeEnum.CROP_FACE])}
        groups={groupsWithTemplate(1)}
        isModerator={false}
        typesCommitted={false}
        dateCommitted={false}
        canAddAsNew
        onClose={vi.fn()}
        onRecropped={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Save crop" })).toBeEnabled();
  });

  // The label editor is unreachable once the crop editor replaces it in the
  // lightbox, so a label picked but never separately applied has no other
  // way to reach the server: it has to ride along on the crop mutation
  // itself. `image.types`/`image.date` are exactly what editImages.tsx's
  // openRecrop hands this component -- this sitting's current values,
  // applied or not. Moderator, so nothing here locks and the warning modal
  // stays out of the way -- that flow has its own tests below.
  it("sends the image's current labels and date along with the crop", async () => {
    const rect = largestCenteredRect(1, 800 / 1200);
    const onRecropped = vi.fn();
    const { user } = renderForm(
      <RecropEditor
        image={{ ...image([ImageTypeEnum.CROP_FACE]), date: "2021-05" }}
        groups={groupsWithTemplate(1)}
        isModerator
        typesCommitted={false}
        dateCommitted={false}
        canAddAsNew
        onClose={vi.fn()}
        onRecropped={onRecropped}
      />,
      {
        mocks: [
          {
            // Proof the label/date actually rode along: MockedProvider only
            // resolves on an exact variables match.
            request: {
              query: RecropImageGQL,
              variables: {
                imageData: {
                  image_id: "img-1",
                  crop: rect,
                  types: [ImageTypeEnum.CROP_FACE],
                  date: "2021-05",
                },
              },
            },
            result: {
              data: {
                imageRecrop: {
                  __typename: "Image" as const,
                  id: "img-2",
                  url: "https://example.com/img-2.jpg",
                  width: 800,
                  height: 800,
                  types: [ImageTypeEnum.CROP_FACE],
                  date: "2021-05",
                },
              },
            },
          },
        ],
      },
    );

    await user.click(screen.getByRole("button", { name: "Save crop" }));

    await waitFor(() =>
      expect(onRecropped).toHaveBeenCalledWith(
        expect.objectContaining({ id: "img-2" }),
        false,
      ),
    );
  });

  describe("adding as new instead of replacing", () => {
    it("hides the choice when there is no room for another image", () => {
      renderForm(
        <RecropEditor
          image={image([])}
          groups={[]}
          isModerator={false}
          typesCommitted={false}
          dateCommitted={false}
          canAddAsNew={false}
          onClose={vi.fn()}
          onRecropped={vi.fn()}
        />,
      );

      expect(
        screen.queryByRole("checkbox", { name: "Add as a new image" }),
      ).not.toBeInTheDocument();
    });

    it("reports addAsNew once the checkbox is ticked", async () => {
      const rect = largestCenteredRect(1, 800 / 1200);
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={image([ImageTypeEnum.CROP_FACE])}
          groups={groupsWithTemplate(1)}
          isModerator
          typesCommitted={false}
          dateCommitted={false}
          canAddAsNew
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
        {
          mocks: [
            {
              request: {
                query: RecropImageGQL,
                variables: {
                  imageData: {
                    image_id: "img-1",
                    crop: rect,
                    types: [ImageTypeEnum.CROP_FACE],
                    date: null,
                  },
                },
              },
              result: {
                data: {
                  imageRecrop: {
                    __typename: "Image" as const,
                    id: "img-2",
                    url: "https://example.com/img-2.jpg",
                    width: 800,
                    height: 800,
                    types: [ImageTypeEnum.CROP_FACE],
                    date: null,
                  },
                },
              },
            },
          ],
        },
      );

      await user.click(
        screen.getByRole("checkbox", { name: "Add as a new image" }),
      );
      await user.click(
        screen.getByRole("button", { name: "Save as new image" }),
      );

      await waitFor(() =>
        expect(onRecropped).toHaveBeenCalledWith(
          expect.objectContaining({ id: "img-2" }),
          true,
        ),
      );
    });

    // A source image whose types/date are already locked from an earlier
    // save is still a fresh, uncommitted row once it lands somewhere new --
    // the warning has to judge the row being created, not the row being
    // copied from.
    it("still asks before locking a non-moderator's new row, even if the source is already locked", async () => {
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={image([ImageTypeEnum.CROP_FACE])}
          groups={groupsWithTemplate(1)}
          isModerator={false}
          typesCommitted
          dateCommitted={false}
          canAddAsNew
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
      );

      await user.click(
        screen.getByRole("checkbox", { name: "Add as a new image" }),
      );
      await user.click(
        screen.getByRole("button", { name: "Save as new image" }),
      );

      expect(
        screen.getByText(/only a moderator will be able to/i),
      ).toBeInTheDocument();
      expect(onRecropped).not.toHaveBeenCalled();
    });
  });

  it("closes without saving on Cancel", async () => {
    const onClose = vi.fn();
    const { user } = renderForm(
      <RecropEditor
        image={image([])}
        groups={[]}
        isModerator={false}
        typesCommitted={false}
        dateCommitted={false}
        canAddAsNew
        onClose={onClose}
        onRecropped={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // The crop carries the image's current labels/date along atomically, so
  // saving one locks them for a non-moderator exactly as Apply does --
  // nothing about the crop control itself hints at that, so it's worth
  // confirming before it happens.
  describe("warning before a lock", () => {
    it("asks before saving a crop that would lock in labels", async () => {
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={image([ImageTypeEnum.CROP_FACE])}
          groups={groupsWithTemplate(1)}
          isModerator={false}
          typesCommitted={false}
          dateCommitted={false}
          canAddAsNew
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Save crop" }));

      expect(
        screen.getByText(/only a moderator will be able to/i),
      ).toBeInTheDocument();
      expect(onRecropped).not.toHaveBeenCalled();
    });

    it("saves once the warning is confirmed", async () => {
      const rect = largestCenteredRect(1, 800 / 1200);
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={image([ImageTypeEnum.CROP_FACE])}
          groups={groupsWithTemplate(1)}
          isModerator={false}
          typesCommitted={false}
          dateCommitted={false}
          canAddAsNew
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
        {
          mocks: [
            {
              request: {
                query: RecropImageGQL,
                variables: {
                  imageData: {
                    image_id: "img-1",
                    crop: rect,
                    types: [ImageTypeEnum.CROP_FACE],
                    date: null,
                  },
                },
              },
              result: {
                data: {
                  imageRecrop: {
                    __typename: "Image" as const,
                    id: "img-2",
                    url: "https://example.com/img-2.jpg",
                    width: 800,
                    height: 800,
                    types: [ImageTypeEnum.CROP_FACE],
                    date: null,
                  },
                },
              },
            },
          ],
        },
      );

      await user.click(screen.getByRole("button", { name: "Save crop" }));
      const dialog = screen.getByRole("dialog");
      await user.click(
        within(dialog).getByRole("button", { name: "Save crop" }),
      );

      await waitFor(() => expect(onRecropped).toHaveBeenCalledTimes(1));
    });

    it("saves nothing and keeps editing on Cancel", async () => {
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={image([ImageTypeEnum.CROP_FACE])}
          groups={groupsWithTemplate(1)}
          isModerator={false}
          typesCommitted={false}
          dateCommitted={false}
          canAddAsNew
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Save crop" }));
      const dialog = screen.getByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

      await waitFor(() =>
        expect(
          screen.queryByText(/only a moderator will be able to/i),
        ).not.toBeInTheDocument(),
      );
      expect(onRecropped).not.toHaveBeenCalled();
      // Still on the crop editor itself, not closed
      expect(document.querySelector(".CropFrame")).not.toBeNull();
    });

    it("does not ask a moderator, who is never locked out", async () => {
      const rect = largestCenteredRect(1, 800 / 1200);
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={image([ImageTypeEnum.CROP_FACE])}
          groups={groupsWithTemplate(1)}
          isModerator
          typesCommitted={false}
          dateCommitted={false}
          canAddAsNew
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
        {
          mocks: [
            {
              request: {
                query: RecropImageGQL,
                variables: {
                  imageData: {
                    image_id: "img-1",
                    crop: rect,
                    types: [ImageTypeEnum.CROP_FACE],
                    date: null,
                  },
                },
              },
              result: {
                data: {
                  imageRecrop: {
                    __typename: "Image" as const,
                    id: "img-2",
                    url: "https://example.com/img-2.jpg",
                    width: 800,
                    height: 800,
                    types: [ImageTypeEnum.CROP_FACE],
                    date: null,
                  },
                },
              },
            },
          ],
        },
      );

      await user.click(screen.getByRole("button", { name: "Save crop" }));

      await waitFor(() => expect(onRecropped).toHaveBeenCalledTimes(1));
    });

    it("does not ask when types are already locked", async () => {
      const rect = largestCenteredRect(1, 800 / 1200);
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={image([ImageTypeEnum.CROP_FACE])}
          groups={groupsWithTemplate(1)}
          isModerator={false}
          typesCommitted
          dateCommitted={false}
          canAddAsNew
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
        {
          mocks: [
            {
              request: {
                query: RecropImageGQL,
                variables: {
                  imageData: {
                    image_id: "img-1",
                    crop: rect,
                    types: [ImageTypeEnum.CROP_FACE],
                    date: null,
                  },
                },
              },
              result: {
                data: {
                  imageRecrop: {
                    __typename: "Image" as const,
                    id: "img-2",
                    url: "https://example.com/img-2.jpg",
                    width: 800,
                    height: 800,
                    types: [ImageTypeEnum.CROP_FACE],
                    date: null,
                  },
                },
              },
            },
          ],
        },
      );

      await user.click(screen.getByRole("button", { name: "Save crop" }));

      await waitFor(() => expect(onRecropped).toHaveBeenCalledTimes(1));
    });
  });
});
