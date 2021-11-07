import { FC } from "react";

import { useCategory } from "src/graphql";
import ChangeRow from "src/components/changeRow";

interface CategoryChangeRowProps {
  newCategoryID?: string | null;
  oldCategoryID?: string | null;
  showDiff?: boolean;
}

const CategoryChangeRow: FC<CategoryChangeRowProps> = ({
  newCategoryID,
  oldCategoryID,
  showDiff = false,
}) => {
  const { data: newData } = useCategory(
    { id: newCategoryID ?? "" },
    !newCategoryID
  );
  const { data: oldData } = useCategory(
    { id: oldCategoryID ?? "" },
    !oldCategoryID
  );

  return (
    <ChangeRow
      name="Category"
      oldValue={oldData?.findTagCategory?.name}
      newValue={newData?.findTagCategory?.name}
      showDiff={showDiff}
    />
  );
};

export default CategoryChangeRow;
