import type { FC } from "react";
import { Button, Card, Tab, Table, Tabs } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GenderIcon,
  HighlightedLinks,
  PerformerName,
  TagLink,
} from "src/components/fragments";
import Image from "src/components/image";
import { EditList, URLList } from "src/components/list";
import { ROUTE_GALLERY_DELETE, ROUTE_GALLERY_EDIT } from "src/constants";
import {
  type GalleryFragment as GalleryData,
  TargetTypeEnum,
  usePendingEditsCount,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import {
  compareByName,
  createHref,
  formatPendingEdits,
  performerHref,
  sceneHref,
  studioHref,
  tagHref,
} from "src/utils";

const DEFAULT_TAB = "description";

const Gallery: FC<{ gallery: GalleryData }> = ({ gallery }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isEditor } = useCurrentUser();
  const activeTab = location.hash.slice(1) || DEFAULT_TAB;
  const { data: editData } = usePendingEditsCount({
    type: TargetTypeEnum.GALLERY,
    id: gallery.id,
  });
  const pendingEditCount = editData?.queryEdits.count;
  const setTab = (tab: string | null) =>
    navigate({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  return (
    <>
      <Card className="gallery-info">
        <Card.Header>
          <div className="float-end">
            {isEditor && !gallery.deleted && (
              <>
                <Link to={createHref(ROUTE_GALLERY_EDIT, gallery)}>
                  <Button>Edit</Button>
                </Link>
                <Link
                  to={createHref(ROUTE_GALLERY_DELETE, gallery)}
                  className="ms-2"
                >
                  <Button variant="danger">Delete</Button>
                </Link>
              </>
            )}
          </div>
          <h3>{gallery.title}</h3>
          <h6>
            {gallery.studio && (
              <>
                <Link to={studioHref(gallery.studio)}>
                  {gallery.studio.name}
                </Link>
                <span className="mx-1">•</span>
              </>
            )}
            {gallery.date}
          </h6>
        </Card.Header>
        <Card.Body className="GalleryPhoto">
          <Image
            images={gallery.cover ?? undefined}
            emptyMessage="Gallery has no cover"
            size={1280}
            lightbox
          />
        </Card.Body>
        <Card.Footer className="d-flex mx-1">
          <div className="scene-performers me-auto">
            {gallery.performers.map((appearance, index) => (
              <span key={appearance.performer.id}>
                {index > 0 && <span className="mx-1">•</span>}
                <Link
                  to={performerHref(appearance.performer)}
                  className="scene-performer"
                >
                  <GenderIcon gender={appearance.performer.gender} />
                  <PerformerName
                    performer={appearance.performer}
                    as={appearance.as}
                  />
                </Link>
              </span>
            ))}
          </div>
          {gallery.code && (
            <div className="ms-3">
              Studio Code: <strong>{gallery.code}</strong>
            </div>
          )}
          {gallery.photographer && (
            <div className="ms-3">
              Photographer: <strong>{gallery.photographer}</strong>
            </div>
          )}
        </Card.Footer>
      </Card>
      <HighlightedLinks urls={gallery.urls} />
      <Tabs
        activeKey={activeTab}
        id="gallery-tabs"
        mountOnEnter
        onSelect={setTab}
      >
        <Tab eventKey="description" title="Description" className="my-4">
          <h4>Description:</h4>
          <div className="gallery-description">{gallery.details}</div>
          <div className="scene-tags mt-4">
            <h6>Tags:</h6>
            <ul className="scene-tag-list">
              {[...gallery.tags].sort(compareByName).map((tag) => (
                <li key={tag.id}>
                  <TagLink
                    title={tag.name}
                    link={tagHref(tag)}
                    description={tag.description}
                  />
                </li>
              ))}
            </ul>
          </div>
          {!!gallery.scenes.length && (
            <div className="mt-4">
              <h6>Scenes:</h6>
              <ul>
                {gallery.scenes.map((scene) => (
                  <li key={scene.id}>
                    <Link to={sceneHref(scene)}>
                      {scene.deleted ? <del>{scene.title}</del> : scene.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Tab>
        <Tab eventKey="images" title={`Images (${gallery.images.length})`}>
          <Table striped variant="dark" className="my-4">
            <thead>
              <tr>
                <th>Index</th>
                <th>PHash</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {gallery.images.map((image) => (
                <tr key={image.index}>
                  <td>{image.index}</td>
                  <td>
                    <code>{image.phash}</code>
                  </td>
                  <td>
                    {image.tags.map((tag, index) => (
                      <span key={tag.id}>
                        {index > 0 && ", "}
                        <Link to={tagHref(tag)}>{tag.name}</Link>
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
        <Tab eventKey="links" title="Links">
          <URLList urls={gallery.urls} />
        </Tab>
        <Tab
          eventKey="edits"
          title={`Edits${formatPendingEdits(pendingEditCount)}`}
          tabClassName={pendingEditCount ? "PendingEditTab" : ""}
        >
          <EditList type={TargetTypeEnum.GALLERY} id={gallery.id} />
        </Tab>
      </Tabs>
    </>
  );
};

export default Gallery;
