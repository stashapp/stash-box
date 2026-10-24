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
import { ErrorMessage, Icon, LoadingIndicator } from "src/components/fragments";
import ImageLabels from "src/components/image/ImageLabels";
import type { ImageCategorization } from "src/components/image/types";
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

export interface CategorizationEditor {
  confirmLeave: (proceed: () => void) => void;
}

const ImageCategorizationEditor = forwardRef<CategorizationEditor, Props>(
  ({ imageId }, ref) => {
    const { isEditor, isModerator } = useCurrentUser();
    const controlId = useId();
    const [setOrganized, { loading: organizing }] = useSetImageOrganized();
    const { data, loading, error } = useImageCategorization({ id: imageId });
    const image = data?.findImage;
    const { data: vocabulary } = useImageTypeGroups({
      target: ImageTypeScopeEnum.PERFORMER,
      includeDisabled: true,
    });
    const [draft, setDraft] = useState<ImageCategorization | null>(null);
    const value = draft ?? image ?? { types: [], date: null };
    const [saveError, setSaveError] = useState<string>();
    const [updateImage, { loading: saving }] = useUpdateImage();

    const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
    const dirty =
      !!image &&
      isEditor &&
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
        {isModerator && (
          <Form.Check
            className="ImageCategorization-organized-toggle"
            type="switch"
            id={`${controlId}-organized`}
            label="Organized"
            checked={image.organized}
            disabled={saving || organizing}
            onChange={async () => {
              if (!(await commitState())) return;
              try {
                await setOrganized({
                  variables: {
                    input: { id: imageId, organized: !image.organized },
                  },
                });
              } catch (cause) {
                setSaveError(errorMessage(cause));
              }
            }}
          />
        )}
        <ImageLabels
          groups={vocabulary?.imageTypeGroups ?? []}
          value={value}
          onChange={setDraft}
          labelsDisabled={!isEditor || image.organized || saving}
          dateDisabled={!isEditor || image.organized || saving}
        />
        {saveError && <p className="text-danger">{saveError}</p>}
        {isEditor && !image.organized && (
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

export default ImageCategorizationEditor;
