import { FC } from "react";
import { useHistory } from "react-router-dom";

import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";
import { useTagEdit, OperationEnum, TagEditDetailsInput } from "src/graphql";

import { editHref } from "src/utils";
import TagForm from "./tagForm";

const TagAddComponent: FC = () => {
  const history = useHistory();
  const [insertTagEdit, { loading: saving }] = useTagEdit({
    onCompleted: (data) => {
      if (data.tagEdit.id) history.push(editHref(data.tagEdit));
    },
  });

  const doInsert = (insertData: TagEditDetailsInput, editNote: string) => {
    insertTagEdit({
      variables: {
        tagData: {
          edit: {
            operation: OperationEnum.CREATE,
            comment: editNote,
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
      <h3>Add new tag</h3>
      <hr />
      <TagForm tag={emptyTag} callback={doInsert} saving={saving} />
    </div>
  );
};

export default TagAddComponent;
