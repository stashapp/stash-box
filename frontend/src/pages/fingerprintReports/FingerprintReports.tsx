import { useMutation, useQuery } from "@apollo/client/react";
import { type FC, useState } from "react";
import { Alert, Button, Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { List } from "src/components/list";
import Title from "src/components/title";
import {
  CloseFingerprintReportDocument,
  type FingerprintReportFieldsFragment,
  FingerprintReportStatus,
  FingerprintReportsDocument,
  MoveFingerprintSubmissionsDocument,
} from "src/graphql";
import { useCurrentUser, usePagination } from "src/hooks";
import { MoveFingerprintsModal } from "src/pages/scenes/components/fingerprints/MoveFingerprintsModal";
import { formatDate } from "src/utils";

const Queue: FC = () => {
  const { page, setPage } = usePagination();
  const [status, setStatus] = useState(FingerprintReportStatus.OPEN);
  const [selected, setSelected] =
    useState<FingerprintReportFieldsFragment | null>(null);
  const [actionError, setActionError] = useState("");
  const { data, loading, error, refetch } = useQuery(
    FingerprintReportsDocument,
    {
      variables: { status, page, per_page: 25 },
      fetchPolicy: "cache-and-network",
    },
  );
  const [close, { loading: closing }] = useMutation(
    CloseFingerprintReportDocument,
  );
  const [move, { loading: moving }] = useMutation(
    MoveFingerprintSubmissionsDocument,
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
  const moveReport = async (targetSceneId: string) => {
    if (!selected) return false;
    setActionError("");
    try {
      await move({
        variables: {
          input: {
            source_scene_id: selected.scene.id,
            target_scene_id: targetSceneId,
            fingerprints: [
              { hash: selected.hash, algorithm: selected.algorithm },
            ],
          },
        },
      });
      setSelected(null);
      await refetch();
      return true;
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to move fingerprint",
      );
      return false;
    }
  };
  return (
    <>
      <Title page="Fingerprint reports" />
      <h3>Fingerprint reports</h3>
      <p>
        Reports do not affect fingerprint submissions or matching. Closed
        reports are removed after 24 hours.
      </p>
      <Form.Select
        aria-label="Report status"
        className="mb-3 w-auto"
        value={status}
        onChange={(e) => {
          setStatus(e.target.value as FingerprintReportStatus);
          setPage(1);
        }}
      >
        <option value={FingerprintReportStatus.OPEN}>Open</option>
        <option value={FingerprintReportStatus.COMPLETED}>Completed</option>
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
              <th>Fingerprint</th>
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
                  {report.algorithm}
                  <br />
                  <code>{report.hash}</code>
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
                  <small>
                    {report.user?.name || "Deleted user"} ·{" "}
                    {formatDate(report.created_at)}
                  </small>
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
                        disabled={moving || closing}
                        onClick={() => {
                          setActionError("");
                          setSelected(report);
                        }}
                      >
                        Move fingerprint
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={moving || closing}
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
      {selected && (
        <MoveFingerprintsModal
          show
          selectedCount={1}
          moving={moving}
          onHide={() => setSelected(null)}
          onMove={moveReport}
          initialTargetSceneId={selected.correct_scene?.id}
          error={actionError}
        />
      )}
    </>
  );
};

export default function FingerprintReports() {
  const { isModerator } = useCurrentUser();
  return isModerator ? (
    <Queue />
  ) : (
    <Alert variant="danger">Moderator access required.</Alert>
  );
}
