import type { FC } from "react";
import { Route, Routes } from "react-router-dom";

import { SearchLayout } from "./SearchLayout";
import { SearchAll } from "./SearchAll";
import { SearchPerformersTab } from "./SearchPerformersTab";
import { SearchScenesTab } from "./SearchScenesTab";

const SearchRoutes: FC = () => (
  <Routes>
    <Route element={<SearchLayout />}>
      <Route index element={<SearchAll />} />
      <Route path="performers" element={<SearchPerformersTab />} />
      <Route path="scenes" element={<SearchScenesTab />} />
    </Route>
  </Routes>
);

export default SearchRoutes;
