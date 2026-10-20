import { useQuery } from "@apollo/client/react";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useId, useState } from "react";
import { Button, Form } from "react-bootstrap";
import type { Labelling } from "src/components/editImages";
import ImageLabels from "src/components/editImages/ImageLabels";
import { ErrorMessage, Icon, LoadingIndicator } from "src/components/fragments";
import {
  ImageCategorizationDocument,
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
  const { data } = useQuery(ImageCategorizationDocument, {
    variables: { id: imageId },
    fetchPolicy: "cache-only",
  });
  return (data?.findImage?.organized ?? organized) ? (
    <span className="ImageLightbox-thumb-organized" title="Organized">
      <Icon icon={faCircleCheck} />
    </span>
  ) : null;
};

export const ImageOrganizedToggle = ({ imageId }: { imageId: string }) => {
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
      disabled={loading}
      onChange={() =>
        setOrganized({
          variables: {
            input: { id: imageId, organized: !image.organized },
          },
        })
      }
    />
  );
};

const ImageCategorization = ({
  imageId,
  editable = true,
  showOrganizedIndicator = false,
}: Props) => {
  const { data, loading, error } = useImageCategorization({ id: imageId });
  const image = data?.findImage;
  const { data: vocabulary } = useImageTypeGroups({
    target: ImageTypeScopeEnum.PERFORMER,
    includeDisabled: true,
  });
  const [value, setValue] = useState<Labelling>({ types: [], date: null });
  const [saveError, setSaveError] = useState<string>();
  const [updateImage, { loading: saving }] = useUpdateImage();

  useEffect(() => {
    if (image) setValue({ types: image.types, date: image.date });
  }, [image]);

  if (loading) return <LoadingIndicator message="Loading categorization..." />;
  if (error) return <ErrorMessage error={errorMessage(error)} />;
  if (!image) return <ErrorMessage error="Image not found" />;

  const save = () => {
    setSaveError(undefined);
    updateImage({ variables: { imageData: { id: imageId, ...value } } }).catch(
      (cause: unknown) => setSaveError(errorMessage(cause)),
    );
  };

  return (
    <div className="ImageCategorization">
      {showOrganizedIndicator && image.organized && (
        <span className="ImageCategorization-organized" title="Organized">
          <Icon icon={faCircleCheck} />
        </span>
      )}
      <ImageOrganizedToggle imageId={imageId} />
      <ImageLabels
        groups={vocabulary?.imageTypeGroups ?? []}
        value={value}
        onChange={setValue}
        labelsDisabled={!editable || image.organized}
        dateDisabled={!editable || image.organized}
      />
      {saveError && <p className="text-danger">{saveError}</p>}
      {editable && !image.organized && (
        <Button onClick={save} disabled={saving}>
          {saving ? "Applying..." : "Apply"}
        </Button>
      )}
    </div>
  );
};

export default ImageCategorization;
