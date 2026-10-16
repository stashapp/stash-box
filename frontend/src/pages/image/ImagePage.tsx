import {
  faCircleCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Button, Card, Col, Row } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";

import { ErrorMessage, Icon, LoadingIndicator } from "src/components/fragments";
import Image from "src/components/image";
import ImageCategorization from "src/components/image/ImageCategorization";
import Title from "src/components/title";
import { ROUTE_IMAGE, ROUTE_IMAGE_EDIT } from "src/constants/route";
import {
  type ImageQuery,
  ImageTypeScopeEnum,
  useImage,
  useImageTypeGroups,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { createHref, errorMessage, formatDateTime } from "src/utils";
import {
  editHref,
  performerHref,
  sceneHref,
  studioHref,
  userHref,
} from "src/utils/route";

const EntityList = ({
  title,
  entities,
  href,
}: {
  title: string;
  entities: { id: string; label: string }[];
  href: (entity: { id: string }) => string;
}) => {
  if (!entities.length) return null;

  return (
    <div className="mb-3">
      <h6>{title}</h6>
      <ul className="mb-0">
        {entities.map((entity) => (
          <li key={entity.id}>
            <Link to={href(entity)}>{entity.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

type ImageEdit = NonNullable<
  NonNullable<ImageQuery["findImage"]>["edits"]
>[number];

const ImageEditDescription = ({
  edit,
  imageId,
}: {
  edit: ImageEdit;
  imageId: string;
}) => {
  const details = edit.details;
  const removed =
    details &&
    "removed_images" in details &&
    details.removed_images?.some((image) => image.id === imageId);
  const target = edit.target;
  const targetDescription = (() => {
    switch (target?.__typename) {
      case "Performer":
        return { label: target.name, href: performerHref(target) };
      case "Scene":
        return {
          label: target.title || "Untitled scene",
          href: sceneHref(target),
        };
      case "Studio":
        return { label: target.name, href: studioHref(target) };
      default:
        return undefined;
    }
  })();

  return (
    <>
      {removed ? "Removed from " : "Added to "}
      {targetDescription ? (
        <Link to={targetDescription.href}>{targetDescription.label}</Link>
      ) : (
        "unknown entity"
      )}
      {" by "}
      {edit.user ? (
        <Link to={userHref(edit.user)}>{edit.user.name}</Link>
      ) : (
        "unknown user"
      )}
      {" on "}
      <Link to={editHref(edit)}>{formatDateTime(edit.created)}</Link>
    </>
  );
};

const ImagePage = ({ editing = false }: { editing?: boolean }) => {
  const { id = "" } = useParams();
  const { isEditor } = useCurrentUser();
  const { loading, data, error } = useImage({ id });
  const { data: vocabulary } = useImageTypeGroups({
    target: ImageTypeScopeEnum.PERFORMER,
    includeDisabled: true,
  });
  const image = data?.findImage;

  if (loading) return <LoadingIndicator message="Loading image..." />;
  if (error) return <ErrorMessage error={errorMessage(error)} />;
  if (!image) return <ErrorMessage error="Image not found" />;
  if (editing && !isEditor)
    return <ErrorMessage error="You do not have permission to edit images." />;

  const groups = vocabulary?.imageTypeGroups ?? [];
  const typeNames = new Map(
    groups.flatMap((group) => group.types.map((type) => [type.key, type.name])),
  );
  const performers = (image.performers ?? []).map((performer) => ({
    ...performer,
    label: performer.name,
  }));
  const scenes = (image.scenes ?? []).map((scene) => ({
    ...scene,
    label: scene.title || "Untitled scene",
  }));
  const studios = (image.studios ?? []).map((studio) => ({
    ...studio,
    label: studio.name,
  }));
  const hasAttachments = !!(
    performers.length ||
    scenes.length ||
    studios.length
  );

  return (
    <div className="ImagePage">
      <Title page="Image" />
      {(editing || isEditor) && (
        <div className="d-flex justify-content-end mb-3">
          {editing ? (
            <Link to={createHref(ROUTE_IMAGE, image)} className="ms-auto">
              <Button variant="secondary">Cancel editing</Button>
            </Link>
          ) : (
            <Link to={createHref(ROUTE_IMAGE_EDIT, image)} className="ms-auto">
              <Button>Edit categorization</Button>
            </Link>
          )}
        </div>
      )}

      <Row className="g-4">
        <Col lg={8}>
          <div className="ImagePage-image">
            <Image images={image} size="full" alt="" lightbox />
          </div>
          <div className="text-center text-muted mt-2">
            {image.width} × {image.height}
          </div>
        </Col>
        <Col lg={4}>
          {editing ? (
            <Card>
              <Card.Body>
                <ImageCategorization imageId={image.id} />
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="position-relative">
                {image.organized && (
                  <span className="ImagePage-organized" title="Organized">
                    <Icon icon={faCircleCheck} />
                  </span>
                )}
                <h5>Categorization</h5>
                <dl>
                  <dt>Labels</dt>
                  <dd>
                    {image.types.length
                      ? image.types
                          .map((type) => typeNames.get(type) ?? type)
                          .join(", ")
                      : "Uncategorized"}
                  </dd>
                  <dt>Approximate date</dt>
                  <dd>{image.date ?? "Unknown"}</dd>
                  <dt>Status</dt>
                  <dd>{image.organized ? "Organized" : "Not organized"}</dd>
                  <dt>Last categorized</dt>
                  <dd>
                    {image.categorized_at
                      ? formatDateTime(image.categorized_at)
                      : "Never"}
                    {image.categorized_by && (
                      <>
                        {" by "}
                        <Link to={userHref(image.categorized_by)}>
                          {image.categorized_by.name}
                        </Link>
                      </>
                    )}
                  </dd>
                </dl>

                <h5>Image edits</h5>
                {image.edits?.length ? (
                  <ul>
                    {image.edits.map((edit) => (
                      <li key={edit.id}>
                        <ImageEditDescription edit={edit} imageId={image.id} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No image edits found.</p>
                )}

                <h5>Attached to</h5>
                {!hasAttachments && (
                  <p className="text-warning">
                    <Icon icon={faTriangleExclamation} /> Unattached
                  </p>
                )}
                <EntityList
                  title="Performers"
                  entities={performers}
                  href={performerHref}
                />
                <EntityList title="Scenes" entities={scenes} href={sceneHref} />
                <EntityList
                  title="Studios"
                  entities={studios}
                  href={studioHref}
                />
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ImagePage;
