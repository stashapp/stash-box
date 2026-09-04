import { useLens } from "@hookform/lenses";
import { screen, waitFor, within } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { largestCenteredRect } from "src/components/cropFrame";
import {
  CropGuideAxisEnum,
  CropGuideRoleEnum,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  ImageTypeScopeEnum,
  RoleEnum,
} from "src/graphql";
import RecropImageGQL from "src/graphql/mutations/RecropImage.gql";
import UpdateImageGQL from "src/graphql/mutations/UpdateImage.gql";
import ImageTypeGroupsGQL from "src/graphql/queries/ImageTypeGroups.gql";
import { renderForm } from "src/test/renderForm";
import { afterEach, describe, expect, it, vi } from "vitest";

import EditImages from "../editImages";
import type { TypedImage } from "../types";

/**
 * An image that already exists on the performer, already labelled, opened in
 * the lightbox without editing anything. That is where the guides earn their
 * keep: a template says where the eyes should sit, and there is otherwise no
 * way to see whether they do.
 */

const guides = [
  {
    __typename: "CropGuide" as const,
    axis: CropGuideAxisEnum.Y,
    position: 0.425,
    role: CropGuideRoleEnum.ANCHOR,
    label: "Bisects the eyes",
    pivot: false,
  },
  {
    __typename: "CropGuide" as const,
    axis: CropGuideAxisEnum.X,
    position: 0.5,
    role: CropGuideRoleEnum.REFERENCE,
    label: "Centre",
    pivot: false,
  },
];

const vocabularyMock = {
  request: {
    query: ImageTypeGroupsGQL,
    variables: {
      target: ImageTypeScopeEnum.PERFORMER,
      includeDisabled: true,
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      imageTypeGroups: [
        {
          __typename: "ImageTypeGroup" as const,
          key: ImageTypeGroupEnum.CROP,
          name: "Crop",
          description: null,
          enabled: true,
          types: [
            {
              __typename: "ImageType" as const,
              key: ImageTypeEnum.CROP_FACE,
              name: "Face",
              description: null,
              enabled: true,
              conflicts_with: [],
              crop_template: {
                __typename: "CropTemplate" as const,
                aspect_ratio: 2 / 3,
                guides,
              },
            },
            {
              __typename: "ImageType" as const,
              key: ImageTypeEnum.CROP_TORSO,
              name: "Torso",
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

const image = (id: string, types: ImageTypeEnum[]): TypedImage => ({
  image: {
    __typename: "Image" as const,
    id,
    url: `https://example.com/${id}.jpg`,
    width: 800,
    height: 1200,
    types,
    date: null,
  },
  types,
  date: null,
});

const Harness: FC<{ images: TypedImage[]; original?: TypedImage[] }> = ({
  images,
  original,
}) => {
  const { control } = useForm<{ images: TypedImage[] }>({
    defaultValues: { images },
  });
  const lens = useLens({ control });

  return (
    <EditImages
      lens={lens.focus("images").cast<TypedImage[]>()}
      file={undefined}
      setFile={() => {}}
      original={original}
      target={ImageTypeScopeEnum.PERFORMER}
    />
  );
};

// A harness that manages file selection itself, for the tests below that need
// to remove or upload it -- unlike Harness above, which never has one.
const Uploading: FC<{ file: File; target?: ImageTypeScopeEnum }> = ({
  file: initialFile,
  target = ImageTypeScopeEnum.PERFORMER,
}) => {
  const [file, setFile] = useState<File | undefined>(initialFile);
  const { control } = useForm<{ images: TypedImage[] }>({
    defaultValues: { images: [] },
  });
  const lens = useLens({ control });

  return (
    <EditImages
      lens={lens.focus("images").cast<TypedImage[]>()}
      file={file}
      setFile={setFile}
      target={target}
    />
  );
};

// The lightbox is a modal and renders into a portal, so it is not inside the
// render container.
const drawn = () => document.querySelectorAll(".CropOverlay-guide");

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  const [thumbnail] = screen.getAllByRole("button", { name: /image/i });
  await user.click(thumbnail);
};

// Confirms the warning that applying/saving-a-crop as a non-moderator locks
// a field for good. Named by its own title, not by the Apply/Save crop
// button text it shares with the control that opened it -- the lightbox
// itself is also a dialog once this is showing.
const confirmLock = async (user: ReturnType<typeof userEvent.setup>) => {
  const dialog = await screen.findByRole("dialog", { name: /moderator/i });
  await user.click(
    within(dialog).getByRole("button", { name: /^(Apply|Save crop)$/ }),
  );
};

describe("EditImages lightbox guides", () => {
  it("draws the frame an existing image already claims", async () => {
    const { user } = renderForm(
      <Harness images={[image("a", [ImageTypeEnum.CROP_FACE])]} />,
      { mocks: [vocabularyMock] },
    );

    await open(user);

    // Off until asked for: the lightbox is for looking at the photograph.
    const toggle = await screen.findByRole("button", { name: "Show guides" });
    expect(drawn()).toHaveLength(0);

    await user.click(toggle);

    await waitFor(() => expect(drawn()).toHaveLength(guides.length));
    expect(screen.getByText("Bisects the eyes")).toBeInTheDocument();
  });

  // No toggle where there is nothing to toggle, which is the assertion that
  // means something now that guides start hidden either way.
  it("offers nothing to show for an image with no crop", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      mocks: [vocabularyMock],
    });

    await open(user);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: /guides/i })).toBeNull();
  });

  // A crop the instance has no template for is a label, not a frame.
  it("offers nothing to show for a crop with no template", async () => {
    const { user } = renderForm(
      <Harness images={[image("a", [ImageTypeEnum.CROP_TORSO])]} />,
      { mocks: [vocabularyMock] },
    );

    await open(user);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: /guides/i })).toBeNull();
  });
});

// Labels and date reach the server only on Apply, not on every keystroke --
// otherwise the very first label would lock the controls (EDIT cannot touch
// an already-categorized image) before there was ever a chance to also set
// a date, or add a second label, in the same sitting.
describe("EditImages Apply", () => {
  it("does not save anything until Apply is clicked", async () => {
    const { user } = renderForm(
      <Harness images={[image("a", [])]} />,
      // No UpdateImage mock: MockedProvider errors on an unmocked request,
      // so a network call here fails the test even before any assertion does.
      { mocks: [vocabularyMock] },
    );

    await open(user);
    await user.click(await screen.findByLabelText("Face"));

    // The radio shows as picked locally without anything having been sent.
    expect(screen.getByLabelText("Face")).toBeChecked();
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  // Both fields start open on a fresh image, so the button itself is
  // present from the start -- but with nothing picked yet, there is
  // nothing for it to actually send.
  it("is disabled with nothing picked to apply, and enables once something is", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      mocks: [vocabularyMock],
    });

    await open(user);

    expect(await screen.findByRole("button", { name: "Apply" })).toBeDisabled();

    await user.click(await screen.findByLabelText("Face"));

    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  // Picking a label and then changing your mind about it is not the same
  // as never having picked one, but the *state to apply* ends up identical
  // either way -- back to nothing, same as the baseline this image opened
  // with.
  it("goes back to disabled once a picked label is removed again", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      mocks: [vocabularyMock],
    });

    await open(user);
    await user.click(await screen.findByLabelText("Face"));
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();

    await user.click(screen.getByLabelText("None"));

    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  // A date alone is state worth applying too, with no label involved.
  it("is enabled by a date alone, with no label picked", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      mocks: [vocabularyMock],
    });

    await open(user);
    await user.type(await screen.findByLabelText("Image date"), "2021-05");

    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("disables Apply while the date is out of range", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      // No UpdateImage mock: an invalid date reaching the server would fail the test even before any assertion does
      mocks: [vocabularyMock],
    });

    await open(user);
    const dateField = await screen.findByLabelText("Image date");
    await user.type(dateField, "2099-01-01");
    dateField.blur();

    expect(await screen.findByText("Outside of range")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("sends everything changed in one imageUpdate call when applied", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      mocks: [
        vocabularyMock,
        {
          // MockedProvider matches on these exact variables, so a match here
          // is itself proof the pending label reached the server correctly.
          request: {
            query: UpdateImageGQL,
            variables: {
              imageData: {
                id: "a",
                types: [ImageTypeEnum.CROP_FACE],
                date: null,
              },
            },
          },
          result: {
            data: {
              imageUpdate: {
                __typename: "Image" as const,
                id: "a",
                url: "https://example.com/a.jpg",
                width: 800,
                height: 1200,
                types: [ImageTypeEnum.CROP_FACE],
                date: null,
              },
            },
          },
        },
      ],
    });

    await open(user);
    await user.click(await screen.findByLabelText("Face"));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await confirmLock(user);

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Applying..." })).toBeNull(),
    );

    // The field this save actually set locks immediately, the same as a
    // second Apply changing it would be rejected server-side for -- but the
    // date, untouched by this save, is still open, so Apply stays available
    // for it and there is no need to warn that applying locks everything.
    expect(screen.queryByRole("radio", { name: "Face" })).toBeNull();
    expect(
      document.querySelector(".EditImages-labels-summary")?.textContent,
    ).toContain("Face");
    expect(screen.getByLabelText("Image date")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  // Distinct from the case above: this image was already labelled when the
  // form opened (baseline via `original`), not by anything done in this
  // sitting, so labels are blocked from the start rather than only after a
  // save -- but the date, still unset in the baseline, is unaffected by
  // that and stays open for a first EDIT-role save of its own.
  it("keeps a baseline-labelled image's types locked but its date open", async () => {
    const baseline = image("a", [ImageTypeEnum.CROP_FACE]);
    const { user } = renderForm(
      <Harness images={[baseline]} original={[baseline]} />,
      { mocks: [vocabularyMock] },
    );

    await open(user);
    await screen.findByText("Face");

    expect(screen.queryByRole("radio", { name: "Face" })).toBeNull();
    expect(
      document.querySelector(".EditImages-labels-summary")?.textContent,
    ).toContain("Face");
    expect(screen.getByLabelText("Image date")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  // Once both fields are already set in the baseline there is nothing left
  // an EDIT-role session could apply, so the button goes away entirely
  // rather than sitting there disabled.
  it("hides Apply entirely once both fields are already baseline-set", async () => {
    const baseline: TypedImage = {
      ...image("a", [ImageTypeEnum.CROP_FACE]),
      date: "2019-06",
    };
    const { user } = renderForm(
      <Harness images={[baseline]} original={[baseline]} />,
      { mocks: [vocabularyMock] },
    );

    await open(user);
    await screen.findByText("Face");

    expect(screen.queryByRole("radio", { name: "Face" })).toBeNull();
    expect(
      document.querySelector(".EditImages-labels-summary")?.textContent,
    ).toContain("Face");
    expect(screen.queryByLabelText("Image date")).toBeNull();
    expect(
      document.querySelectorAll(".EditImages-labels-summary")[1]?.textContent,
    ).toContain("2019-06");
    expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
  });
});

// Apply looks like any other form submit, but for a non-moderator it is
// one-way: the field it sets cannot be touched again outside moderation.
// Worth a confirmation the button itself gives no hint of needing.
describe("EditImages warns before a lock", () => {
  it("asks before applying a label that would lock in, as a non-moderator", async () => {
    const { user } = renderForm(
      <Harness images={[image("a", [])]} />,
      // No UpdateImage mock: the confirm is never reached, so a network call
      // here would mean the warning failed to block it.
      { mocks: [vocabularyMock] },
    );

    await open(user);
    await user.click(await screen.findByLabelText("Face"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(
      await screen.findByRole("dialog", { name: /moderator/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Face")).toBeChecked();
  });

  it("applies once the warning is confirmed", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      mocks: [
        vocabularyMock,
        {
          request: {
            query: UpdateImageGQL,
            variables: {
              imageData: {
                id: "a",
                types: [ImageTypeEnum.CROP_FACE],
                date: null,
              },
            },
          },
          result: {
            data: {
              imageUpdate: {
                __typename: "Image" as const,
                id: "a",
                url: "https://example.com/a.jpg",
                width: 800,
                height: 1200,
                types: [ImageTypeEnum.CROP_FACE],
                date: null,
              },
            },
          },
        },
      ],
    });

    await open(user);
    await user.click(await screen.findByLabelText("Face"));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await confirmLock(user);

    await waitFor(() =>
      expect(screen.queryByRole("radio", { name: "Face" })).toBeNull(),
    );
  });

  it("leaves the picked label pending and unsaved on Cancel", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      mocks: [vocabularyMock],
    });

    await open(user);
    await user.click(await screen.findByLabelText("Face"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    const dialog = await screen.findByRole("dialog", { name: /moderator/i });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: /moderator/i }),
      ).not.toBeInTheDocument(),
    );
    // Still picked, still unapplied -- Cancel backs out of the confirmation,
    // not the pending choice it was confirming.
    expect(screen.getByLabelText("Face")).toBeChecked();
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("does not warn a moderator, who is never locked out", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      auth: {
        authenticated: true,
        user: { id: "1", name: "mod", roles: [RoleEnum.MODERATE] },
      },
      mocks: [
        vocabularyMock,
        {
          request: {
            query: UpdateImageGQL,
            variables: {
              imageData: {
                id: "a",
                types: [ImageTypeEnum.CROP_FACE],
                date: null,
              },
            },
          },
          result: {
            data: {
              imageUpdate: {
                __typename: "Image" as const,
                id: "a",
                url: "https://example.com/a.jpg",
                width: 800,
                height: 1200,
                types: [ImageTypeEnum.CROP_FACE],
                date: null,
              },
            },
          },
        },
      ],
    });

    await open(user);
    await user.click(await screen.findByLabelText("Face"));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    // No confirmation to get past, and nothing left unsaved to apply --
    // a moderator can keep changing this field afterward, so unlike a
    // non-moderator's Apply, the radio itself stays put.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled(),
    );
    expect(
      screen.queryByRole("dialog", { name: /moderator/i }),
    ).not.toBeInTheDocument();
  });
});

// Switching away from an image with a label picked but not yet applied asks
// first, rather than silently discarding it.
describe("EditImages warns before losing unapplied changes", () => {
  // A failed assertion throws before a test's own mockRestore() runs, which
  // would otherwise leave window.confirm mocked for every test after it.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks before switching to a different image with a label picked but not applied", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { user } = renderForm(
      <Harness images={[image("a", []), image("b", [])]} />,
      { mocks: [vocabularyMock] },
    );

    await open(user);
    await user.click(await screen.findByLabelText("Face"));

    const thumbs = document.querySelectorAll(".ImageLightbox-thumb");
    await user.click(thumbs[1] as HTMLElement);

    expect(confirm).toHaveBeenCalled();
    // Declined, so still on the first image: its picked-but-unapplied radio
    // is still checked, there to be applied or reconsidered.
    expect(screen.getByLabelText("Face")).toBeChecked();
  });

  it("does not ask when there is nothing unapplied", async () => {
    const confirm = vi.spyOn(window, "confirm");
    const { user } = renderForm(
      <Harness images={[image("a", []), image("b", [])]} />,
      { mocks: [vocabularyMock] },
    );

    await open(user);
    const thumbs = document.querySelectorAll(".ImageLightbox-thumb");
    await user.click(thumbs[1] as HTMLElement);

    expect(confirm).not.toHaveBeenCalled();

    confirm.mockRestore();
  });

  it("does not ask again once the picked label has actually been applied", async () => {
    const confirm = vi.spyOn(window, "confirm");
    const { user } = renderForm(
      <Harness images={[image("a", []), image("b", [])]} />,
      {
        mocks: [
          vocabularyMock,
          {
            request: {
              query: UpdateImageGQL,
              variables: {
                imageData: {
                  id: "a",
                  types: [ImageTypeEnum.CROP_FACE],
                  date: null,
                },
              },
            },
            result: {
              data: {
                imageUpdate: {
                  __typename: "Image" as const,
                  id: "a",
                  url: "https://example.com/a.jpg",
                  width: 800,
                  height: 1200,
                  types: [ImageTypeEnum.CROP_FACE],
                  date: null,
                },
              },
            },
          },
        ],
      },
    );

    await open(user);
    await user.click(await screen.findByLabelText("Face"));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await confirmLock(user);
    await waitFor(() =>
      expect(screen.queryByRole("radio", { name: "Face" })).toBeNull(),
    );

    const thumbs = document.querySelectorAll(".ImageLightbox-thumb");
    await user.click(thumbs[1] as HTMLElement);

    expect(confirm).not.toHaveBeenCalled();

    confirm.mockRestore();
  });
});

// A recrop that carries labels/date across atomically (see RecropEditor)
// commits them on the server exactly like a successful Apply would -- an
// EDIT-role session touching either again should be rejected the same way a
// second Apply already is. That has to be tracked locally too, under the
// *new* row's id, or the controls for it keep showing as usable when the
// server would actually refuse the request.
describe("EditImages controls after an atomic label+crop", () => {
  it("locks the label editor and hides Re-crop for the new row once its fields are committed", async () => {
    // Square, unlike the other fixtures here: Face's 2:3 template needs to
    // actually differ from the image's own proportions, or the crop starts
    // out already matching the whole picture and Save crop never enables.
    const square: TypedImage = {
      image: {
        __typename: "Image" as const,
        id: "a",
        url: "https://example.com/a.jpg",
        width: 1000,
        height: 1000,
        types: [],
        date: null,
      },
      types: [],
      date: null,
    };
    const rect = largestCenteredRect(2 / 3, 1);

    const { user } = renderForm(<Harness images={[square]} />, {
      mocks: [
        vocabularyMock,
        {
          // Proof the label and date actually rode along with the crop:
          // MockedProvider only resolves on an exact variables match.
          request: {
            query: RecropImageGQL,
            variables: {
              imageData: {
                image_id: "a",
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
                id: "b",
                url: "https://example.com/b.jpg",
                width: 700,
                height: 1050,
                types: [ImageTypeEnum.CROP_FACE],
                date: "2021-05",
              },
            },
          },
        },
      ],
    });

    await open(user);
    await user.click(await screen.findByLabelText("Face"));
    await user.type(screen.getByLabelText("Image date"), "2021-05");

    await user.click(await screen.findByRole("button", { name: "Re-crop" }));
    await user.click(await screen.findByRole("button", { name: "Save crop" }));
    await confirmLock(user);

    // The gallery entry is keyed by image id (editImages.tsx), so swapping
    // in the new row remounts it and the lightbox -- which owns its
    // open/closed state locally -- closes rather than following along.
    // "Go back to the image" is exactly this: close, then reopen it.
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await open(user);

    expect(screen.queryByRole("radio", { name: "Face" })).toBeNull();
    expect(
      document.querySelector(".EditImages-labels-summary")?.textContent,
    ).toContain("Face");
    expect(screen.queryByLabelText("Image date")).toBeNull();
    expect(
      document.querySelectorAll(".EditImages-labels-summary")[1]?.textContent,
    ).toContain("2021-05");
    expect(screen.queryByRole("button", { name: "Re-crop" })).toBeNull();
  });

  // "Add as a new image" is the alternative to the default swap-in-place
  // above: the source row must survive alongside the crop, not be replaced
  // by it, since the whole point is keeping both framings of one photo.
  it("keeps the source image and appends the crop when adding as new", async () => {
    const square: TypedImage = {
      image: {
        __typename: "Image" as const,
        id: "a",
        url: "https://example.com/a.jpg",
        width: 1000,
        height: 1000,
        types: [],
        date: null,
      },
      types: [],
      date: null,
    };
    const rect = largestCenteredRect(2 / 3, 1);

    const { user } = renderForm(<Harness images={[square]} />, {
      mocks: [
        vocabularyMock,
        {
          request: {
            query: RecropImageGQL,
            variables: {
              imageData: {
                image_id: "a",
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
                id: "b",
                url: "https://example.com/b.jpg",
                width: 700,
                height: 1050,
                types: [ImageTypeEnum.CROP_FACE],
                date: "2021-05",
              },
            },
          },
        },
      ],
    });

    await open(user);
    await user.click(await screen.findByLabelText("Face"));
    await user.type(screen.getByLabelText("Image date"), "2021-05");

    await user.click(await screen.findByRole("button", { name: "Re-crop" }));
    await user.click(
      await screen.findByRole("checkbox", { name: "Add as a new image" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Save as new image" }),
    );
    await confirmLock(user);

    // Adding as new leaves the source row exactly where it was, so unlike a
    // replacing recrop this does not remount the lightbox closed -- it just
    // drops back from the crop editor to the normal picture view.
    await waitFor(() =>
      expect(document.querySelector(".RecropEditor")).not.toBeInTheDocument(),
    );

    expect(document.querySelectorAll(".EditImages-image-entry")).toHaveLength(
      2,
    );
  });
});

// Remove, Upload and Reset Images all sit together on one action row, so a
// contributor sees every control for the pending file in one place.
describe("EditImages action row", () => {
  const pending = () =>
    new File(["pixels"], "photo.jpg", { type: "image/jpeg" });

  it("puts Remove and Upload on Reset Images' row", async () => {
    renderForm(<Uploading file={pending()} />, { mocks: [vocabularyMock] });

    await screen.findByLabelText("Face");

    const row = screen.getByRole("button", { name: "Remove" }).parentElement;
    expect(row).toBe(
      screen.getByRole("button", { name: "Reset Images" }).parentElement,
    );
    expect(row).toContainElement(
      screen.getByRole("button", { name: "Upload" }),
    );
  });

  it("drops the file when Remove is clicked", async () => {
    const { user } = renderForm(<Uploading file={pending()} />, {
      mocks: [vocabularyMock],
    });

    await screen.findByLabelText("Face");
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    expect(screen.getByText("Add image")).toBeInTheDocument();
  });
});

describe("EditImages action row indent", () => {
  const pending = () =>
    new File(["pixels"], "photo.jpg", { type: "image/jpeg" });

  // Remove/Reset/Upload sit in their own row below CropStep, so nothing
  // connects their indent to CropStep's own -roomy padding except this
  // class living on the same condition. Mismatched, the buttons sit under
  // the column's left edge while the picture and its labels sit indented
  // under $crop-gutter beside them.
  it("indents the action row exactly when CropStep reserves guide-label room", async () => {
    renderForm(<Uploading file={pending()} />, { mocks: [vocabularyMock] });

    await screen.findByLabelText("Face");

    expect(document.querySelector(".CropStep-roomy")).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Remove" })
        .closest(".EditImages-actions-roomy"),
    ).not.toBeNull();
  });
});
