import React, { useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import { Button, Col, Row, Tab, Tabs } from "react-bootstrap";

import {
  useScenes,
  useEdits,
  SortDirectionEnum,
  CriterionModifier,
  TargetTypeEnum,
  VoteStatusEnum,
} from "src/graphql";
import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";

import AuthContext from "src/AuthContext";
import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import SceneCard from "src/components/sceneCard";
import {
  ErrorMessage,
  LoadingIndicator,
  Tooltip,
} from "src/components/fragments";
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

interface Props {
  tag: Tag;
}

const TagComponent: React.FC<Props> = ({ tag }) => {
  const auth = useContext(AuthContext);
  const history = useHistory();
  const { page, setPage } = usePagination();
  const activeTab = history.location.hash?.slice(1) || DEFAULT_TAB;

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
      target_id: tag.id,
      status: VoteStatusEnum.PENDING,
    },
  });
  const pendingEditCount = editData?.queryEdits.count;

  const setTab = (tab: string | null) =>
    history.push({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  const scenes = sceneData?.queryScenes.scenes.map((scene) => (
    <Col xs={3} key={scene.id}>
      <SceneCard performance={scene} />
    </Col>
  ));

  return (
    <>
      <Row noGutters>
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
              <Tooltip
                text={
                  <>
                    Merge other tags into <b>{tag.name}</b>.
                  </>
                }
              >
                <Button>Merge</Button>
              </Tooltip>
            </Link>
            <Link to={createHref(ROUTE_TAG_DELETE, tag)} className="ml-2">
              <Button variant="danger">Delete</Button>
            </Link>
          </div>
        )}
      </Row>
      {tag.description && (
        <Row noGutters>
          <b className="mr-2">Description:</b>
          <span>{tag.description}</span>
        </Row>
      )}
      {tag.category && (
        <Row noGutters>
          <b className="mr-2">Category:</b>
          <Link to={createHref(ROUTE_CATEGORY, tag.category)}>
            {tag.category.name}
          </Link>
        </Row>
      )}
      {tag.aliases.length > 0 && (
        <Row noGutters>
          <b className="mr-2">Aliases:</b>
          <span>{tag.aliases.join(", ")}</span>
        </Row>
      )}
      <hr className="my-2" />
      <Tabs activeKey={activeTab} id="tag-tabs" mountOnEnter onSelect={setTab}>
        <Tab eventKey="scenes" title="Scenes">
          {loadingScenes && <LoadingIndicator message="Loading..." />}
          {!loadingScenes && !sceneData?.queryScenes && (
            <ErrorMessage error="Scene data not found." />
          )}
          {!loadingScenes && sceneData?.queryScenes && (
            <>
              <Row noGutters>
                <Pagination
                  onClick={setPage}
                  perPage={PER_PAGE}
                  active={page}
                  count={sceneData.queryScenes.count}
                  showCount
                />
              </Row>
              <Row className="performers">{scenes}</Row>
              <Row noGutters>
                <Pagination
                  onClick={setPage}
                  perPage={PER_PAGE}
                  active={page}
                  count={sceneData.queryScenes.count}
                />
              </Row>
            </>
          )}
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
