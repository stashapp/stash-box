import React, { useContext } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button, OverlayTrigger, Popover, Tab, Tabs } from "react-bootstrap";

import {
  useScenes,
  useTag,
  useEdits,
  SortDirectionEnum,
  CriterionModifier,
  TargetTypeEnum,
  VoteStatusEnum,
} from "src/graphql";

import AuthContext from "src/AuthContext";
import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import SceneCard from "src/components/sceneCard";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { EditList } from "src/components/list";
import { canEdit, createHref, tagHref, formatPendingEdits } from "src/utils";
import {
  ROUTE_TAG_EDIT,
  ROUTE_TAG_MERGE,
  ROUTE_TAG_DELETE,
  ROUTE_CATEGORY,
} from "src/constants/route";

const PER_PAGE = 20;
const DEFAULT_TAB = "scenes";

const TagComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { page, setPage } = usePagination();
  const activeTab = history.location.hash?.slice(1) || DEFAULT_TAB;
  const { data, loading: loadingTag } = useTag({ id });
  const tag = data?.findTag;

  const { data: sceneData, loading: loadingScenes } = useScenes(
    {
      filter: {
        page,
        per_page: PER_PAGE,
        sort: "DATE",
        direction: SortDirectionEnum.DESC,
      },
      sceneFilter: {
        tags: {
          value: [tag?.id ?? ""],
          modifier: CriterionModifier.INCLUDES,
        },
      },
    },
    !tag?.id
  );

  const { data: editData } = useEdits({
    filter: {
      per_page: 1,
    },
    editFilter: {
      target_type: TargetTypeEnum.TAG,
      target_id: id,
      status: VoteStatusEnum.PENDING,
    },
  });
  const pendingEditCount = editData?.queryEdits.count;

  const setTab = (tab: string | null) =>
    history.push({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  if (loadingTag || loadingScenes)
    return <LoadingIndicator message="Loading..." />;

  if (!tag?.id) return <div>Tag not found!</div>;
  if (!sceneData?.queryScenes)
    return <ErrorMessage error="Scene data not found." />;

  const scenes = sceneData.queryScenes.scenes.map((scene) => (
    <SceneCard key={scene.id} performance={scene} />
  ));

  return (
    <>
      <div className="row no-gutters">
        <h3>
          <span className="mr-2">Tag:</span>
          {tag.deleted ? <del>{tag.name}</del> : <em>{tag.name}</em>}
        </h3>
        {canEdit(auth.user) && !tag.deleted && (
          <div className="ml-auto">
            <Link to={tagHref(tag, ROUTE_TAG_EDIT)} className="ml-2">
              <Button>Edit</Button>
            </Link>
            <Link to={tagHref(tag, ROUTE_TAG_MERGE)} className="ml-2">
              <OverlayTrigger
                overlay={
                  <Popover id="merge">
                    <Popover.Content>
                      Merge other tags into <b>{tag.name}</b>.
                    </Popover.Content>
                  </Popover>
                }
                placement="bottom-end"
                trigger="hover"
              >
                <Button>Merge</Button>
              </OverlayTrigger>
            </Link>
            <Link to={createHref(ROUTE_TAG_DELETE, tag)} className="ml-2">
              <Button variant="danger">Delete</Button>
            </Link>
          </div>
        )}
      </div>
      {tag.description && (
        <div className="row no-gutters">
          <b className="mr-2">Description:</b>
          <span>{tag.description}</span>
        </div>
      )}
      {tag.category && (
        <div className="row no-gutters">
          <b className="mr-2">Category:</b>
          <Link to={createHref(ROUTE_CATEGORY, tag.category)}>
            {tag.category.name}
          </Link>
        </div>
      )}
      {tag.aliases.length > 0 && (
        <div className="row no-gutters">
          <b className="mr-2">Aliases:</b>
          <span>{tag.aliases.join(", ")}</span>
        </div>
      )}
      <hr className="my-2" />
      <Tabs activeKey={activeTab} id="tag-tabs" mountOnEnter onSelect={setTab}>
        <Tab eventKey="scenes" title="Scenes">
          <div className="row no-gutters">
            <Pagination
              onClick={setPage}
              perPage={PER_PAGE}
              active={page}
              count={sceneData.queryScenes.count}
              showCount
            />
          </div>
          <div className="performers row">{scenes}</div>
          <div className="row no-gutters">
            <Pagination
              onClick={setPage}
              perPage={PER_PAGE}
              active={page}
              count={sceneData.queryScenes.count}
            />
          </div>
        </Tab>
        <Tab
          eventKey="edits"
          title={`Edits${formatPendingEdits(pendingEditCount)}`}
          tabClassName={pendingEditCount ? "PendingEditTab" : ""}
        >
          <EditList type={TargetTypeEnum.TAG} id={tag.id} />
        </Tab>
      </Tabs>
    </>
  );
};

export default TagComponent;
