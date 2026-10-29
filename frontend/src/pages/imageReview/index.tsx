import type { FC } from "react";
import { Route, Routes } from "react-router-dom";

import ImageReview from "./ImageReview";

const ImageReviewRoutes: FC = () => (
  <Routes>
    <Route path="/" element={<ImageReview />} />
  </Routes>
);

export default ImageReviewRoutes;
