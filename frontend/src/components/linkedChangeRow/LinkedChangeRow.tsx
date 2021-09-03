import React from "react";

import { Link } from "react-router-dom";
import cx from "classnames";

interface LinkedChangeRowProps {
  newName?: string | null;
  oldName?: string | null;
  newLink?: string | null;
  oldLink?: string | null;
  name: string;
  showDiff?: boolean;
}

const LinkedChangeRow: React.FC<LinkedChangeRowProps> = ({
  newName,
  oldName,
  newLink,
  oldLink,
  name,
  showDiff = false,
}) => {
  function getValue(n?: string | null, link?: string | null) {
    if (!n) {
      return;
    }

    if (!link) {
      return n;
    }

    return <Link to={link}>{n}</Link>;
  }

  return newName || oldName ? (
    <div className="row mb-2">
      <b className="col-2 text-right">{name}</b>
      {showDiff && (
        <span className="col-5">
          <div className="EditDiff bg-danger">{getValue(oldName, oldLink)}</div>
        </span>
      )}
      <span className="col-5">
        <div className={cx("EditDiff", { "bg-success": showDiff })}>
          {getValue(newName, newLink)}
        </div>
      </span>
    </div>
  ) : (
    <></>
  );
};

export default LinkedChangeRow;
