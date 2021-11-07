import { FC } from "react";
import { Link } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
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

const MergeEdit: FC<MergeEditProps> = ({ merges = [], target, options }) => {
  if (!merges || merges.length === 0) return null;

  return (
    <div className="mb-4">
      <Row>
        <b className="col-2 text-end">Merge</b>
        <Col xs={10}>
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
                      <small className="text-muted ms-1">
                        ({source.disambiguation})
                      </small>
                    )}
                  </Link>
                </div>
              );
            }
            return null;
          })}
        </Col>
      </Row>
      <Row>
        <b className="col-2 text-end">Into</b>
        <Col xs={10}>
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
                  <small className="text-muted ms-1">
                    ({target.disambiguation})
                  </small>
                )}
              </Link>
            </div>
          )}
        </Col>
      </Row>
      {isPerformer(target) && (
        <Row>
          <div className="offset-2 d-flex align-items-center">
            <Icon
              icon={options?.set_merge_aliases ? faCheck : faTimes}
              color={options?.set_merge_aliases ? "green" : "red"}
            />
            <span className="ms-2">Set performance aliases to old name</span>
          </div>
        </Row>
      )}
    </div>
  );
};

export default MergeEdit;
