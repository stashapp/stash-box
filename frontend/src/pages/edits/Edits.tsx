import React from "react";

import { EditList } from "src/components/list";
import Title from "src/components/title";

const EditsComponent: React.FC = () => (
  <>
    <Title page="Edits" />
    <h3>Edits</h3>
    <EditList />
  </>
);

export default EditsComponent;
