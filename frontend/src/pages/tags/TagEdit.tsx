import React from "react";
import { useParams, useHistory } from "react-router-dom";

import {
  useTag,
  useTagEdit,
  OperationEnum,
  TagEditDetailsInput,
} from "src/graphql";

import { LoadingIndicator } from "src/components/fragments";
import { ROUTE_EDIT } from "src/constants/route";
import { createHref } from "src/utils/route";
import TagForm from "./tagForm";

const TagAddComponent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { data: tag, loading: loadingTag } = useTag({ id });
  const [insertTagEdit] = useTagEdit({
    onCompleted: (data) => {
      if (data.tagEdit.id) history.push(createHref(ROUTE_EDIT, data.tagEdit));
    },
  });

  if (loadingTag) return <LoadingIndicator message="Loading tag..." />;
  if (!tag?.findTag?.id) return <div>Tag not found</div>;

  const doUpdate = (insertData: TagEditDetailsInput, editNote: string) => {
    insertTagEdit({
      variables: {
        tagData: {
          edit: {
            id: tag.findTag?.id,
            operation: OperationEnum.MODIFY,
            comment: editNote,
          },
          details: insertData,
        },
      },
    });
  };

  return (
    <div>
      <h2>Edit tag</h2>
      <hr />
      <TagForm tag={tag.findTag} callback={doUpdate} />
    </div>
  );
};

export default TagAddComponent;
