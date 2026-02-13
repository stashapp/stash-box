import type { FC } from "react";
import { Route, Routes } from "react-router-dom";

import Audits from "./Audits";

const AuditRoutes: FC = () => (
  <Routes>
    <Route path="/" element={<Audits />} />
  </Routes>
);

export default AuditRoutes;
