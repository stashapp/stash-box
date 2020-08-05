import React from "react";
import { useQuery } from "@apollo/react-hooks";
import { useParams } from "react-router-dom";
import { Tab, Tabs } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import { Tag, TagVariables } from "src/definitions/Tag";
import {
  SortDirectionEnum,
  CriterionModifier,
} from "src/definitions/globalTypes";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import SceneCard from "src/components/sceneCard";
import { LoadingIndicator } from "src/components/fragments";

const ScenesQuery = loader("src/queries/Scenes.gql");
const TagQuery = loader("src/queries/Tag.gql");

const TagComponent: React.FC = () => {
  const { name } = useParams();
  const { page, setPage } = usePagination();
  const { data: tag, loading: loadingTag } = useQuery<Tag, TagVariables>(
    TagQuery,
    {
      variables: { name },
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
      <h3>
        Tag: <em>{tag.findTag.name}</em>
      </h3>
      <Tabs defaultActiveKey="scenes" id="tag-tabs" mountOnEnter>
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
        </Tab>
      </Tabs>
    </>
  );
};

export default TagComponent;
