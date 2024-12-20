import { FC } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Tabs, Tab } from "react-bootstrap";

import {
  usePendingEditsCount,
  TargetTypeEnum,
  SceneFragment as Scene,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import {
  tagHref,
  performerHref,
  studioHref,
  createHref,
  formatDuration,
  formatPendingEdits,
  getUrlBySite,
  compareByName,
} from "src/utils";
import { ROUTE_SCENE_EDIT, ROUTE_SCENE_DELETE } from "src/constants/route";
import { GenderIcon, TagLink, PerformerName } from "src/components/fragments";
import { EditList, URLList } from "src/components/list";
import Image from "src/components/image";
import { FingerprintTable } from "./components/fingerprints";

const DEFAULT_TAB = "description";

interface Props {
  scene: Scene;
}

const SceneComponent: FC<Props> = ({ scene }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.hash?.slice(1) || DEFAULT_TAB;
  const { isEditor } = useCurrentUser();

  const { data: editData } = usePendingEditsCount({
    type: TargetTypeEnum.SCENE,
    id: scene.id,
  });
  const pendingEditCount = editData?.queryEdits.count;

  const setTab = (tab: string | null) =>
    navigate({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  const performers = scene.performers
    .map((performance) => {
      const { performer } = performance;
      return (
        <Link
          key={performer.id}
          to={performerHref(performer)}
          className="scene-performer"
        >
          <GenderIcon gender={performer.gender} />
          <PerformerName performer={performer} as={performance.as} />
        </Link>
      );
    })
    .map((p, index) => (index % 2 === 2 ? [" • ", p] : p));

  const tags = [...scene.tags].sort(compareByName).map((tag) => (
    <li key={tag.name}>
      <TagLink
        title={tag.name}
        link={tagHref(tag)}
        description={tag.description}
      />
    </li>
  ));

  const studioURL = getUrlBySite(scene.urls, "Studio");

  return (
    <>
      <Card className="scene-info">
        <Card.Header>
          <div className="float-end">
            {isEditor && !scene.deleted && (
              <>
                <Link to={createHref(ROUTE_SCENE_EDIT, { id: scene.id })}>
                  <Button>Edit</Button>
                </Link>
                <Link
                  to={createHref(ROUTE_SCENE_DELETE, { id: scene.id })}
                  className="ms-2"
                >
                  <Button variant="danger">Delete</Button>
                </Link>
              </>
            )}
          </div>
          <h3>
            {scene.deleted ? (
              <del>{scene.title}</del>
            ) : (
              <span>{scene.title}</span>
            )}
          </h3>
          <h6>
            {scene.studio && (
              <>
                <Link to={studioHref(scene.studio)}>{scene.studio.name}</Link>
                <span className="mx-1">•</span>
              </>
            )}
            {scene.release_date}
          </h6>
        </Card.Header>
        <Card.Body className="ScenePhoto">
          <Image
            images={scene.images}
            emptyMessage="Scene has no image"
            size={1280}
          />
        </Card.Body>
        <Card.Footer className="d-flex mx-1">
          <div className="scene-performers me-auto">{performers}</div>
          {scene.code && (
            <div className="ms-3">
              Studio Code: <strong>{scene.code}</strong>
            </div>
          )}
          {!!scene.duration && (
            <div title={`${scene.duration} seconds`} className="ms-3">
              Duration: <b>{formatDuration(scene.duration)}</b>
            </div>
          )}
          {scene.director && (
            <div className="ms-3">
              Director: <strong>{scene.director}</strong>
            </div>
          )}
          {scene.production_date && (
            <div className="ms-3">
              Produced: <strong>{scene.production_date}</strong>
            </div>
          )}
        </Card.Footer>
      </Card>
      <div className="float-end">
        {scene.urls.map((u) => (
          <a href={u.url} target="_blank" rel="noreferrer noopener" key={u.url}>
            <img src={u.site.icon} alt="" className="SiteLink-icon" />
          </a>
        ))}
      </div>
      <Tabs
        activeKey={activeTab}
        id="scene-tabs"
        mountOnEnter
        onSelect={setTab}
      >
        <Tab eventKey="description" title="Description" className="my-4">
          <div className="scene-description">
            <h4>Description:</h4>
            <div>{scene.details}</div>
          </div>
          <div className="scene-tags">
            <h6>Tags:</h6>
            <ul className="scene-tag-list">{tags}</ul>
          </div>
          {studioURL && (
            <>
              <hr />
              <div>
                <b className="me-2">{studioURL.site.name}:</b>
                <a
                  href={studioURL.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {studioURL.url}
                </a>
              </div>
            </>
          )}
        </Tab>
        <Tab eventKey="fingerprints" title="Fingerprints" mountOnEnter={false}>
          <FingerprintTable scene={scene} />
        </Tab>
        <Tab eventKey="links" title="Links">
          <URLList urls={scene.urls} />
        </Tab>
        <Tab
          eventKey="edits"
          title={`Edits${formatPendingEdits(pendingEditCount)}`}
          tabClassName={pendingEditCount ? "PendingEditTab" : ""}
        >
          <EditList type={TargetTypeEnum.SCENE} id={scene.id} />
        </Tab>
      </Tabs>
    </>
  );
};

export default SceneComponent;
