import { useMutation, useQuery } from "@apollo/client/react";
import {
  faCircle,
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { type FC, useState } from "react";
import { Alert, Button, Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { List } from "src/components/list";
import {
  CloseFingerprintReportDocument,
  FingerprintReportStatus,
  FingerprintReportsDocument,
} from "src/graphql";
import { formatDate } from "src/utils";

interface Props {
  page: number;
  setPage: (page: number) => void;
}

export const FingerprintReportList: FC<Props> = ({ page, setPage }) => {
  const [status, setStatus] = useState<FingerprintReportStatus | "">("");
  const [actionError, setActionError] = useState("");
  const { data, loading, error, refetch } = useQuery(
    FingerprintReportsDocument,
    {
      variables: {
        status: status || null,
        page,
        per_page: 25,
      },
      fetchPolicy: "cache-and-network",
    },
  );
  const [close, { loading: closing }] = useMutation(
    CloseFingerprintReportDocument,
  );
  const closeReport = async (id: string) => {
    setActionError("");
    try {
      await close({ variables: { id } });
      await refetch();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to close report",
      );
    }
  };
  return (
    <>
      <h4>Fingerprint reports</h4>
      <p>
        Reports do not affect fingerprint submissions or matching. Closed
        reports are removed after 24 hours.
      </p>
      <Form.Select
        aria-label="Report status"
        className="mb-3 w-auto"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value as FingerprintReportStatus | "");
          setPage(1);
        }}
      >
        <option value="">All</option>
        <option value={FingerprintReportStatus.OPEN}>Open</option>
        <option value={FingerprintReportStatus.COMPLETED}>Handled</option>
        <option value={FingerprintReportStatus.INCORRECT}>
          Closed as incorrect
        </option>
      </Form.Select>
      {(error || actionError) && (
        <Alert variant="danger">{actionError || error?.message}</Alert>
      )}
      <List
        entityName="reports"
        page={page}
        setPage={setPage}
        perPage={25}
        loading={loading}
        listCount={data?.fingerprintReports.count}
      >
        <Table striped responsive variant="dark">
          <thead>
            <tr>
              <th>
                <span className="visually-hidden">Status</span>
              </th>
              <th>Fingerprint</th>
              <th>Reported</th>
              <th>Wrong scene</th>
              <th>Suggested scene</th>
              <th>Report</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.fingerprintReports.reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <Icon
                    icon={
                      report.status === FingerprintReportStatus.COMPLETED
                        ? faCircleCheck
                        : report.status === FingerprintReportStatus.INCORRECT
                          ? faCircleXmark
                          : faCircle
                    }
                    variant={
                      report.status === FingerprintReportStatus.COMPLETED
                        ? "success"
                        : report.status === FingerprintReportStatus.INCORRECT
                          ? "danger"
                          : "white"
                    }
                    title={
                      report.status === FingerprintReportStatus.COMPLETED
                        ? "Handled"
                        : report.status === FingerprintReportStatus.INCORRECT
                          ? "Incorrect"
                          : "Open"
                    }
                  />
                </td>
                <td>
                  {report.algorithm}
                  <br />
                  <code>{report.hash}</code>
                </td>
                <td className="text-nowrap">
                  {formatDate(report.created_at)}{" "}
                  {new Date(report.created_at).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </td>
                <td>
                  <Link to={`/scenes/${report.scene.id}`}>
                    {report.scene.title || report.scene.id}
                  </Link>
                </td>
                <td>
                  {report.correct_scene && (
                    <Link to={`/scenes/${report.correct_scene.id}`}>
                      {report.correct_scene.title || report.correct_scene.id}
                    </Link>
                  )}
                </td>
                <td>
                  <div style={{ whiteSpace: "pre-wrap" }}>{report.comment}</div>
                  <small>{report.user?.name || "Deleted user"}</small>
                  {report.resolved_at && (
                    <div>
                      <small>
                        {report.status} by{" "}
                        {report.resolved_by?.name || "Deleted user"} ·{" "}
                        {formatDate(report.resolved_at)}
                      </small>
                    </div>
                  )}
                </td>
                <td>
                  {report.status === FingerprintReportStatus.OPEN && (
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={closing}
                        onClick={() => closeReport(report.id)}
                      >
                        Close as incorrect
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </List>
    </>
  );
};
