import type { FC } from "react";
import { Route, Routes } from "react-router-dom";

import Edit from "./Edit";
import Edits from "./Edits";
import EditUpdate from "./EditUpdate";
import EditAmend from "./EditAmend";

const SceneRoutes: FC = () => (
  <Routes>
    <Route path="/" element={<Edits />} />
    <Route path="/:id/update" element={<EditUpdate />} />
    <Route path="/:id/amend" element={<EditAmend />} />
    <Route path="/:id/*" element={<Edit />} />
  </Routes>
);

export default SceneRoutes;
