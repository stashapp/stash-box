import React from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";

import { Category, CategoryVariables } from "src/definitions/Category";
import ChangeRow from "src/components/changeRow";

const CategoryQuery = loader("src/queries/Category.gql");

interface CategoryChangeRowProps {
  newCategoryID?: string | null;
  oldCategoryID?: string | null;
  showDiff?: boolean;
}

const CategoryChangeRow: React.FC<CategoryChangeRowProps> = ({
  newCategoryID,
  oldCategoryID,
  showDiff = false,
}) => {
  const { data: newData } = useQuery<Category, CategoryVariables>(
    CategoryQuery,
    {
      variables: {
        id: newCategoryID ?? "",
      },
      skip: !newCategoryID,
    }
  );
  const { data: oldData } = useQuery<Category, CategoryVariables>(
    CategoryQuery,
    {
      variables: {
        id: oldCategoryID ?? "",
      },
      skip: !oldCategoryID,
    }
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
