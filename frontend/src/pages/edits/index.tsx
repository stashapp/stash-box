import type { FC } from "react";
import { Route, Routes } from "react-router-dom";

import Edit from "./Edit";
import EditAmend from "./EditAmend";
import Edits from "./Edits";
import EditUpdate from "./EditUpdate";

const SceneRoutes: FC = () => (
  <Routes>
    <Route path="/" element={<Edits />} />
    <Route path="/:id/update" element={<EditUpdate />} />
    <Route path="/:id/amend" element={<EditAmend />} />
    <Route path="/:id/*" element={<Edit />} />
  </Routes>
);

export default SceneRoutes;
