import { createRoute } from "@tanstack/react-router";
import { narrowRoute } from "src/routing/layouts";
import { validateImageReviewSearch } from "src/routing/searchValidators";
import ImageReview from "./ImageReview";

export const ImageReviewPage = () => <ImageReview />;

export default ImageReviewPage;

const imageReviewRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "image-review",
  validateSearch: validateImageReviewSearch,
});

const imageReviewIndexRoute = createRoute({
  getParentRoute: () => imageReviewRoute,
  path: "/",
  component: ImageReviewPage,
});

export const imageReviewRoutes = imageReviewRoute.addChildren([
  imageReviewIndexRoute,
]);
