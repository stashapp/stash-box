import { FC } from "react";
import { Button } from "react-bootstrap";
import { FingerprintAlgorithm } from "src/graphql";
import { Icon } from "src/components/fragments";
import { formatDuration } from "src/utils";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";

interface Props {
  fingerprint: {
    hash: string;
    duration: number;
    algorithm: FingerprintAlgorithm;
  };
  deleteFingerprint: () => void;
}

export const UserFingerprint: FC<Props> = ({
  fingerprint,
  deleteFingerprint,
}) => (
  <li>
    <div key={fingerprint.hash}>
      <b className="me-2">{fingerprint.algorithm}</b>
      {fingerprint.hash} ({formatDuration(fingerprint.duration)})
      <Button
        className="text-danger ms-2"
        title="Submitted by you - click to remove submission"
        onClick={deleteFingerprint}
        variant="link"
      >
        <Icon icon={faTimesCircle} />
      </Button>
    </div>
  </li>
);
