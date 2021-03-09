import React from "react";
import { Link } from "react-router-dom";
import { Form, Row } from "react-bootstrap";

import {
  Edits_queryEdits_edits_target as Target,
  Edits_queryEdits_edits_options as Options,
} from "src/graphql/definitions/Edits";
import { isTag, isPerformer, tagHref, performerHref } from "src/utils";

interface MergeEditProps {
  merges?: (Target | null)[] | null;
  target: Target | null;
  options?: Options;
}

const MergeEdit: React.FC<MergeEditProps> = ({
  merges = [],
  target,
  options,
}) => {
  if (!merges || merges.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="row">
        <b className="col-2 text-right">Merge</b>
        <div>
          {merges?.map((source) => {
            if (isTag(source)) {
              return (
                <div key={source.id}>
                  <Link to={tagHref(source)}>{source.name}</Link>
                </div>
              );
            }
            if (isPerformer(source)) {
              return (
                <div key={source.id}>
                  <Link to={performerHref(source)}>{source.name}</Link>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
      <div className="row">
        <b className="col-2 text-right">Into</b>
        <div>
          {isTag(target) && (
            <div>
              <Link to={tagHref(target)}>{target.name}</Link>
            </div>
          )}
          {isPerformer(target) && (
            <div>
              <Link to={performerHref(target)}>{target.name}</Link>
            </div>
          )}
        </div>
      </div>
      {isPerformer(target) && (
        <Row>
          <div className="offset-2">
            <Form.Check
              disabled
              checked={options?.set_merge_aliases ?? false}
              label="Set performance aliases to old name"
            />
          </div>
        </Row>
      )}
    </div>
  );
};

export default MergeEdit;
