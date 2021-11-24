import { FC, useState } from "react";
import { useHistory } from "react-router-dom";
import { Col, Row } from "react-bootstrap";

import { useTagEdit, OperationEnum, TagEditDetailsInput } from "src/graphql";
import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";

import TagSelect from "src/components/tagSelect";
import { editHref } from "src/utils";
import TagForm from "./tagForm";

interface Props {
  tag: Tag;
}

const TagMerge: FC<Props> = ({ tag }) => {
  const history = useHistory();
  const [mergeSources, setMergeSources] = useState<string[]>([]);
  const [insertTagEdit, { loading: saving }] = useTagEdit({
    onCompleted: (data) => {
      if (data.tagEdit.id) history.push(editHref(data.tagEdit));
    },
  });

  const doUpdate = (insertData: TagEditDetailsInput, editNote: string) => {
    insertTagEdit({
      variables: {
        tagData: {
          edit: {
            id: tag.id,
            operation: OperationEnum.MERGE,
            merge_source_ids: mergeSources,
            comment: editNote,
          },
          details: insertData,
        },
      },
    });
  };

  return (
    <div>
      <h3>
        Merge tags into <em>{tag.name}</em>
      </h3>
      <hr />
      <Row className="g-0">
        <Col xs={6}>
          <TagSelect
            tags={[]}
            onChange={(tags) => setMergeSources(tags.map((t) => t.id))}
            message="Select tags to merge:"
            excludeTags={[tag.id, ...mergeSources]}
          />
        </Col>
      </Row>
      <hr className="my-4" />
      <h5>
        Modify <em>{tag.name}</em>
      </h5>
      <Row className="g-0">
        <TagForm tag={tag} callback={doUpdate} saving={saving} />
      </Row>
    </div>
  );
};

export default TagMerge;
