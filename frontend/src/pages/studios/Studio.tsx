import React, { useContext } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button, Tab, Tabs } from "react-bootstrap";
import { sortBy } from "lodash-es";

import {
  TargetTypeEnum,
  useEdits,
  useStudio,
  VoteStatusEnum,
  CriterionModifier,
} from "src/graphql";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { EditList, SceneList } from "src/components/list";

import {
  getImage,
  getUrlByType,
  createHref,
  studioHref,
  canEdit,
  formatPendingEdits,
} from "src/utils";
import { ROUTE_STUDIO_EDIT, ROUTE_STUDIO_DELETE } from "src/constants/route";
import AuthContext from "src/AuthContext";

const DEFAULT_TAB = "scenes";

const StudioComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const { id = "" } = useParams<{ id?: string }>();
  const { loading, data } = useStudio({ id }, id === "");
  const history = useHistory();
  const activeTab = history.location.hash?.slice(1) || DEFAULT_TAB;

  const { data: editData } = useEdits({
    filter: {
      per_page: 1,
    },
    editFilter: {
      target_type: TargetTypeEnum.STUDIO,
      target_id: id,
      status: VoteStatusEnum.PENDING,
    },
  });

  if (loading) return <LoadingIndicator message="Loading studio..." />;
  if (id === "" || !data?.findStudio)
    return <ErrorMessage error="Studio not found." />;

  const studio = data.findStudio;

  const studioImage = getImage(studio.images, "landscape");

  const subStudios = sortBy(studio.child_studios, (s) => s.name).map((s) => (
    <li key={s.id}>
      <Link to={studioHref(s)}>{s.name}</Link>
    </li>
  ));

  const pendingEditCount = editData?.queryEdits.count;

  const setTab = (tab: string | null) =>
    history.push({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  return (
    <>
      <div className="d-flex">
        <div className="studio-title mr-auto">
          <h3>
            <span className="mr-2">Studio:</span>
            {studio.deleted ? (
              <del>{studio.name}</del>
            ) : (
              <span>{studio.name}</span>
            )}
          </h3>
          <h6>
            <a
              href={getUrlByType(studio.urls, "HOME")}
              target="_blank"
              rel="noreferrer noopener"
            >
              {getUrlByType(studio.urls, "HOME")}
            </a>
          </h6>
          {studio.parent && (
            <span>
              Part of{" "}
              <b>
                <Link to={studioHref(studio.parent)}>{studio.parent.name}</Link>
              </b>
            </span>
          )}
        </div>
        {studioImage && (
          <div className="studio-photo">
            <img src={getImage(studio.images, "landscape")} alt="Studio logo" />
          </div>
        )}
        <div>
          {canEdit(auth.user) && !studio.deleted && (
            <>
              <Link to={createHref(ROUTE_STUDIO_EDIT, { id })} className="ml-2">
                <Button>Edit</Button>
              </Link>
              <Link
                to={createHref(ROUTE_STUDIO_DELETE, studio)}
                className="ml-2"
              >
                <Button variant="danger">Delete</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      {subStudios.length > 0 && (
        <>
          <h6>Sub Studios</h6>
          <div className="sub-studio-list">
            <ul>{subStudios}</ul>
          </div>
        </>
      )}
      <Tabs activeKey={activeTab} id="tag-tabs" mountOnEnter onSelect={setTab}>
        <Tab
          eventKey="scenes"
          title={subStudios.length > 0 ? "All Scenes" : "Scenes"}
        >
          <SceneList filter={{ parentStudio: id }} />
        </Tab>
        {subStudios.length > 0 && (
          <Tab eventKey="studio-scenes" title="Studio Scenes">
            <SceneList
              filter={{
                studios: { value: [id], modifier: CriterionModifier.INCLUDES },
              }}
            />
          </Tab>
        )}
        <Tab
          eventKey="edits"
          title={`Edits${formatPendingEdits(pendingEditCount)}`}
          tabClassName={pendingEditCount ? "PendingEditTab" : ""}
        >
          <EditList type={TargetTypeEnum.STUDIO} id={studio.id} />
        </Tab>
      </Tabs>
    </>
  );
};

export default StudioComponent;
