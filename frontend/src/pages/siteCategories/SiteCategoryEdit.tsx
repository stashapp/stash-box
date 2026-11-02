import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";

import { ROUTE_SITE_CATEGORY } from "src/constants/route";
import {
  type SiteCategoryCreateInput,
  type SiteCategoryQuery,
  useUpdateSiteCategory,
} from "src/graphql";
import SiteCategoryForm from "./siteCategoryForm";

type SiteCategory = NonNullable<SiteCategoryQuery["findSiteCategory"]>;

interface Props {
  category: SiteCategory;
}

const UpdateSiteCategory: FC<Props> = ({ category }) => {
  const navigate = useNavigate();
  const [updateCategory] = useUpdateSiteCategory({
    onCompleted: (result) => {
      if (result?.siteCategoryUpdate?.id)
        navigate({
          to: ROUTE_SITE_CATEGORY,
          params: { id: String(result.siteCategoryUpdate.id) },
        });
    },
  });

  const doUpdate = (insertData: SiteCategoryCreateInput) => {
    updateCategory({
      variables: {
        categoryData: {
          id: category.id,
          ...insertData,
        },
      },
    });
  };

  return (
    <div>
      <h3>
        Update <em>{category.name}</em>
      </h3>
      <hr />
      <SiteCategoryForm
        callback={doUpdate}
        category={category}
        id={category.id}
      />
    </div>
  );
};

export default UpdateSiteCategory;
