import type { FC } from "react";
import { Link } from "react-router-dom";
import { Button, Table } from "react-bootstrap";
import {
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import { type Fingerprint, useUnmatchFingerprint } from "src/graphql";
import { useToast } from "src/hooks";
import { createHref, formatDate, formatDuration } from "src/utils";
import { ROUTE_SCENES } from "src/constants/route";
import { Icon } from "src/components/fragments";

interface Props {
  scene: {
    id: string;
    fingerprints: Fingerprint[];
  };
}

type MatchType = "submission" | "report";

export const FingerprintTable: FC<Props> = ({ scene }) => {
  const addToast = useToast();

  const [unmatchFingerprint, { loading: unmatching }] = useUnmatchFingerprint();

  const handleFingerprintUnmatch = async (
    fingerprint: Fingerprint,
    type: MatchType,
  ) => {
    if (unmatching) return;

    const { data } = await unmatchFingerprint({
      variables: {
        scene_id: scene.id,
        algorithm: fingerprint.algorithm,
        hash: fingerprint.hash,
        duration: fingerprint.duration,
      },
    });
    const success = data?.unmatchFingerprint;
    addToast({
      variant: success ? "success" : "danger",
      content: `${
        success ? "Removed" : "Failed to remove"
      } fingerprint ${type}`,
    });
  };

  const renderUnmatch = (fingerprint: Fingerprint, type: MatchType) => (
    <Button
      className="user-submitted"
      title={`Remove ${type}`}
      onKeyDown={() => handleFingerprintUnmatch(fingerprint, type)}
      onClick={() => handleFingerprintUnmatch(fingerprint, type)}
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
    <div className="scene-fingerprints my-4">
      <h4>Fingerprints:</h4>
      {scene.fingerprints.length === 0 ? (
        <h6>No fingerprints found for this scene.</h6>
      ) : (
        <Table striped variant="dark">
          <thead>
            <tr>
              <td>
                <b>Algorithm</b>
              </td>
              <td>
                <b>Hash</b>
              </td>
              <td>
                <b>Duration</b>
              </td>
              <td>
                <b>Submissions</b>
              </td>
              <td>
                <b>Reports</b>
              </td>
              <td>
                <b>First Added</b>
              </td>
              <td>
                <b>Last Added</b>
              </td>
            </tr>
          </thead>
          <tbody>
            {scene.fingerprints.map((fingerprint) => (
              <tr key={fingerprint.hash}>
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
                  {fingerprint.user_submitted &&
                    renderUnmatch(fingerprint, "submission")}
                </td>
                <td>
                  {fingerprint.reports > 0 && (
                    <>
                      {fingerprint.reports}{" "}
                      <Icon icon={faTriangleExclamation} variant="danger" />
                      {fingerprint.user_reported &&
                        renderUnmatch(fingerprint, "report")}
                    </>
                  )}
                </td>
                <td>{formatDate(fingerprint.created)}</td>
                <td>{formatDate(fingerprint.updated)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};
