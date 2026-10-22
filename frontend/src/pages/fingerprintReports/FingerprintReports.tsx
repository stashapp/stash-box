import { Alert } from "react-bootstrap";
import { FingerprintReportList } from "src/components/fingerprintReports/FingerprintReportList";
import Title from "src/components/title";
import { useCurrentUser, usePagination } from "src/hooks";

export default function FingerprintReports() {
  const { isModerator } = useCurrentUser();
  const { page, setPage } = usePagination();
  return isModerator ? (
    <>
      <Title page="Fingerprint reports" />
      <FingerprintReportList page={page} setPage={setPage} />
    </>
  ) : (
    <Alert variant="danger">Moderator access required.</Alert>
  );
}
