import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import type { FC } from "react";
import { Badge } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import { useClusterPage } from "../ClusterPageContext";
import { clusterSceneSummaries } from "../utils";
import { SceneChip } from "./SceneChip";

interface Props {
  onSelect: (index: number) => void;
}

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

export const ClusterList: FC<Props> = ({ onSelect }) => {
  const { clusters, activeIndex, seedSceneId, paletteFor } = useClusterPage();
  if (clusters.length === 0) {
    return (
      <div className="text-muted py-3 text-center">No clusters found.</div>
    );
  }
  return (
    <div className="d-flex flex-column gap-2">
      {clusters.map((c, i) => {
        const isActive = i === activeIndex;
        const sceneSummaries = clusterSceneSummaries(c);
        const totalSubs = sceneSummaries.reduce(
          (s, x) => s + x.submissionCount,
          0,
        );
        const memberCount = c.members.length;
        const warn = sceneSummaries.some((s) => s.scene.id !== seedSceneId);
        return (
          <button
            key={c.members[0].hash}
            type="button"
            onClick={() => onSelect(i)}
            className={cx("ClusterListItem", {
              "ClusterListItem-active": isActive,
            })}
          >
            <div className="d-flex align-items-center gap-2 mb-1">
              <strong>Cluster {i + 1}</strong>
              {warn && (
                <Badge bg="warning" text="dark">
                  <Icon icon={faExclamationTriangle} className="me-1" />
                  cross-scene
                </Badge>
              )}
            </div>
            <div className="small text-muted mb-2">
              {memberCount} phash{memberCount === 1 ? "" : "es"} ·{" "}
              {sceneSummaries.length} scene
              {sceneSummaries.length === 1 ? "" : "s"} · {totalSubs} submission
              {totalSubs === 1 ? "" : "s"}
            </div>
            <div className="d-flex flex-wrap gap-1">
              {sceneSummaries.map((s) => (
                <SceneChip
                  key={s.scene.id}
                  color={paletteFor(s.scene.id)}
                  isSeed={s.scene.id === seedSceneId}
                  title={s.scene.title || "Untitled"}
                >
                  {truncate(s.scene.title || "Untitled", 22)} · {s.memberCount}
                </SceneChip>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};
