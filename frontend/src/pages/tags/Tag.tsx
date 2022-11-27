import { FC, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Tab, Tabs } from "react-bootstrap";

import {
  usePendingEditsCount,
  CriterionModifier,
  TargetTypeEnum,
  TagFragment as Tag,
} from "src/graphql";

import AuthContext from "src/AuthContext";
import { Tooltip } from "src/components/fragments";
import { EditList, SceneList } from "src/components/list";
import { canEdit, createHref, tagHref, formatPendingEdits } from "src/utils";
import {
  ROUTE_TAG_EDIT,
  ROUTE_TAG_MERGE,
  ROUTE_TAG_DELETE,
  ROUTE_CATEGORY,
} from "src/constants/route";

const DEFAULT_TAB = "scenes";

interface Props {
  tag: Tag;
}

const TagComponent: FC<Props> = ({ tag }) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.hash?.slice(1) || DEFAULT_TAB;

  const { data: editData } = usePendingEditsCount({
    type: TargetTypeEnum.TAG,
    id: tag.id,
  });
  const pendingEditCount = editData?.queryEdits.count;

  const setTab = (tab: string | null) =>
    navigate({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  return (
    <>
      <div className="d-flex">
        <h3>
          <span className="me-2">Tag:</span>
          {tag.deleted ? <del>{tag.name}</del> : <em>{tag.name}</em>}
        </h3>
        {canEdit(auth.user) && !tag.deleted && (
          <div className="ms-auto">
            <Link to={tagHref(tag, ROUTE_TAG_EDIT)} className="ms-2">
              <Button>Edit</Button>
            </Link>
            <Link to={tagHref(tag, ROUTE_TAG_MERGE)} className="ms-2">
              <Tooltip
                text={
                  <>
                    Merge other tags into <b>{tag.name}</b>
                  </>
                }
              >
                <Button>Merge</Button>
              </Tooltip>
            </Link>
            <Link to={createHref(ROUTE_TAG_DELETE, tag)} className="ms-2">
              <Button variant="danger">Delete</Button>
            </Link>
          </div>
        )}
      </div>
      {tag.description && (
        <div className="d-flex">
          <b className="me-2">Description:</b>
          <span>{tag.description}</span>
        </div>
      )}
      {tag.category && (
        <div className="d-flex">
          <b className="me-2">Category:</b>
          <Link to={createHref(ROUTE_CATEGORY, tag.category)}>
            {tag.category.name}
          </Link>
        </div>
      )}
      {tag.aliases.length > 0 && (
        <div className="d-flex">
          <b className="me-2">Aliases:</b>
          <span>{tag.aliases.join(", ")}</span>
        </div>
      )}
      <hr className="my-2" />
      <Tabs activeKey={activeTab} id="tag-tabs" mountOnEnter onSelect={setTab}>
        <Tab eventKey="scenes" title="Scenes">
          <SceneList
            filter={{
              tags: {
                value: [tag.id],
                modifier: CriterionModifier.INCLUDES,
              },
            }}
            favoriteFilter="all"
          />
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
