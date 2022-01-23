import { FC, useState } from "react";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { getImage } from "src/utils";
import { LoadingIndicator, Icon } from "src/components/fragments";
import { ImageFragment } from "src/graphql";

const CLASSNAME = "Image";

interface Props {
  images: ImageFragment[] | ImageFragment;
  orientation?: "landscape" | "portrait";
}

const Image: FC<Props> = ({ images, orientation = "landscape" }) => {
  const url = Array.isArray(images)
    ? getImage(images, orientation)
    : images.url;
  const [imageState, setImageState] = useState<"loading" | "error" | "done">(
    "loading"
  );

  if (!url)
    return <div className={`${CLASSNAME}-missing`}>Scene has no image.</div>;

  return (
    <>
      <img
        alt=""
        src={url}
        className={`${CLASSNAME}-image`}
        onLoad={() => setImageState("done")}
        onError={() => setImageState("error")}
      />
      {imageState === "loading" && (
        <LoadingIndicator message="Loading image..." delay={400} />
      )}
      {imageState === "error" && (
        <div>
          <span className="me-2">
            <Icon icon={faTimes} color="red" />
          </span>
          <span>Failed to load image</span>
        </div>
      )}
    </>
  );
};

const ImageContainer: FC<Props> = (props) => (
  <div className={CLASSNAME}>
    <Image {...props} />
  </div>
);
export default ImageContainer;
