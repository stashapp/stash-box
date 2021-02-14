import React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useParams, useHistory } from "react-router-dom";
import { loader } from "graphql.macro";

import { Tag, TagVariables } from "src/definitions/Tag";
import {
  TagEditMutation as TagEdit,
  TagEditMutationVariables,
} from "src/definitions/TagEditMutation";
import {
  OperationEnum,
  TagEditDetailsInput,
} from "src/definitions/globalTypes";

import { LoadingIndicator } from "src/components/fragments";
import { ROUTE_EDIT } from "src/constants/route";
import { createHref } from "src/utils/route";
import TagForm from "./tagForm";

const TagQuery = loader("src/queries/Tag.gql");
const TagEditMutation = loader("src/mutations/TagEdit.gql");

const TagAddComponent: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const { data: tag, loading: loadingTag } = useQuery<Tag, TagVariables>(
    TagQuery,
    { variables: { id } }
  );
  const [insertTagEdit] = useMutation<TagEdit, TagEditMutationVariables>(
    TagEditMutation,
    {
      onCompleted: (data) => {
        if (data.tagEdit.id) history.push(createHref(ROUTE_EDIT, data.tagEdit));
      },
    }
  );

  if (loadingTag) return <LoadingIndicator message="Loading tag..." />;
  if (!tag?.findTag?.id) return <div>Tag not found</div>;

  const doUpdate = (insertData: TagEditDetailsInput) => {
    insertTagEdit({
      variables: {
        tagData: {
          edit: {
            id: tag.findTag?.id,
            operation: OperationEnum.MODIFY,
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
