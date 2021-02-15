import React from "react";
import { useHistory } from "react-router-dom";

import { useAddStudio, StudioCreateInput } from "src/graphql";
import { Studio_findStudio as Studio } from "src/graphql/definitions/Studio";
import { studioHref } from "src/utils";

import StudioForm from "./studioForm";

const StudioAdd: React.FC = () => {
  const history = useHistory();
  const [insertStudio] = useAddStudio({
    onCompleted: (data) => {
      if (data.studioCreate?.id) history.push(studioHref(data.studioCreate));
    },
  });

  const doInsert = (insertData: StudioCreateInput) => {
    insertStudio({ variables: { studioData: insertData } });
  };

  const emptyStudio: Studio = {
    id: "",
    name: "",
    urls: [],
    images: [],
    __typename: "Studio",
  };

  return (
    <div>
      <h2>Add new studio</h2>
      <hr />
      <StudioForm studio={emptyStudio} callback={doInsert} />
    </div>
  );
};

export default StudioAdd;
