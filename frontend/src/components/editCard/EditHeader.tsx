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
            <Col xs={2} className="fw-bold text-end">
              Modifying {edit.target_type.toLowerCase()}
            </Col>
            <Col className="pl-1">{renderTargetLink(edit.target)}</Col>
          </>
        );

      case OperationEnum.CREATE:
        return edit.applied ? (
          <>
            <Col xs={2} className="fw-bold text-end">
              Created {edit.target_type.toLowerCase()}
            </Col>
            <Col className="ps-3">{renderTargetLink(edit.target)}</Col>
          </>
        ) : null;

      case OperationEnum.MERGE:
        return (
          <Col className="lh-base">
            <Row>
              <Col xs={2} className="fw-bold text-end">
                Merge
              </Col>
              <Col xs={10}>
                {edit.merge_sources?.map((target) => (
                  <div key={target.id}>{renderTargetLink(target)}</div>
                ))}
              </Col>
            </Row>
            <Row>
              <Col xs={2} className="fw-bold text-end">
                Into
              </Col>
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
            <Col xs={2} className="fw-bold text-end">
              Deleting
            </Col>
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
    <Row className="mb-4">{header}</Row>
  ) : null;
};

export default EditHeader;
