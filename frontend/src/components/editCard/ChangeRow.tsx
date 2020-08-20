import React from "react";

interface ChangeRowProps {
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
}) => {
  if (newValue === null || newValue === undefined || newValue === "") {
    return null;
  }

  return (
    <div className="row">
      <b className="col-2 text-right">{name}</b>
      {showDiff && <span className="col-2 bg-danger">{oldValue}</span>}
      <span className={`col-2 ${showDiff && "bg-success"}`}>{newValue}</span>
    </div>
  );
};

export default ChangeRow;
