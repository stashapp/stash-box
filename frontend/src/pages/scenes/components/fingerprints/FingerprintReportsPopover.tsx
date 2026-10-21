import { faFlag } from "@fortawesome/free-solid-svg-icons";
import { useId } from "react";
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import {
  type FingerprintReportFieldsFragment,
  FingerprintReportStatus,
} from "src/graphql";
import { formatDate } from "src/utils";

const statuses = {
  [FingerprintReportStatus.OPEN]: { label: "Open", variant: "white" },
  [FingerprintReportStatus.COMPLETED]: { label: "Handled", variant: "success" },
  [FingerprintReportStatus.INCORRECT]: {
    label: "Incorrect",
    variant: "danger",
  },
} as const;

export function FingerprintReportsPopover({
  reports,
}: {
  reports: FingerprintReportFieldsFragment[];
}) {
  const id = useId();
  if (!reports.length) return null;

  return (
    <OverlayTrigger
      trigger="click"
      placement="auto"
      rootClose
      overlay={
        <Popover
          id={id}
          style={{ width: "400px", maxWidth: "calc(100vw - 16px)" }}
        >
          <Popover.Header as="h3">
            Fingerprint reports ({reports.length})
          </Popover.Header>
          <Popover.Body style={{ maxHeight: "20rem", overflowY: "auto" }}>
            {reports.map((report) => (
              <div key={report.id} className="mb-3">
                <strong className={`text-${statuses[report.status].variant}`}>
                  {statuses[report.status].label}
                </strong>
                <div>
                  {report.user?.name || "Deleted user"} ·{" "}
                  {formatDate(report.created_at)}{" "}
                  {new Date(report.created_at).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </div>
                {report.comment && (
                  <div style={{ whiteSpace: "pre-wrap" }}>{report.comment}</div>
                )}
                {report.correct_scene && (
                  <div>
                    Suggested scene:{" "}
                    <Link to={`/scenes/${report.correct_scene.id}`}>
                      {report.correct_scene.title || report.correct_scene.id}
                    </Link>
                  </div>
                )}
                {report.resolved_at && (
                  <div>
                    Resolved by {report.resolved_by?.name || "Deleted user"} ·{" "}
                    {formatDate(report.resolved_at)}
                  </div>
                )}
              </div>
            ))}
          </Popover.Body>
        </Popover>
      }
    >
      <Button
        variant="link"
        size="sm"
        className="ms-2 p-0"
        aria-label="View fingerprint reports"
        title={`${reports.length} fingerprint report(s)`}
      >
        <Icon icon={faFlag} variant="danger" />
      </Button>
    </OverlayTrigger>
  );
}
