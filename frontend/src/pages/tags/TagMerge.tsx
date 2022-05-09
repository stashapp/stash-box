import { FC, useState } from "react";
import { useHistory } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import { flatMap, uniq } from "lodash-es";

import { useTagEdit, OperationEnum, TagEditDetailsInput } from "src/graphql";
import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";

import TagSelect from "src/components/tagSelect";
import { editHref } from "src/utils";
import TagForm from "./tagForm";

interface Props {
  tag: Tag;
}

type TagSlim = {
  id: string;
  name: string;
  aliases: string[];
};

const TagMerge: FC<Props> = ({ tag }) => {
  const history = useHistory();
  const [submissionError, setSubmissionError] = useState("");
  const [mergeSources, setMergeSources] = useState<TagSlim[]>([]);
  const [insertTagEdit, { loading: saving }] = useTagEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.tagEdit.id) history.push(editHref(data.tagEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  const doUpdate = (insertData: TagEditDetailsInput, editNote: string) => {
    insertTagEdit({
      variables: {
        tagData: {
          edit: {
            id: tag.id,
            operation: OperationEnum.MERGE,
            merge_source_ids: mergeSources.map((t) => t.id),
            comment: editNote,
          },
          details: insertData,
        },
      },
    });
  };

  const aliases = uniq([
    ...tag.aliases,
    ...mergeSources.map((t) => t.name),
    ...flatMap(mergeSources, (t) => t.aliases),
  ]);

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
            onChange={(tags) => setMergeSources(tags)}
            message="Select tags to merge:"
            excludeTags={[tag.id, ...mergeSources.map((t) => t.id)]}
          />
        </Col>
      </Row>
      <hr className="my-4" />
      <h5>
        Modify <em>{tag.name}</em>
      </h5>
      <Row className="g-0">
        {submissionError && (
          <div className="text-danger mb-2">Error: {submissionError}</div>
        )}
        <TagForm
          tag={tag}
          callback={doUpdate}
          saving={saving}
          initial={{ aliases }}
        />
      </Row>
    </div>
  );
};

export default TagMerge;
