import { Outlet } from "@tanstack/react-router";
import Title from "src/components/title";
import { useEditFilter } from "src/hooks";
import { EDIT_PAGE_DEFAULTS } from "src/utils/listFilters";

export default function Edits() {
  const { editFilter } = useEditFilter(EDIT_PAGE_DEFAULTS);
  return (
    <>
      <Title page="Edits" />
      <h3>Edits</h3>
      {editFilter}
      <Outlet />
    </>
  );
}
