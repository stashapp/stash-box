import { CombinedGraphQLErrors } from "@apollo/client";
import { type ReactNode, useState } from "react";
import { Button, Form } from "react-bootstrap";
import Modal from "src/components/modal";
import {
  type ImageFragment,
  type ImageTypeScopeEnum,
  useImageTypeGroups,
  useSetImageOrganized,
  useUpdateImage,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";

import ImageLabels from "./ImageLabels";
import type { TypedImage } from "./types";

const CLASSNAME = "DirectLabelEditor";

/**
 * Gives a gallery of already-published images (a performer page, a scene
 * page, really anywhere images are shown outside the entity edit form) the same
 * direct-save labelling capability `EditImages` offers during upload: an
 * EDIT-role session sets and freely revises types/date straight away, via
 * `imageUpdate`, with no edit/vote queue involved, until a moderator marks
 * the image organized: that's a hard lock for everyone, moderators included.
 *
 * Deliberately not shared code with `EditImages`'s own version of this: that
 * one gates against `original`, a frozen snapshot of server state from when
 * the surrounding form opened, because its `images` field array holds
 * uncommitted local edits. Here there is no form and no local field array:
 * `image.types`/`image.date`/`image.organized` is server state, so it is its own baseline
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
  const labellable = groups.some((group) => group.types.length > 0);

  const [updateImage] = useUpdateImage();
  const [setImageOrganized, { loading: organizing }] = useSetImageOrganized();
  const [values, setValues] = useState<Record<string, TypedImage>>({});
  const [applyingId, setApplyingId] = useState<string>();
  const [error, setError] = useState<string>();

  const currentValue = (image: ImageFragment): TypedImage =>
    values[image.id] ?? { image, types: image.types, date: image.date };

  const editable = (image: ImageFragment) => !image.organized;

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
    return updateImage({
      variables: {
        imageData: { id: image.id, types: value.types, date: value.date },
      },
    })
      .then(() => true)
      .catch((e: unknown) => {
        if (CombinedGraphQLErrors.is(e)) setError(e.message);
        return false;
      })
      .finally(() => setApplyingId(undefined));
  };

  const toggleOrganized = async (image: ImageFragment) => {
    if (!image.organized && hasUnsavedChanges(image)) {
      if (!(await applyLabels(image, currentValue(image)))) return;
    }
    setError("");
    setImageOrganized({
      variables: {
        input: { id: image.id, organized: !image.organized },
      },
    }).catch((e: unknown) => {
      if (CombinedGraphQLErrors.is(e)) setError(e.message);
    });
  };

  const [pendingLeave, setPendingLeave] = useState<{
    imageId: string;
    proceed: () => void;
  }>();
  const confirmLeave = (imageId: string, proceed: () => void) => {
    const image = images.find((i) => i.id === imageId);
    if (image && hasUnsavedChanges(image))
      setPendingLeave({ imageId, proceed });
    else proceed();
  };
  const leavePrompt = pendingLeave && (
    <Modal
      message="This image has labels or a date that have not been applied yet. Leave without applying them?"
      acceptTerm="Leave"
      cancelTerm="Stay"
      callback={(leave) => {
        const pending = pendingLeave;
        setPendingLeave(undefined);
        if (!leave) return;
        setValues(({ [pending.imageId]: _dropped, ...rest }) => rest);
        pending.proceed();
      }}
    />
  );

  const renderEditor = labellable
    ? (lightboxImage: { id: string }): ReactNode => {
        // The lightbox only guarantees id/url/width/height on the image it hands back;
        // the types/date this needs live on the caller's own full image list, keyed by the same id
        const image = images.find((i) => i.id === lightboxImage.id);
        if (!image) return null;
        if (!isEditor) {
          if (image.types.length === 0 && !image.date) return null;
          return (
            <div className={CLASSNAME}>
              <ImageLabels
                groups={groups}
                value={{ image, types: image.types, date: image.date }}
                onChange={() => undefined}
                labelsDisabled
                dateDisabled
              />
            </div>
          );
        }
        const current = currentValue(image);
        const canEdit = editable(image);

        return (
          <div className={CLASSNAME}>
            <ImageLabels
              groups={groups}
              value={current}
              labelsDisabled={!canEdit}
              dateDisabled={!canEdit}
              onChange={(value) =>
                setValues((prev) => ({ ...prev, [image.id]: value }))
              }
            />
            {canEdit && (
              <Button
                size="sm"
                className="mt-2"
                disabled={applyingId === image.id || !hasUnsavedChanges(image)}
                onClick={() => applyLabels(image, current)}
              >
                {applyingId === image.id ? "Applying..." : "Apply"}
              </Button>
            )}
            {isModerator && (
              <Form.Check
                type="switch"
                id={`organized-${image.id}`}
                className="mt-2"
                label="Organized"
                title="Locks the labels and date; only a moderator can change them or withdraw the mark"
                checked={image.organized}
                disabled={organizing}
                onChange={() => toggleOrganized(image)}
              />
            )}
            {error && <div className="text-danger mt-2">{error}</div>}
          </div>
        );
      }
    : undefined;

  return {
    renderEditor,
    editorLabel: isEditor ? undefined : "Image classification and date",
    confirmLeave,
    leavePrompt,
  };
};
