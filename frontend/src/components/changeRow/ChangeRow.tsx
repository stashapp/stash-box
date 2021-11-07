import { FC } from "react";
import cx from "classnames";

export interface ChangeRowProps {
  name?: string;
  newValue?: string | number | null;
  oldValue?: string | number | null;
  showDiff?: boolean;
}

const ChangeRow: FC<ChangeRowProps> = ({
  name,
  newValue,
  oldValue,
  showDiff = false,
}) =>
  name && (newValue || oldValue) ? (
    <div className="row mb-2">
      <b className="col-2 text-end">{name}</b>
      {showDiff && (
        <span className="col-5">
          <div className="EditDiff bg-danger">{oldValue}</div>
        </span>
      )}
      <span className="col-5">
        <div className={cx("EditDiff", { "bg-success": showDiff })}>
          {newValue}
        </div>
      </span>
    </div>
  ) : (
    <></>
  );

export default ChangeRow;
