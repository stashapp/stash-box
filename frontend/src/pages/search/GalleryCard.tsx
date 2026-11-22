import {
  faCalendar,
  faImages,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon, Thumbnail } from "src/components/fragments";
import type { SearchAllQuery } from "src/graphql";
import { galleryHref } from "src/utils";

export type Gallery = NonNullable<
  SearchAllQuery["searchGalleries"]["galleries"][number]
>;

export const GalleryCard: FC<{ gallery: Gallery }> = ({ gallery }) => (
  <Link to={galleryHref(gallery)} className="SearchPage-gallery">
    <Card>
      <Thumbnail
        image={gallery.cover?.url}
        className="SearchPage-gallery-image"
        size={300}
      />
      <div className="ms-3 w-100">
        <h5>
          {gallery.title}
          <small className="text-muted ms-2">
            {gallery.image_count} image{gallery.image_count !== 1 && "s"}
          </small>
        </h5>
        <div>
          <div>
            <Icon icon={faCalendar} />
            {gallery.date}
          </div>
          <div>
            <Icon icon={faImages} />
            {gallery.studio?.name ?? "Unknown"}
            <small className="text-muted ms-2">{gallery.code}</small>
          </div>
          {gallery.performers.length > 0 && (
            <div>
              <Icon icon={faUsers} />
              {gallery.performers
                .map((performer) => performer.as ?? performer.performer.name)
                .join(", ")}
            </div>
          )}
        </div>
      </div>
    </Card>
  </Link>
);
