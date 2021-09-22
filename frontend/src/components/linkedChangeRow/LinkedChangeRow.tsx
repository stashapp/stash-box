import React from "react";

import { Link } from "react-router-dom";
import cx from "classnames";

interface Change {
  name: string | null | undefined;
  link: string | null | undefined;
}

interface LinkedChangeRowProps {
  name: string;
  oldEntity?: Change | null;
  newEntity?: Change | null;
  showDiff?: boolean;
}

const LinkedChangeRow: React.FC<LinkedChangeRowProps> = ({
  name,
  newEntity,
  oldEntity,
  showDiff = false,
}) => {
  function getValue(value: Change | null | undefined) {
    if (!value?.name) {
      return;
    }

    if (!value.link) {
      return value.name;
    }

    return <Link to={value.link}>{value.name}</Link>;
  }

  if (!newEntity?.link && !oldEntity?.link) return null;

  return (
    <div className="row mb-2">
      <b className="col-2 text-right">{name}</b>
      {showDiff && (
        <span className="col-5 ml-auto mt-2" key={oldEntity?.name}>
          <div className="EditDiff bg-danger">{getValue(oldEntity)}</div>
        </span>
      )}
      <span className="col-5 mt-2" key={newEntity?.name}>
        <div className={cx("EditDiff", { "bg-success": showDiff })}>
          {getValue(newEntity)}
        </div>
      </span>
    </div>
  );
};

export default LinkedChangeRow;
