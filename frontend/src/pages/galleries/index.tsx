import type { FC } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";
import { useGallery } from "src/graphql";
import Galleries from "./Galleries";
import Gallery from "./Gallery";
import GalleryAdd from "./GalleryAdd";
import GalleryDelete from "./GalleryDelete";
import GalleryEdit from "./GalleryEdit";

const GalleryLoader: FC = () => {
  const { id } = useParams();
  const { loading, data } = useGallery({ id: id ?? "" }, !id);
  if (loading) return <LoadingIndicator message="Loading gallery..." />;
  if (!id) return <ErrorMessage error="Gallery ID is missing" />;
  const gallery = data?.findGallery;
  if (!gallery) return <ErrorMessage error="Gallery not found." />;

  return (
    <Routes>
      <Route
        path="/edit"
        element={
          <>
            <Title page={`Edit Gallery "${gallery.title}"`} />
            <GalleryEdit gallery={gallery} />
          </>
        }
      />
      <Route
        path="/delete"
        element={
          <>
            <Title page={`Delete Gallery "${gallery.title}"`} />
            <GalleryDelete gallery={gallery} />
          </>
        }
      />
      <Route
        path="/"
        element={
          <>
            <Title page={`"${gallery.title}"`} />
            <Gallery gallery={gallery} />
          </>
        }
      />
    </Routes>
  );
};

const GalleryRoutes: FC = () => (
  <Routes>
    <Route
      path="/add"
      element={
        <>
          <Title page="Add Gallery" />
          <GalleryAdd />
        </>
      }
    />
    <Route
      path="/"
      element={
        <>
          <Title page="Galleries" />
          <Galleries />
        </>
      }
    />
    <Route path="/:id/*" element={<GalleryLoader />} />
  </Routes>
);

export default GalleryRoutes;
