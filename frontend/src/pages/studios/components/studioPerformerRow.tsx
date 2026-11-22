import { type FC, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { LoadingIndicator } from "src/components/fragments";
import GalleryCard from "src/components/galleryCard";
import Pagination from "src/components/pagination";
import PerformerCard from "src/components/performerCard";
import SceneCard from "src/components/sceneCard";
import {
  type PairingSceneFragment,
  type QueryGalleryFragment,
  useStudioPerformerGalleries,
  useStudioPerformerScenes,
} from "src/graphql";

interface Props {
  studioId: string;
  performer: React.ComponentProps<typeof PerformerCard>["performer"];
  sceneCount: number;
  firstPage: PairingSceneFragment[];
  galleryCount: number;
  firstGalleryPage: QueryGalleryFragment[];
  perPage: number;
}

// The first page arrives with the performer list, so only later pages query
export const StudioPerformerRow: FC<Props> = ({
  studioId,
  performer,
  sceneCount,
  firstPage,
  galleryCount,
  firstGalleryPage,
  perPage,
}) => {
  const [page, setPage] = useState(1);
  const [galleryPage, setGalleryPage] = useState(1);

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
  const { data: galleryData, loading: loadingGalleries } =
    useStudioPerformerGalleries(
      {
        studioId,
        performerId: performer.id,
        page: galleryPage,
        per_page: perPage,
      },
      galleryPage === 1,
    );
  const galleries =
    galleryPage === 1
      ? firstGalleryPage
      : (galleryData?.findPerformer?.queryGalleries.galleries ?? []);

  return (
    <Row>
      <Col xs={3}>
        <PerformerCard performer={performer} />
      </Col>
      <Col xs={9}>
        <div className="d-flex align-items-start">
          <b className="mt-2">
            {new Intl.NumberFormat().format(sceneCount)} scenes
            {galleryCount > 0 &&
              ` • ${new Intl.NumberFormat().format(galleryCount)} galleries`}
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
        {!!galleryCount && (
          <>
            <div className="d-flex align-items-start mt-3">
              <b className="mt-2">Galleries</b>
              {galleryCount > perPage && (
                <Pagination
                  onClick={setGalleryPage}
                  count={galleryCount}
                  perPage={perPage}
                  active={galleryPage}
                />
              )}
            </div>
            {loadingGalleries ? (
              <LoadingIndicator message="Loading galleries..." />
            ) : (
              <Row>
                {galleries.map((gallery) => (
                  <Col xs={4} key={gallery.id}>
                    <GalleryCard gallery={gallery} />
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}
      </Col>
    </Row>
  );
};
