import React from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";

import { Category, CategoryVariables } from "src/definitions/Category";

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
    <div className="row">
      <b className="col-2 text-right">Category</b>
      {showDiff && <span className="col-2 bg-danger">{oldCategory ?? ""}</span>}
      <span className={`col-2 ${showDiff && "bg-success"}`}>
        {data?.findTagCategory?.name}
      </span>
    </div>
  );
};

export default CategoryChangeRow;
