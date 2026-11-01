import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";

import { ROUTE_SITE_CATEGORY } from "src/constants/route";
import { type SiteCategoryCreateInput, useAddSiteCategory } from "src/graphql";
import SiteCategoryForm from "./siteCategoryForm";

const AddSiteCategory: FC = () => {
  const navigate = useNavigate();
  const [createCategory] = useAddSiteCategory({
    onCompleted: (data) => {
      if (data?.siteCategoryCreate?.id)
        navigate({
          to: ROUTE_SITE_CATEGORY,
          params: { id: String(data.siteCategoryCreate.id) },
        });
    },
  });

  const doInsert = (insertData: SiteCategoryCreateInput) => {
    createCategory({
      variables: {
        categoryData: insertData,
      },
    });
  };

  return (
    <div>
      <h3>Add new site category</h3>
      <hr />
      <SiteCategoryForm callback={doInsert} />
    </div>
  );
};

export default AddSiteCategory;
