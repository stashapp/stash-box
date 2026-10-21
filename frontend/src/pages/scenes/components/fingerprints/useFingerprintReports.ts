import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import {
  type FingerprintReportFieldsFragment,
  FingerprintReportsDocument,
} from "src/graphql";

const PAGE_SIZE = 100;

export const useFingerprintReports = (sceneId: string, enabled: boolean) => {
  const [failedPage, setFailedPage] = useState<{
    sceneId: string;
    message: string;
  }>();
  const pageError =
    failedPage?.sceneId === sceneId ? failedPage.message : undefined;
  const { data, loading, error, fetchMore } = useQuery(
    FingerprintReportsDocument,
    {
      variables: { scene_id: sceneId, page: 1, per_page: PAGE_SIZE },
      skip: !enabled,
      fetchPolicy: "cache-and-network",
    },
  );

  useEffect(() => {
    const result = data?.fingerprintReports;
    if (
      !enabled ||
      loading ||
      error ||
      pageError ||
      !result ||
      result.reports.length >= result.count
    )
      return;
    void fetchMore({
      variables: { page: Math.floor(result.reports.length / PAGE_SIZE) + 1 },
      updateQuery: (previous, { fetchMoreResult }) => ({
        ...previous,
        fingerprintReports: {
          ...fetchMoreResult.fingerprintReports,
          reports: [
            ...previous.fingerprintReports.reports,
            ...fetchMoreResult.fingerprintReports.reports,
          ],
        },
      }),
    }).catch((err: unknown) =>
      setFailedPage({
        sceneId,
        message:
          err instanceof Error
            ? err.message
            : "Failed to load fingerprint reports",
      }),
    );
  }, [data, loading, error, pageError, enabled, fetchMore, sceneId]);

  const reports = useMemo(() => {
    const byFingerprint = new Map<string, FingerprintReportFieldsFragment[]>();
    if (enabled)
      for (const report of data?.fingerprintReports.reports ?? []) {
        if (report.scene.id !== sceneId) continue;
        const key = `${report.algorithm}:${report.hash}`;
        const existing = byFingerprint.get(key) ?? [];
        existing.push(report);
        byFingerprint.set(key, existing);
      }
    return byFingerprint;
  }, [data, enabled, sceneId]);

  return { reports, error: error?.message || pageError };
};
