import { FC, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

interface LoadingProps {
  message?: string;
  delay?: number;
}

const CLASSNAME = "LoadingIndicator";
const CLASSNAME_MESSAGE = `${CLASSNAME}-message`;

const LoadingIndicator: FC<LoadingProps> = ({ message, delay = 1000 }) => {
  const [delayed, setDelayed] = useState(delay > 0);
  useEffect(() => {
    if (!delayed || delay === 0) return;
    const timeout = setTimeout(() => setDelayed(false), delay);
    return () => clearTimeout(timeout);
  }, [delayed, delay]);

  if (delayed) return <></>;

  return (
    <div className={CLASSNAME}>
      <Spinner animation="border" role="status">
        <span className="sr-only">Loading...</span>
      </Spinner>
      <h4 className={CLASSNAME_MESSAGE}>{message ?? "Loading..."}</h4>
    </div>
  );
};

export default LoadingIndicator;
