import { FC, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import cx from "classnames";

interface LoadingProps {
  message?: string;
  delay?: number;
}

const CLASSNAME = "LoadingIndicator";
const CLASSNAME_MESSAGE = `${CLASSNAME}-message`;
const CLASSNAME_DELAYED = `${CLASSNAME}-delayed`;

const LoadingIndicator: FC<LoadingProps> = ({ message, delay = 100 }) => {
  const [delayed, setDelayed] = useState(delay > 0);
  useEffect(() => {
    if (!delayed || delay === 0) return;
    const timeout = setTimeout(() => setDelayed(false), delay);
    return () => clearTimeout(timeout);
  }, [delayed, delay]);

  return (
    <div className={cx(CLASSNAME, { [CLASSNAME_DELAYED]: delayed })}>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <h4 className={CLASSNAME_MESSAGE}>{message ?? "Loading..."}</h4>
    </div>
  );
};

export default LoadingIndicator;
