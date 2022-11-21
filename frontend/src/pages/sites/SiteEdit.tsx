import { FC } from "react";
import { useNavigate } from "react-router-dom";

import { useUpdateSite, SiteCreateInput, SiteQuery } from "src/graphql";
import { siteHref } from "src/utils";
import SiteForm from "./siteForm";

type Site = NonNullable<SiteQuery["findSite"]>;

interface Props {
  site: Site;
}

const UpdateSite: FC<Props> = ({ site }) => {
  const navigate = useNavigate();
  const [updateSite] = useUpdateSite({
    onCompleted: (result) => {
      if (result?.siteUpdate?.id) navigate(siteHref(result.siteUpdate));
    },
  });

  const doUpdate = (insertData: SiteCreateInput) => {
    updateSite({
      variables: {
        siteData: {
          id: site.id,
          ...insertData,
        },
      },
    });
  };

  return (
    <div>
      <h3>
        Update <em>{site.name}</em>
      </h3>
      <hr />
      <SiteForm callback={doUpdate} site={site} />
    </div>
  );
};

export default UpdateSite;
