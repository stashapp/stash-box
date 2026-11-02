import EditList from "src/components/list/EditList";
import Title from "src/components/title";
import { EDIT_PAGE_DEFAULTS } from "src/utils/listFilters";

export default function Edits() {
  return (
    <>
      <Title page="Edits" />
      <h3>Edits</h3>
      <EditList {...EDIT_PAGE_DEFAULTS} />
    </>
  );
}
