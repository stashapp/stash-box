import { FC, useMemo } from "react";
import { Link } from "react-router-dom";
import { Col, Row } from "react-bootstrap";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";

import {
  Edits_queryEdits_edits as Edit,
  Edits_queryEdits_edits_target as Target,
} from "src/graphql/definitions/Edits";
import { OperationEnum } from "src/graphql";
import {
  isValidEditTarget,
  getEditTargetRoute,
  isPerformer,
  isScene,
  performerHref,
} from "src/utils";
import { Icon } from "src/components/fragments";

const renderTargetLink = (obj: Target | null) => {
  if (!obj) return null;

  if (isPerformer(obj)) {
    return (
      <Link to={performerHref(obj)}>
        {obj.name}
        {obj.disambiguation && (
          <small className="text-muted ms-1">({obj.disambiguation})</small>
        )}
      </Link>
    );
  } else {
    const name = isScene(obj) ? obj.title : obj.name;
    return <Link to={getEditTargetRoute(obj)}>{name}</Link>;
  }
};

interface EditHeaderProps {
  edit: Edit;
}

const EditHeader: FC<EditHeaderProps> = ({ edit }) => {
  const header = useMemo(() => {
    switch (edit.operation) {
      case OperationEnum.MODIFY:
        return (
          <>
            <Col xs={2} className="text-end">
              Modifying {edit.target_type.toLowerCase()}:
            </Col>
            <Col>{renderTargetLink(edit.target)}</Col>
          </>
        );

      case OperationEnum.CREATE:
        return edit.applied ? (
          <>
            <Col xs={2} className="text-end">
              Created {edit.target_type.toLowerCase()}:
            </Col>
            <Col>{renderTargetLink(edit.target)}</Col>
          </>
        ) : null;

      case OperationEnum.MERGE:
        return (
          <Col className="lh-base">
            <Row>
              <b className="col-2 text-end">Merge</b>
              <Col xs={10}>
                {edit.merge_sources?.map((target) => (
                  <div key={target.id}>{renderTargetLink(target)}</div>
                ))}
              </Col>
            </Row>
            <Row>
              <b className="col-2 text-end">Into</b>
              <Col xs={10}>{renderTargetLink(edit.target)}</Col>
            </Row>
            {isPerformer(edit.target) && (
              <Row>
                <div className="offset-2 d-flex align-items-center">
                  <Icon
                    icon={edit.options?.set_merge_aliases ? faCheck : faTimes}
                    color={edit.options?.set_merge_aliases ? "green" : "red"}
                  />
                  <span className="ms-1">
                    Set performance aliases to old name
                  </span>
                </div>
              </Row>
            )}
          </Col>
        );

      case OperationEnum.DESTROY:
        return (
          <>
            <b className="col-2 text-end">Deleting: </b>
            <Col>
              <span className="EditDiff bg-danger">
                {renderTargetLink(edit.target)}
              </span>
            </Col>
          </>
        );
    }
  }, [edit]);

  return isValidEditTarget(edit.target) ? (
    <h6 className="row mb-4">{header}</h6>
  ) : null;
};

export default EditHeader;
