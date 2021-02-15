import React from "react";
import { Link } from "react-router-dom";

import { Edits_queryEdits_edits_target as Target } from "src/graphql/definitions/Edits";
import { isTag, isPerformer, tagHref, performerHref } from "src/utils";

interface MergeEditProps {
  merges?: (Target | null)[] | null;
  target: Target | null;
}

const MergeEdit: React.FC<MergeEditProps> = ({ merges = [], target }) => {
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
    </div>
  );
};

export default MergeEdit;
