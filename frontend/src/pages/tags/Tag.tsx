import React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button, Tab, Tabs } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import { Tag, TagVariables } from "src/definitions/Tag";
import {
  SortDirectionEnum,
  CriterionModifier,
  TargetTypeEnum,
  OperationEnum,
} from "src/definitions/globalTypes";
import {
  TagEditMutation as TagEdit,
  TagEditMutationVariables,
} from "src/definitions/TagEditMutation";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import SceneCard from "src/components/sceneCard";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { EditList } from "src/components/list";
import DeleteButton from "src/components/deleteButton";
import { createHref, tagHref } from "src/utils/route";
import {
  ROUTE_TAG_EDIT,
  ROUTE_TAG_MERGE,
  ROUTE_EDIT,
  ROUTE_CATEGORY,
} from "src/constants/route";

const ScenesQuery = loader("src/queries/Scenes.gql");
const TagQuery = loader("src/queries/Tag.gql");
const TagEditMutation = loader("src/mutations/TagEdit.gql");

const PER_PAGE = 20;
const DEFAULT_TAB = "scenes";

const TagComponent: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const { page, setPage } = usePagination();
  const activeTab = history.location.hash?.slice(1) || DEFAULT_TAB;
  const { data, loading: loadingTag } = useQuery<Tag, TagVariables>(TagQuery, {
    variables: { id },
  });
  const tag = data?.findTag;

  const { data: sceneData, loading: loadingScenes } = useQuery<
    Scenes,
    ScenesVariables
  >(ScenesQuery, {
    variables: {
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
    skip: !tag?.id,
  });

  const [deleteTagEdit, { loading: deleting }] = useMutation<
    TagEdit,
    TagEditMutationVariables
  >(TagEditMutation, {
    onCompleted: (result) => {
      if (result.tagEdit.id)
        history.push(createHref(ROUTE_EDIT, result.tagEdit));
    },
  });

  const handleDelete = () => {
    deleteTagEdit({
      variables: {
        tagData: {
          edit: { operation: OperationEnum.DESTROY, id: tag?.id },
        },
      },
    });
  };

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
        <h3 className="col-4 mr-auto">
          <span className="mr-2">Tag:</span>
          {tag.deleted ? <del>{tag.name}</del> : <em>{tag.name}</em>}
        </h3>
        <Link to={tagHref(tag, ROUTE_TAG_EDIT)} className="mr-2">
          <Button>Edit</Button>
        </Link>
        <Link to={tagHref(tag, ROUTE_TAG_MERGE)} className="mr-2">
          <Button>Merge into</Button>
        </Link>
        {!tag.deleted && (
          <DeleteButton
            onClick={handleDelete}
            disabled={deleting}
            message="Do you want to delete tag?"
          />
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
        <Tab eventKey="edits" title="Edits">
          <EditList type={TargetTypeEnum.TAG} id={tag.id} />
        </Tab>
      </Tabs>
    </>
  );
};

export default TagComponent;
