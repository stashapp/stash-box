import type { FC } from "react";
import { Route, Routes } from "react-router-dom";

import Edit from "./Edit";
import Edits from "./Edits";
import EditUpdate from "./EditUpdate";
import ModEditUpdate from "./ModEditUpdate";

const SceneRoutes: FC = () => (
  <Routes>
    <Route path="/" element={<Edits />} />
    <Route path="/:id/update" element={<EditUpdate />} />
    <Route path="/:id/amend" element={<ModEditUpdate />} />
    <Route path="/:id/*" element={<Edit />} />
  </Routes>
);

export default SceneRoutes;
