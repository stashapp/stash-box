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
  const { id } = useParams();
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
      <h2>
        Edit
        <strong className="ml-2">{data.findStudio.name}</strong>
      </h2>
      <hr />
      <StudioForm studio={data.findStudio} callback={doUpdate} />
    </div>
  );
};

export default StudioEdit;
