import React from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
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
import { LoadingIndicator } from "src/components/fragments";
import EditList from "src/components/editList";
import DeleteButton from "src/components/deleteButton";

const ScenesQuery = loader("src/queries/Scenes.gql");
const TagQuery = loader("src/queries/Tag.gql");
const TagEditMutation = loader("src/mutations/TagEdit.gql");

const DEFAULT_TAB = "scenes";

const TagComponent: React.FC = () => {
  const { name } = useParams();
  const history = useHistory();
  const { page, setPage } = usePagination();
  const activeTab = history.location.hash?.slice(1) || DEFAULT_TAB;
  const { data: tag, loading: loadingTag } = useQuery<Tag, TagVariables>(
    TagQuery,
    {
      variables: { name: decodeURI(name ?? "") },
    }
  );

  const { data: sceneData, loading: loadingScenes } = useQuery<
    Scenes,
    ScenesVariables
  >(ScenesQuery, {
    variables: {
      filter: {
        page,
        per_page: 20,
        sort: "DATE",
        direction: SortDirectionEnum.DESC,
      },
      sceneFilter: {
        tags: {
          value: [tag?.findTag?.id ?? ""],
          modifier: CriterionModifier.INCLUDES,
        },
      },
    },
    skip: !tag?.findTag?.id,
  });

  const [deleteTagEdit, { loading: deleting }] = useMutation<
    TagEdit,
    TagEditMutationVariables
  >(TagEditMutation, {
    onCompleted: (data) => {
      if (data.tagEdit.id) history.push(`/edits/${data.tagEdit.id}`);
    },
  });

  const handleDelete = () => {
    deleteTagEdit({
      variables: {
        tagData: {
          edit: { operation: OperationEnum.DESTROY, id: tag?.findTag?.id },
        },
      },
    });
  };

  const setTab = (tab: string|null) =>
    history.push({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  if (loadingTag || loadingScenes)
    return <LoadingIndicator message="Loading..." />;

  if (!tag?.findTag?.id) return <div>Tag not found!</div>;
  if (!sceneData?.queryScenes) return <div>Scene data not found!</div>;

  const totalPages = Math.ceil(sceneData.queryScenes.count / 20);

  const scenes = sceneData.queryScenes.scenes.map((scene) => (
    <SceneCard key={scene.id} performance={scene} />
  ));

  return (
    <>
      <div className="row no-gutters">
        <h3 className="col-4 mr-auto">
          <span className="mr-2">Tag:</span>
          {tag.findTag.deleted ? (
            <del>{tag.findTag.name}</del>
          ) : (
            <em>{tag.findTag.name}</em>
          )}
        </h3>
        <Link
          to={`/tags/${encodeURI(encodeURI(tag.findTag.name))}/edit`}
          className="mr-2"
        >
          <Button>Edit</Button>
        </Link>
        <Link
          to={`/tags/${encodeURI(encodeURI(tag.findTag.name))}/merge`}
          className="mr-2"
        >
          <Button>Merge into</Button>
        </Link>
        {!tag.findTag.deleted && (
          <DeleteButton
            onClick={handleDelete}
            disabled={deleting}
            message="Do you want to delete tag?"
          />
        )}
      </div>
      <Tabs activeKey={activeTab} id="tag-tabs" mountOnEnter onSelect={setTab}>
        <Tab eventKey="scenes" title="Scenes">
          <div className="row">
            <Pagination onClick={setPage} pages={totalPages} active={page} />
          </div>
          <div className="performers row">{scenes}</div>
          <div className="row">
            <Pagination onClick={setPage} pages={totalPages} active={page} />
          </div>
        </Tab>
        <Tab eventKey="edits" title="Edits">
          <EditList type={TargetTypeEnum.TAG} id={tag.findTag.id} />
        </Tab>
      </Tabs>
    </>
  );
};

export default TagComponent;
