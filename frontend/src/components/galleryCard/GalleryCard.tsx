import { faImages } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon, Thumbnail } from "src/components/fragments";
import type { QueryGalleryFragment } from "src/graphql";
import { galleryHref, imageType, studioHref } from "src/utils";

const GalleryCard: FC<{ gallery: QueryGalleryFragment }> = ({ gallery }) => (
  <Card className="GalleryCard">
    <Card.Body className="GalleryCard-body">
      <Link className="GalleryCard-image" to={galleryHref(gallery)}>
        <Thumbnail
          alt={gallery.title ?? ""}
          className={imageType(gallery.cover ?? undefined)}
          image={gallery.cover?.url}
          size={300}
        />
      </Link>
    </Card.Body>
    <Card.Footer>
      <div className="d-flex">
        <Link
          className="text-truncate w-100"
          to={galleryHref(gallery)}
          title={gallery.title ?? ""}
        >
          <h6 className="text-truncate">{gallery.title}</h6>
        </Link>
        <span className="text-muted text-nowrap">
          {gallery.image_count} image{gallery.image_count === 1 ? "" : "s"}
        </span>
      </div>
      <div className="d-flex text-muted">
        <strong className="me-2">{gallery.date}</strong>
        {gallery.studio && (
          <Link
            to={studioHref(gallery.studio)}
            className="text-truncate ms-auto GalleryCard-studio-name"
          >
            <Icon icon={faImages} className="me-1" />
            {gallery.studio.name}
          </Link>
        )}
      </div>
    </Card.Footer>
  </Card>
);

export default GalleryCard;
