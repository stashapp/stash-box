import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import Title from "src/components/title";
import { ROUTE_EDIT } from "src/constants";
import {
  type EditUpdateQuery,
  type GalleryEditDetailsInput,
  useGalleryEditUpdate,
} from "src/graphql";
import { createHref, isGallery, isGalleryEdit } from "src/utils";
import GalleryForm from "./galleryForm";

type Edit = NonNullable<EditUpdateQuery["findEdit"]>;

export const GalleryEditUpdate: FC<{ edit: Edit }> = ({ edit }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [update, { loading }] = useGalleryEditUpdate({
    onCompleted: (result) =>
      navigate(createHref(ROUTE_EDIT, result.galleryEditUpdate)),
    onError: (submissionError) => setError(submissionError.message),
  });

  const galleryDetails = edit.details;
  if (
    !isGalleryEdit(galleryDetails) ||
    (edit.target && !isGallery(edit.target))
  )
    return null;

  const submit = (details: GalleryEditDetailsInput, note: string) =>
    update({
      variables: {
        id: edit.id,
        galleryData: {
          edit: {
            id: edit.target?.id,
            operation: edit.operation,
            comment: note,
            merge_source_ids: edit.merge_sources?.map((source) => source.id),
          },
          details: {
            ...details,
            draft_id: galleryDetails.draft_id,
          },
        },
      },
    });

  return (
    <>
      <Title page={`Update gallery edit`} />
      <GalleryForm
        gallery={edit.target ?? undefined}
        initial={{
          title: galleryDetails.title ?? edit.target?.title,
          ...(galleryDetails.code !== null ||
          (edit.old_details?.__typename === "GalleryEdit" &&
            edit.old_details.code !== null)
            ? { code: galleryDetails.code }
            : {}),
          ...(galleryDetails.date !== null ||
          (edit.old_details?.__typename === "GalleryEdit" &&
            edit.old_details.date !== null)
            ? { date: galleryDetails.date }
            : {}),
          ...(galleryDetails.photographer !== null ||
          (edit.old_details?.__typename === "GalleryEdit" &&
            edit.old_details.photographer !== null)
            ? { photographer: galleryDetails.photographer }
            : {}),
          ...(galleryDetails.details !== null ||
          (edit.old_details?.__typename === "GalleryEdit" &&
            edit.old_details.details !== null)
            ? { details: galleryDetails.details }
            : {}),
          ...(galleryDetails.studio !== null ||
          (edit.old_details?.__typename === "GalleryEdit" &&
            edit.old_details.studio !== null)
            ? { studio: galleryDetails.studio }
            : {}),
          ...(galleryDetails.cover !== null ||
          (edit.old_details?.__typename === "GalleryEdit" &&
            edit.old_details.cover !== null)
            ? { cover: galleryDetails.cover }
            : {}),
          urls: galleryDetails.urls,
          performers: galleryDetails.performers,
          scenes: galleryDetails.scenes,
          tags: galleryDetails.tags,
          images: galleryDetails.gallery_images ?? undefined,
        }}
        callback={submit}
        saving={loading}
        isCreate={!edit.target}
      />
      {error && (
        <div className="text-danger text-end col-9">Error: {error}</div>
      )}
    </>
  );
};
