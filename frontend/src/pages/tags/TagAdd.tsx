import React from "react";
import { useHistory } from "react-router-dom";

import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";
import { useTagEdit, OperationEnum, TagEditDetailsInput } from "src/graphql";

import { editHref } from "src/utils";
import TagForm from "./tagForm";

const TagAddComponent: React.FC = () => {
  const history = useHistory();
  const [insertTagEdit] = useTagEdit({
    onCompleted: (data) => {
      if (data.tagEdit.id) history.push(editHref(data.tagEdit));
    },
  });

  const doInsert = (insertData: TagEditDetailsInput) => {
    insertTagEdit({
      variables: {
        tagData: {
          edit: {
            operation: OperationEnum.CREATE,
          },
          details: insertData,
        },
      },
    });
  };

  const emptyTag: Tag = {
    id: "",
    name: "",
    description: "",
    deleted: false,
    aliases: [],
    category: null,
    __typename: "Tag",
  };

  return (
    <div>
      <h2>Add new tag</h2>
      <hr />
      <TagForm tag={emptyTag} callback={doInsert} />
    </div>
  );
};

export default TagAddComponent;
