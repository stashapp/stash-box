import React from "react";
import { useMutation } from "@apollo/react-hooks";
import { useHistory } from "react-router-dom";
import { loader } from "graphql.macro";

import { Tag_findTag as Tag } from "src/definitions/Tag";
import {
  TagEditMutation as TagEdit,
  TagEditMutationVariables,
} from "src/definitions/TagEditMutation";
import {
  OperationEnum,
  TagEditDetailsInput,
} from "src/definitions/globalTypes";

import TagForm from "src/components/tagForm";

const TagEditMutation = loader("src/mutations/TagEdit.gql");

const TagAddComponent: React.FC = () => {
  const history = useHistory();
  const [insertTagEdit] = useMutation<TagEdit, TagEditMutationVariables>(
    TagEditMutation,
    {
      onCompleted: (data) => {
        if (data.tagEdit.id) history.push(`/edits/${data.tagEdit.id}`);
      },
    }
  );

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

  const emptyTag = {
    id: "",
    name: "",
    description: "",
  } as Tag;

  return (
    <div>
      <h2>Add new tag</h2>
      <hr />
      <TagForm tag={emptyTag} callback={doInsert} />
    </div>
  );
};

export default TagAddComponent;
