import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { type FC, useMemo, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import TagSelect from "src/components/tagSelect";
import {
  OperationEnum,
  type TagFragment as Tag,
  type TagEditDetailsInput,
  useTagEdit,
} from "src/graphql";
import { TagFragmentDoc } from "src/graphql/types";
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

// One document per source count, with N aliased findTag fields. Apollo
// caches by entity, so re-issuing the query after a source is added still
// serves the already-loaded tags from cache.
const EMPTY_QUERY = gql`query EmptyMergeSources { __typename }`;
const buildSourcesQuery = (n: number) => {
  const range = Array.from({ length: n }, (_, i) => i);
  const params = range.map((i) => `$id${i}: ID!`).join(", ");
  const fields = range
    .map((i) => `s${i}: findTag(id: $id${i}) { ...TagFragment }`)
    .join("\n");
  return gql`
    query MergeTagSources(${params}) {
      ${fields}
    }
    ${TagFragmentDoc}
  `;
};

const TagMerge: FC<Props> = ({ tag }) => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [mergeSources, setMergeSources] = useState<TagSlim[]>([]);

  const sourcesQuery = useMemo(
    () =>
      mergeSources.length > 0
        ? buildSourcesQuery(mergeSources.length)
        : EMPTY_QUERY,
    [mergeSources.length],
  );
  const sourcesVariables = useMemo(
    () => Object.fromEntries(mergeSources.map((s, i) => [`id${i}`, s.id])),
    [mergeSources],
  );
  const {
    data: sourcesData,
    loading: sourcesLoading,
    error: sourcesError,
  } = useQuery(sourcesQuery, {
    variables: sourcesVariables,
    skip: mergeSources.length === 0,
  });

  const loadedSources = mergeSources
    .map(
      (_, i) =>
        (sourcesData as Record<string, Tag | null> | undefined)?.[`s${i}`],
    )
    .filter((t): t is Tag => t != null);
  const sourcesReady =
    !sourcesLoading && loadedSources.length === mergeSources.length;

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

  const { initial, conflicts } = useMemo(
    () => buildTagMerge(tag, loadedSources),
    [tag, loadedSources],
  );

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
        {sourcesError ? (
          <div className="text-danger">
            Failed to load tag details: {sourcesError.message}
          </div>
        ) : sourcesReady ? (
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
