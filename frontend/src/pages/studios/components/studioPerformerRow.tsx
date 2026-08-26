import { type FC, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { LoadingIndicator } from "src/components/fragments";
import Pagination from "src/components/pagination";
import PerformerCard from "src/components/performerCard";
import SceneCard from "src/components/sceneCard";
import {
  type PairingSceneFragment,
  useStudioPerformerScenes,
} from "src/graphql";

interface Props {
  studioId: string;
  performer: React.ComponentProps<typeof PerformerCard>["performer"];
  sceneCount: number;
  firstPage: PairingSceneFragment[];
  perPage: number;
}

// The first page arrives with the performer list, so only later pages query
export const StudioPerformerRow: FC<Props> = ({
  studioId,
  performer,
  sceneCount,
  firstPage,
  perPage,
}) => {
  const [page, setPage] = useState(1);

  const { data, loading } = useStudioPerformerScenes(
    {
      studioId,
      performerId: performer.id,
      page,
      per_page: perPage,
    },
    page === 1,
  );

  const scenes =
    page === 1 ? firstPage : (data?.findPerformer?.queryScenes.scenes ?? []);

  return (
    <Row>
      <Col xs={3}>
        <PerformerCard performer={performer} />
      </Col>
      <Col xs={9}>
        <div className="d-flex align-items-start">
          <b className="mt-2">
            {new Intl.NumberFormat().format(sceneCount)} scenes
          </b>
          {sceneCount > perPage && (
            <Pagination
              onClick={setPage}
              count={sceneCount}
              perPage={perPage}
              active={page}
            />
          )}
        </div>
        {loading ? (
          <LoadingIndicator message="Loading scenes..." />
        ) : (
          <Row>
            {scenes.map((scene) => (
              <Col xs={4} key={scene.id}>
                <SceneCard scene={scene} />
              </Col>
            ))}
          </Row>
        )}
      </Col>
    </Row>
  );
};
