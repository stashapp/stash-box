import type { FC } from "react";
import { useNavigate } from "react-router-dom";

import { useAddSite, type SiteCreateInput } from "src/graphql";
import { siteHref } from "src/utils";
import SiteForm from "./siteForm";

const AddSite: FC = () => {
  const navigate = useNavigate();
  const [createSite] = useAddSite({
    onCompleted: (data) => {
      if (data?.siteCreate?.id) navigate(siteHref(data.siteCreate));
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
