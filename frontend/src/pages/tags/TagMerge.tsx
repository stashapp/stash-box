import { type FC, useCallback, useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import TagSelect from "src/components/tagSelect";
import {
  OperationEnum,
  type TagFragment as Tag,
  type TagEditDetailsInput,
  type TagQuery,
  useTag,
  useTagEdit,
} from "src/graphql";
import { editHref } from "src/utils";
import TagForm from "./tagForm";
import { buildTagMerge } from "./tagForm/merge";

interface Props {
  tag: Tag;
}

type TagSlim = {
  id: string;
  name: string;
  aliases: string[];
};

type FullTag = NonNullable<TagQuery["findTag"]>;

// Loads full details for a merge source. The selection list omits the
// category, which the merge form needs to prefill and detect conflicts.
const SourceLoader: FC<{
  id: string;
  onLoad: (tag: FullTag) => void;
}> = ({ id, onLoad }) => {
  const { data } = useTag({ id });
  useEffect(() => {
    if (data?.findTag) onLoad(data.findTag);
  }, [data, onLoad]);
  return null;
};

const TagMerge: FC<Props> = ({ tag }) => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [mergeSources, setMergeSources] = useState<TagSlim[]>([]);
  const [sourceData, setSourceData] = useState<Record<string, FullTag>>({});

  const handleSourceLoad = useCallback((source: FullTag) => {
    setSourceData((prev) =>
      prev[source.id] ? prev : { ...prev, [source.id]: source },
    );
  }, []);
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

  const loadedSources = mergeSources
    .map((source) => sourceData[source.id])
    .filter((source): source is FullTag => source !== undefined);
  const sourcesReady = loadedSources.length === mergeSources.length;
  const { initial, conflicts } = buildTagMerge(tag, loadedSources);

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
      {mergeSources.map((source) => (
        <SourceLoader
          key={source.id}
          id={source.id}
          onLoad={handleSourceLoad}
        />
      ))}
      <hr className="my-4" />
      <h5>
        Modify <em>{tag.name}</em>
      </h5>
      <Row className="g-0">
        {submissionError && (
          <div className="text-danger mb-2">Error: {submissionError}</div>
        )}
        {sourcesReady ? (
          <TagForm
            tag={tag}
            callback={doUpdate}
            saving={saving}
            initial={initial}
            conflicts={conflicts}
          />
        ) : (
          <LoadingIndicator message="Loading tag details..." />
        )}
      </Row>
    </div>
  );
};

export default TagMerge;
