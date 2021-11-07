import { FC } from "react";
import { useHistory } from "react-router-dom";

import { useTagEdit, OperationEnum, TagEditDetailsInput } from "src/graphql";
import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";

import { ROUTE_EDIT } from "src/constants/route";
import { createHref } from "src/utils/route";
import TagForm from "./tagForm";

interface Props {
  tag: Tag;
}

const TagEdit: FC<Props> = ({ tag }) => {
  const history = useHistory();
  const [insertTagEdit, { loading: saving }] = useTagEdit({
    onCompleted: (data) => {
      if (data.tagEdit.id) history.push(createHref(ROUTE_EDIT, data.tagEdit));
    },
  });

  const doUpdate = (insertData: TagEditDetailsInput, editNote: string) => {
    insertTagEdit({
      variables: {
        tagData: {
          edit: {
            id: tag.id,
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
      <h3>Edit tag</h3>
      <hr />
      <TagForm tag={tag} callback={doUpdate} saving={saving} />
    </div>
  );
};

export default TagEdit;
