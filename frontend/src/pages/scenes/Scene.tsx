import { FC, useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import { Button, Card, Tabs, Tab, Table } from "react-bootstrap";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

import {
  Scene_findScene as Scene,
  Scene_findScene_fingerprints as Fingerprint,
} from "src/graphql/definitions/Scene";
import { usePendingEditsCount, TargetTypeEnum } from "src/graphql";
import AuthContext from "src/AuthContext";
import {
  canEdit,
  tagHref,
  performerHref,
  studioHref,
  createHref,
  formatDuration,
  formatDateTime,
  formatPendingEdits,
  getUrlBySite,
  compareByName,
} from "src/utils";
import {
  ROUTE_SCENE_EDIT,
  ROUTE_SCENES,
  ROUTE_SCENE_DELETE,
} from "src/constants/route";
import {
  GenderIcon,
  TagLink,
  PerformerName,
  Icon,
} from "src/components/fragments";
import { EditList, URLList } from "src/components/list";
import Image from "src/components/image";

const DEFAULT_TAB = "description";

interface Props {
  scene: Scene;
}

const SceneComponent: FC<Props> = ({ scene }) => {
  const history = useHistory();
  const activeTab = history.location.hash?.slice(1) || DEFAULT_TAB;
  const auth = useContext(AuthContext);

  const { data: editData } = usePendingEditsCount({
    type: TargetTypeEnum.SCENE,
    id: scene.id,
  });
  const pendingEditCount = editData?.queryEdits.count;

  const setTab = (tab: string | null) =>
    history.push({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

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

  function maybeRenderSubmitted(fingerprint: Fingerprint) {
    if (fingerprint.user_submitted) {
      return (
        <span className="user-submitted" title="Submitted by you">
          <Icon icon={faCheckCircle} />
        </span>
      );
    }
  }

  const fingerprints = scene.fingerprints.map((fingerprint) => (
    <tr key={fingerprint.hash}>
      <td>{fingerprint.algorithm}</td>
      <td className="font-monospace">
        <Link
          to={`${createHref(ROUTE_SCENES)}?fingerprint=${fingerprint.hash}`}
        >
          {fingerprint.hash}
        </Link>
      </td>
      <td>
        <span title={`${fingerprint.duration}s`}>
          {formatDuration(fingerprint.duration)}
        </span>
      </td>
      <td>
        {fingerprint.submissions}
        {maybeRenderSubmitted(fingerprint)}
      </td>
      <td>{formatDateTime(fingerprint.created)}</td>
      <td>{formatDateTime(fingerprint.updated)}</td>
    </tr>
  ));
  const tags = [...scene.tags].sort(compareByName).map((tag) => (
    <li key={tag.name}>
      <TagLink title={tag.name} link={tagHref(tag)} />
    </li>
  ));

  const studioURL = getUrlBySite(scene.urls, "Studio");

  return (
    <>
      <Card className="scene-info">
        <Card.Header>
          <div className="float-end">
            {canEdit(auth.user) && !scene.deleted && (
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
          <Image images={scene.images} emptyMessage="Scene has no image" />
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
                <b className="me-2">Studio URL:</b>
                <a href={studioURL} target="_blank" rel="noopener noreferrer">
                  {studioURL}
                </a>
              </div>
            </>
          )}
        </Tab>
        <Tab eventKey="fingerprints" title="Fingerprints" mountOnEnter={false}>
          <div className="scene-fingerprints my-4">
            <h4>Fingerprints:</h4>
            {fingerprints.length === 0 ? (
              <h6>No fingerprints found for this scene.</h6>
            ) : (
              <Table striped variant="dark">
                <thead>
                  <tr>
                    <td>
                      <b>Algorithm</b>
                    </td>
                    <td>
                      <b>Hash</b>
                    </td>
                    <td>
                      <b>Duration</b>
                    </td>
                    <td>
                      <b>Submissions</b>
                    </td>
                    <td>
                      <b>First Added</b>
                    </td>
                    <td>
                      <b>Last Added</b>
                    </td>
                  </tr>
                </thead>
                <tbody>{fingerprints}</tbody>
              </Table>
            )}
          </div>
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
