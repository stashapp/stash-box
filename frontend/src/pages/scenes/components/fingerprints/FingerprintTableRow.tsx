import type { FC } from "react";
import { Link } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import {
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import type { Fingerprint } from "src/graphql";
import { createHref, formatDate, formatDuration } from "src/utils";
import { ROUTE_SCENES } from "src/constants/route";
import { Icon } from "src/components/fragments";
import type { MatchType } from "./types";

interface Props {
  fingerprint: Fingerprint;
  isModerator: boolean;
  isSelected: boolean;
  unmatching: boolean;
  onSelect: (hash: string) => void;
  onUnmatch: (fingerprint: Fingerprint, type: MatchType) => void;
}

export const FingerprintTableRow: FC<Props> = ({
  fingerprint,
  isModerator,
  isSelected,
  unmatching,
  onSelect,
  onUnmatch,
}) => {
  const renderUnmatch = (type: MatchType) => (
    <Button
      className="user-submitted"
      title={`Remove ${type}`}
      onKeyDown={() => onUnmatch(fingerprint, type)}
      onClick={() => onUnmatch(fingerprint, type)}
      variant="link"
      disabled={unmatching}
    >
      {!unmatching ? (
        <>
          <Icon icon={faCheckCircle} />
          <Icon icon={faTimesCircle} />
        </>
      ) : (
        <Icon icon={faSpinner} className="fa-spin" />
      )}
    </Button>
  );

  return (
    <tr>
      {isModerator && (
        <td>
          <Form.Check
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(fingerprint.hash)}
          />
        </td>
      )}
      <td>{fingerprint.algorithm}</td>
      <td className="font-monospace">
        <Link
          to={`${createHref(ROUTE_SCENES)}?fingerprint=${fingerprint.hash}`}
        >
          {fingerprint.hash}
        </Link>
      </td>
      <td>
        <span title={`${fingerprint.duration}s`}>
          {formatDuration(fingerprint.duration)}
        </span>
      </td>
      <td>
        {fingerprint.submissions}
        {fingerprint.user_submitted && renderUnmatch("submission")}
      </td>
      <td>
        {fingerprint.reports > 0 && (
          <>
            {fingerprint.reports}{" "}
            <Icon icon={faTriangleExclamation} variant="danger" />
            {fingerprint.user_reported && renderUnmatch("report")}
          </>
        )}
      </td>
      <td>{formatDate(fingerprint.created)}</td>
      <td>{formatDate(fingerprint.updated)}</td>
    </tr>
  );
};
