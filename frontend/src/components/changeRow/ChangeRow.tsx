import React from "react";

export interface ChangeRowProps {
  name: string;
  newValue?: string | number | null;
  oldValue?: string | number | null;
  showDiff?: boolean;
}

const ChangeRow: React.FC<ChangeRowProps> = ({
  name,
  newValue,
  oldValue,
  showDiff = false,
}) => (
  (newValue || oldValue) ? (
    <div className="row">
      <b className="col-2 text-right">{name}</b>
      {showDiff && <span className="col-5 bg-danger">{oldValue}</span>}
      <span className={`col-5 ${showDiff && "bg-success"}`}>{newValue}</span>
    </div>
  ) : <></>
);

export default ChangeRow;
