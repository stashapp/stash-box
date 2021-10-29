import React from "react";
import { Link } from "react-router-dom";
import { Row } from "react-bootstrap";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";

import {
  Edits_queryEdits_edits_target as Target,
  Edits_queryEdits_edits_options as Options,
} from "src/graphql/definitions/Edits";
import { isTag, isPerformer, tagHref, performerHref } from "src/utils";
import { Icon } from "src/components/fragments";

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
                  <Link to={performerHref(source)}>
                    {source.name}
                    {source.disambiguation && (
                      <small className="text-muted ml-1">
                        ({source.disambiguation})
                      </small>
                    )}
                  </Link>
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
              <Link to={performerHref(target)}>
                {target.name}
                {target.disambiguation && (
                  <small className="text-muted ml-1">
                    ({target.disambiguation})
                  </small>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
      {isPerformer(target) && (
        <Row>
          <div className="offset-2 d-flex align-items-center">
            <Icon
              icon={options?.set_merge_aliases ? faCheck : faTimes}
              color={options?.set_merge_aliases ? "green" : "red"}
            />
            <span className="ml-2">Set performance aliases to old name</span>
          </div>
        </Row>
      )}
    </div>
  );
};

export default MergeEdit;
