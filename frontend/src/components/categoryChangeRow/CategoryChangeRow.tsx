import React from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";

import { Category, CategoryVariables } from "src/definitions/Category";
import ChangeRow from "src/components/changeRow";

const CategoryQuery = loader("src/queries/Category.gql");

interface CategoryChangeRowProps {
  newCategoryID?: string | null;
  oldCategory?: string | null;
  showDiff?: boolean;
}

const CategoryChangeRow: React.FC<CategoryChangeRowProps> = ({
  newCategoryID,
  oldCategory,
  showDiff = false,
}) => {
  const { data } = useQuery<Category, CategoryVariables>(CategoryQuery, {
    variables: {
      id: newCategoryID ?? "",
    },
    skip: !newCategoryID,
  });

  return (
    <ChangeRow
      name="Category"
      oldValue={oldCategory}
      newValue={data?.findTagCategory?.name}
      showDiff={showDiff}
    />
  );
};

export default CategoryChangeRow;
