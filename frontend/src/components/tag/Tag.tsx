import React from "react";
import { useQuery } from "@apollo/react-hooks";
import { useParams } from "react-router-dom";
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
  const { data: tag, loading } = useQuery<Tag, TagVariables>(TagQuery, {
    variables: { name },
  });
  const { data } = useQuery<Scenes, ScenesVariables>(ScenesQuery, {
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

  if (!loading) return <LoadingIndicator message="Loading scenes..." />;

  if (!tag?.findTag?.id || !data) return <div>Tag not found!</div>;

  const totalPages = Math.ceil(data.queryScenes.count / 20);

  const scenes = data.queryScenes.scenes.map((scene) => (
    <SceneCard key={scene.id} performance={scene} />
  ));

  return (
    <>
      <div className="row">
        <h3 className="col-4">
          Scenes for tag <em>{tag.findTag.description}</em>
        </h3>
        <Pagination onClick={setPage} pages={totalPages} active={page} />
      </div>
      <div className="performers row">{scenes}</div>
      <div className="row">
        <Pagination onClick={setPage} pages={totalPages} active={page} />
      </div>
    </>
  );
};

export default TagComponent;
