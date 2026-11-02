import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";

import {
  type SiteCreateInput,
  type SiteQuery,
  useUpdateSite,
} from "src/graphql";
import SiteForm from "./siteForm";

type Site = NonNullable<SiteQuery["findSite"]>;

interface Props {
  site: Site;
}

const UpdateSite: FC<Props> = ({ site }) => {
  const navigate = useNavigate();
  const [updateSite] = useUpdateSite({
    onCompleted: (result) => {
      if (result?.siteUpdate?.id)
        navigate({ to: "/sites/$id", params: result.siteUpdate });
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
