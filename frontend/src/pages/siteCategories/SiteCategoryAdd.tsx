import type { FC } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTE_SITE_CATEGORY } from "src/constants/route";
import { type SiteCategoryCreateInput, useAddSiteCategory } from "src/graphql";
import { createHref } from "src/utils";
import SiteCategoryForm from "./siteCategoryForm";

const AddSiteCategory: FC = () => {
  const navigate = useNavigate();
  const [createCategory] = useAddSiteCategory({
    onCompleted: (data) => {
      if (data?.siteCategoryCreate?.id)
        navigate(createHref(ROUTE_SITE_CATEGORY, data.siteCategoryCreate));
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
