import { useFragment } from "@apollo/client/react";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useState,
} from "react";
import { Button, Form, Modal } from "react-bootstrap";
import type { Labelling } from "src/components/editImages";
import ImageLabels from "src/components/editImages/ImageLabels";
import { ErrorMessage, Icon, LoadingIndicator } from "src/components/fragments";
import {
  ImageCategorizationFragmentDoc,
  ImageTypeScopeEnum,
  useImageCategorization,
  useImageTypeGroups,
  useSetImageOrganized,
  useUpdateImage,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { errorMessage } from "src/utils";

interface Props {
  imageId: string;
  editable?: boolean;
  showOrganizedIndicator?: boolean;
}

export const ImageOrganizedIndicator = ({
  imageId,
  organized = false,
}: {
  imageId: string;
  organized?: boolean;
}) => {
  // Entity forms retain snapshots of their images. Observe the normalized
  // cache so categorization mutations update the thumbnail without refetching.
  const { data, complete } = useFragment({
    fragment: ImageCategorizationFragmentDoc,
    from: { __typename: "Image", id: imageId },
  });
  return (complete ? data.organized : organized) ? (
    <span className="ImageLightbox-thumb-organized" title="Organized">
      <Icon icon={faCircleCheck} />
    </span>
  ) : null;
};

export const ImageOrganizedToggle = ({
  imageId,
  commitState,
  disabled,
}: {
  imageId: string;
  commitState: () => Promise<boolean>;
  disabled?: boolean;
}) => {
  const controlId = useId();
  const { isModerator } = useCurrentUser();
  const { data } = useImageCategorization({ id: imageId });
  const image = data?.findImage;
  const [setOrganized, { loading }] = useSetImageOrganized();

  if (!isModerator || !image) return null;

  return (
    <Form.Check
      className="ImageCategorization-organized-toggle"
      type="switch"
      id={`${controlId}-organized`}
      label="Organized"
      checked={image.organized}
      disabled={loading || disabled}
      onChange={async () => {
        const committed = await commitState();
        if (!committed) return;
        await setOrganized({
          variables: {
            input: { id: imageId, organized: !image.organized },
          },
        });
      }}
    />
  );
};

export interface CategorizationEditor {
  confirmLeave: (proceed: () => void) => void;
}

const ImageCategorization = forwardRef<CategorizationEditor, Props>(
  ({ imageId, editable = true, showOrganizedIndicator = false }, ref) => {
    const { isEditor } = useCurrentUser();
    const canEdit = editable && isEditor;
    const { data, loading, error } = useImageCategorization({ id: imageId });
    const image = data?.findImage;
    const { data: vocabulary } = useImageTypeGroups({
      target: ImageTypeScopeEnum.PERFORMER,
      includeDisabled: true,
    });
    const [draft, setDraft] = useState<Labelling | null>(null);
    const value = draft ?? image ?? { types: [], date: null };
    const [saveError, setSaveError] = useState<string>();
    const [updateImage, { loading: saving }] = useUpdateImage();

    const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
    const dirty =
      !!image &&
      canEdit &&
      !image.organized &&
      (value.date !== image.date ||
        value.types.length !== image.types.length ||
        value.types.some((type) => !image.types.includes(type)));

    useImperativeHandle(ref, () => ({
      confirmLeave: (proceed) => {
        if (saving) return;
        if (dirty) setPendingLeave(() => proceed);
        else proceed();
      },
    }));

    useEffect(() => {
      if (!dirty) return;
      const handler = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    if (loading)
      return <LoadingIndicator message="Loading categorization..." />;
    if (error) return <ErrorMessage error={errorMessage(error)} />;
    if (!image) return <ErrorMessage error="Image not found" />;

    const commitState = async () => {
      if (!dirty) return true;
      setSaveError(undefined);
      try {
        await updateImage({
          variables: {
            imageData: { id: imageId, types: value.types, date: value.date },
          },
        });
        setDraft(null);
        return true;
      } catch (cause) {
        setSaveError(errorMessage(cause));
        return false;
      }
    };

    return (
      <div className="ImageCategorization">
        {showOrganizedIndicator && image.organized && (
          <span className="ImageCategorization-organized" title="Organized">
            <Icon icon={faCircleCheck} />
          </span>
        )}
        <ImageOrganizedToggle
          imageId={imageId}
          commitState={commitState}
          disabled={saving}
        />
        <ImageLabels
          groups={vocabulary?.imageTypeGroups ?? []}
          value={value}
          onChange={setDraft}
          labelsDisabled={!canEdit || image.organized || saving}
          dateDisabled={!canEdit || image.organized || saving}
        />
        {saveError && <p className="text-danger">{saveError}</p>}
        {canEdit && !image.organized && (
          <Button onClick={commitState} disabled={saving}>
            {saving ? "Applying..." : "Apply"}
          </Button>
        )}
        <Modal
          show={!!pendingLeave}
          onHide={() => setPendingLeave(null)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Discard categorization changes?</Modal.Title>
          </Modal.Header>
          <Modal.Body>Your changes have not been applied.</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setPendingLeave(null)}>
              Keep editing
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const proceed = pendingLeave;
                setPendingLeave(null);
                proceed?.();
              }}
            >
              Discard changes
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  },
);

export default ImageCategorization;
