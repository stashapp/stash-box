import { flatMap, uniq } from "lodash-es";
import { type FC, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import TagSelect from "src/components/tagSelect";
import {
  OperationEnum,
  type TagFragment as Tag,
  type TagEditDetailsInput,
  useTagEdit,
} from "src/graphql";
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
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [mergeSources, setMergeSources] = useState<TagSlim[]>([]);
  const [insertTagEdit, { loading: saving }] = useTagEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.tagEdit.id) navigate(editHref(data.tagEdit));
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
          <label htmlFor="tag-merge-source-select" className="form-label">
            Merge sources
          </label>
          <TagSelect
            tags={[]}
            onChange={(tags) => setMergeSources(tags)}
            message="Select tags to merge:"
            excludeTags={[tag.id, ...mergeSources.map((t) => t.id)]}
            inputId="tag-merge-source-select"
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
