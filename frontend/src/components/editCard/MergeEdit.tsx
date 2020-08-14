import React from "react";

import { Edits_queryEdits_edits_target as Target } from "src/definitions/Edits";
import { isTagTarget } from "./utils";

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
            if (isTagTarget(source)) {
              return (
                <div key={source.id}>
                  <a href={`/tags/${source.name}`}>{source.name}</a>
                </div>
              );
            }
          })}
        </div>
      </div>
      <div className="row">
        <b className="col-2 text-right">Into</b>
        <div>
          {isTagTarget(target) && (
            <div>
              <a href={`/tags/${target.name}`}>{target.name}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MergeEdit;
