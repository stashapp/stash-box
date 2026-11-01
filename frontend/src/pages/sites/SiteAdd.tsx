import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";

import { type SiteCreateInput, useAddSite } from "src/graphql";
import SiteForm from "./siteForm";

const AddSite: FC = () => {
  const navigate = useNavigate();
  const [createSite] = useAddSite({
    onCompleted: (data) => {
      if (data?.siteCreate?.id)
        navigate({ to: "/sites/$id", params: data.siteCreate });
    },
  });

  const doInsert = (insertData: SiteCreateInput) => {
    createSite({
      variables: {
        siteData: insertData,
      },
    });
  };

  return (
    <div>
      <h3>Add new site</h3>
      <hr />
      <SiteForm callback={doInsert} />
    </div>
  );
};

export default AddSite;
