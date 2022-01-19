import { FC } from "react";
import { useHistory } from "react-router-dom";

import { Site_findSite as Site } from "src/graphql/definitions/Site";
import { useUpdateSite, SiteCreateInput } from "src/graphql";
import { siteHref } from "src/utils";
import SiteForm from "./siteForm";

interface Props {
  site: Site;
}

const UpdateSite: FC<Props> = ({ site }) => {
  const history = useHistory();
  const [updateSite] = useUpdateSite({
    onCompleted: (result) => {
      if (result?.siteUpdate?.id) history.push(siteHref(result.siteUpdate));
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
