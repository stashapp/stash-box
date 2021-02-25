import React, { useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Button, Col, Row } from "react-bootstrap";
import { flatMap } from "lodash";

import { SearchPerformers_searchPerformer as SearchPerformer } from "src/graphql/definitions/SearchPerformers";
import {
  usePerformer,
  usePerformerEdit,
  OperationEnum,
  PerformerEditDetailsInput,
} from "src/graphql";

import { LoadingIndicator } from "src/components/fragments";
import PerformerSelect from "src/components/performerSelect";
import PerformerCard from "src/components/performerCard";
import { editHref } from "src/utils";
import PerformerForm from "./performerForm";

const CLASSNAME = "PerformerMerge";

const PerformerMerge: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [mergeActive, setMergeActive] = useState(false);
  const [mergeSources, setMergeSources] = useState<SearchPerformer[]>([]);
  const { data: performer, loading: loadingPerformer } = usePerformer({ id });
  const [insertPerformerEdit] = usePerformerEdit({
    onCompleted: (data) => {
      if (data.performerEdit.id) history.push(editHref(data.performerEdit));
    },
  });

  if (loadingPerformer)
    return <LoadingIndicator message="Loading performer..." />;
  if (!performer?.findPerformer?.id) return <div>Performer not found</div>;

  const doUpdate = (
    insertData: PerformerEditDetailsInput,
    editNote: string
  ) => {
    insertPerformerEdit({
      variables: {
        performerData: {
          edit: {
            id: performer.findPerformer?.id,
            operation: OperationEnum.MERGE,
            merge_source_ids: mergeSources.map((p) => p.id),
            comment: editNote,
          },
          details: insertData,
        },
      },
    });
  };

  return (
    <div className={CLASSNAME}>
      <h2>
        Merge performers into <em>{performer.findPerformer.name}</em>
      </h2>
      <hr />
      <div className="row no-gutters">
        <div className="col-6">
          {!mergeActive && (
            <>
              <PerformerSelect
                performers={[]}
                onChange={(performers) => setMergeSources(performers)}
                message="Search for performers to merge..."
                excludePerformers={[
                  performer.findPerformer.id,
                  ...mergeSources.map((p) => p.id),
                ]}
              />
              {mergeSources.length > 0 && (
                <Button
                  onClick={() => setMergeActive(true)}
                  className="ml-auto"
                >
                  Continue
                </Button>
              )}
            </>
          )}
          {mergeActive && (
            <Row>
              <Col xs={3}>
                <h6 className="text-center">Merge Target</h6>
                <PerformerCard
                  performer={performer.findPerformer}
                  className="TargetCard"
                />
              </Col>
              <Col xs={9}>
                <Row className="mt-4">
                  {mergeSources.map((source) => (
                    <Col xs={4} key={source.id}>
                      <PerformerCard performer={source} className="col-4" />
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          )}
        </div>
        <div className="col-6">
          <p>
            Merging performers reassigns all scene performances of the sources
            to the target performer. The source <i>stashIds</i> will be
            redirected so that previously tagged content can be updated with the
            new performers metadata.
          </p>
          <p>
            This operation is not easily reversible and attention should be paid
            that all entities are truly the same.
          </p>
        </div>
      </div>
      {mergeActive && (
        <>
          <h5 className="mt-4">
            Update performer metadata for{" "}
            <em>{performer.findPerformer.name}</em>
          </h5>
          <PerformerForm
            performer={performer.findPerformer}
            initialAliases={[
              ...mergeSources.map((p) => p.name),
              ...flatMap(mergeSources, (p) => p.aliases),
            ]}
            initialImages={flatMap(mergeSources, (i) => i.images)}
            callback={doUpdate}
            changeType="merge"
          />
        </>
      )}
    </div>
  );
};

export default PerformerMerge;
