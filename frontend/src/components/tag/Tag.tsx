import React from "react";
import { useQuery } from "@apollo/react-hooks";
import ScenesQuery from "src/queries/Scenes.gql";
import TagQuery from "src/queries/Tag.gql";
import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import { Tag, TagVariables } from "src/definitions/Tag";
import {
  SortDirectionEnum,
  CriterionModifier,
} from "src/definitions/globalTypes";
import { useParams } from "react-router-dom";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import SceneCard from "src/components/sceneCard";
import { LoadingIndicator } from "src/components/fragments";

const TagComponent: React.FC = () => {
  const { name } = useParams();
  const { page, setPage } = usePagination();
  const { data: tag } = useQuery<Tag, TagVariables>(TagQuery, {
    variables: { name },
  });
  const { data } = useQuery<Scenes, ScenesVariables>(ScenesQuery, {
    skip: !tag,
    variables: {
      filter: {
        page,
        per_page: 20,
        sort: "DATE",
        direction: SortDirectionEnum.DESC,
      },
      sceneFilter: {
        tags: {
          value: [tag && tag.findTag.id],
          modifier: CriterionModifier.INCLUDES,
        },
      },
    },
  });

  if (!data) return <LoadingIndicator message="Loading scenes..." />;

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
