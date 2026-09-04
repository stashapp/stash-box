import { CombinedGraphQLErrors } from "@apollo/client";
import { type ReactNode, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import {
  type ImageFragment,
  type ImageTypeEnum,
  type ImageTypeScopeEnum,
  useImageTypeGroups,
  useUpdateImage,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";

import ImageLabels from "./ImageLabels";
import LabelLockWarning from "./LabelLockWarning";
import type { TypedImage } from "./types";

const CLASSNAME = "DirectLabelEditor";

/**
 * Gives a gallery of already-published images (a performer page, a scene
 * page, really anywhere images are shown outside the entity edit form) the same
 * direct-save labelling capability `EditImages` offers during upload: an
 * EDIT-role session can set a still-blank type or date straight away, via
 * `imageUpdate`, with no edit/vote queue involved.
 *
 * Deliberately not shared code with `EditImages`'s own version of this: that
 * one gates against `original`, a frozen snapshot of server state from when
 * the surrounding form opened, because its `images` field array holds
 * uncommitted local edits that must not themselves count as "already
 * categorized" before Apply is ever clicked. Here there is no form and no
 * local field array: `image.types`/`image.date` *is* server state, so it
 * is its own baseline, and only needs a `committed` ref for the moment
 * between a successful Apply and the query cache catching up
 */
export const useDirectLabelEditor = (
  target: ImageTypeScopeEnum,
  images: ImageFragment[],
) => {
  const { isEditor, isModerator } = useCurrentUser();
  const { data: vocabulary } = useImageTypeGroups({
    target,
    includeDisabled: true,
  });
  const groups = vocabulary?.imageTypeGroups ?? [];
  const labellable = isEditor && groups.some((group) => group.types.length > 0);

  const [updateImage] = useUpdateImage();
  const [values, setValues] = useState<Record<string, TypedImage>>({});
  const [applyingId, setApplyingId] = useState<string>();
  const [error, setError] = useState<string>();
  const typesCommitted = useRef(new Set<string>());
  const dateCommitted = useRef(new Set<string>());

  const currentValue = (image: ImageFragment): TypedImage =>
    values[image.id] ?? { image, types: image.types, date: image.date };

  const typesEditable = (image: ImageFragment) =>
    isModerator ||
    (!typesCommitted.current.has(image.id) && image.types.length === 0);
  const dateEditable = (image: ImageFragment) =>
    isModerator || (!dateCommitted.current.has(image.id) && !image.date);

  const willLockTypes = (image: ImageFragment, types: ImageTypeEnum[]) =>
    !isModerator && typesEditable(image) && types.length > 0;
  const willLockDate = (
    image: ImageFragment,
    date: string | null | undefined,
  ) => !isModerator && dateEditable(image) && !!date;

  const hasUnsavedChanges = (image: ImageFragment) => {
    const value = values[image.id];
    if (!value) return false;
    return (
      value.types.length !== image.types.length ||
      value.types.some((type) => !image.types.includes(type)) ||
      (value.date ?? null) !== (image.date ?? null)
    );
  };

  const applyLabels = (image: ImageFragment, value: TypedImage) => {
    setApplyingId(image.id);
    setError("");
    updateImage({
      variables: {
        imageData: { id: image.id, types: value.types, date: value.date },
      },
    })
      .then(() => {
        if (value.types.length > 0) typesCommitted.current.add(image.id);
        if (value.date) dateCommitted.current.add(image.id);
      })
      .catch((e: unknown) => {
        if (CombinedGraphQLErrors.is(e)) setError(e.message);
      })
      .finally(() => setApplyingId(undefined));
  };

  const [pendingApply, setPendingApply] = useState<{
    image: ImageFragment;
    value: TypedImage;
  }>();
  const requestApply = (image: ImageFragment, value: TypedImage) => {
    if (willLockTypes(image, value.types) || willLockDate(image, value.date)) {
      setPendingApply({ image, value });
    } else {
      applyLabels(image, value);
    }
  };

  const renderEditor = labellable
    ? (lightboxImage: { id: string }): ReactNode => {
        // The lightbox only guarantees id/url/width/height on the image it
        // hands back; the types/date this needs live on the caller's own
        // full image list, keyed by the same id
        const image = images.find((i) => i.id === lightboxImage.id);
        if (!image) return null;
        const current = currentValue(image);
        const labelsOk = typesEditable(image);
        const dateOk = dateEditable(image);

        return (
          <div className={CLASSNAME}>
            <ImageLabels
              groups={groups}
              value={current}
              labelsDisabled={!labelsOk}
              dateDisabled={!dateOk}
              onChange={(value) =>
                setValues((prev) => ({ ...prev, [image.id]: value }))
              }
            />
            {(labelsOk || dateOk) && (
              <Button
                size="sm"
                className="mt-2"
                disabled={applyingId === image.id || !hasUnsavedChanges(image)}
                onClick={() => requestApply(image, current)}
              >
                {applyingId === image.id ? "Applying..." : "Apply"}
              </Button>
            )}
            {error && <div className="text-danger mt-2">{error}</div>}
          </div>
        );
      }
    : undefined;

  const lockWarning = (
    <LabelLockWarning
      show={pendingApply !== undefined}
      action="apply"
      willLockTypes={
        pendingApply !== undefined &&
        willLockTypes(pendingApply.image, pendingApply.value.types)
      }
      willLockDate={
        pendingApply !== undefined &&
        willLockDate(pendingApply.image, pendingApply.value.date)
      }
      onCancel={() => setPendingApply(undefined)}
      onConfirm={() => {
        if (pendingApply) applyLabels(pendingApply.image, pendingApply.value);
        setPendingApply(undefined);
      }}
    />
  );

  return { renderEditor, lockWarning };
};
