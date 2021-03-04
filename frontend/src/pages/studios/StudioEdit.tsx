import React from "react";
import { useHistory, useParams } from "react-router-dom";

import {
  useStudio,
  useUpdateStudio,
  StudioCreateInput,
  StudioUpdateInput,
} from "src/graphql";
import { LoadingIndicator } from "src/components/fragments";
import { studioHref } from "src/utils";
import StudioForm from "./studioForm";

const StudioEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { loading, data } = useStudio({ id });
  const [updateStudio] = useUpdateStudio({
    onCompleted: () => {
      if (data?.findStudio?.id) history.push(studioHref(data.findStudio));
    },
  });

  const doUpdate = (updateData: StudioCreateInput) => {
    if (!id) return;
    const createData: StudioUpdateInput = {
      ...updateData,
      id,
    };
    updateStudio({ variables: { input: createData } });
  };

  if (loading) return <LoadingIndicator message="Loading studio..." />;

  if (!id || !data?.findStudio) return <div>Studio not found!</div>;

  return (
    <div>
      <h3>
        Edit
        <strong className="ml-2">{data.findStudio.name}</strong>
      </h3>
      <hr />
      <StudioForm
        studio={data.findStudio}
        callback={doUpdate}
        showNetworkSelect={data.findStudio.child_studios.length === 0}
      />
    </div>
  );
};

export default StudioEdit;
