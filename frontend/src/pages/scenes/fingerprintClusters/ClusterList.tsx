import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Badge } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import { SceneChip } from "./SceneChip";
import type { Cluster } from "./types";

interface Props {
  clusters: Cluster[];
  seedSceneId: string;
  activeClusterId?: string;
  paletteFor: (sceneId: string) => string;
  onSelect: (clusterId: string) => void;
}

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

export const ClusterList: FC<Props> = ({
  clusters,
  seedSceneId,
  activeClusterId,
  paletteFor,
  onSelect,
}) => {
  if (clusters.length === 0) {
    return (
      <div className="text-muted py-3 text-center">No clusters found.</div>
    );
  }
  return (
    <div className="d-flex flex-column gap-2">
      {clusters.map((c, i) => {
        const isActive = c.id === activeClusterId;
        const totalSubs = c.scenes.reduce((s, x) => s + x.submission_count, 0);
        const memberCount = c.members.length;
        const warn = c.scenes.some((s) => s.scene.id !== seedSceneId);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className="text-start border-0 rounded p-2 w-100"
            style={{
              backgroundColor: isActive
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.04)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-1">
              <strong>Cluster {i + 1}</strong>
              {warn && (
                <Badge bg="warning" text="dark">
                  <Icon icon={faExclamationTriangle} className="me-1" />
                  cross-scene
                </Badge>
              )}
              {c.poisoned && <Badge bg="danger">poisoned</Badge>}
            </div>
            <div className="small text-muted mb-2">
              {memberCount} phash{memberCount === 1 ? "" : "es"} ·{" "}
              {c.scenes.length} scene
              {c.scenes.length === 1 ? "" : "s"} · {totalSubs} submission
              {totalSubs === 1 ? "" : "s"}
            </div>
            <div className="d-flex flex-wrap gap-1">
              {c.scenes.map((s) => (
                <SceneChip
                  key={s.scene.id}
                  color={paletteFor(s.scene.id)}
                  isSeed={s.scene.id === seedSceneId}
                  title={s.scene.title || "Untitled"}
                >
                  {truncate(s.scene.title || "Untitled", 22)} · {s.member_count}
                </SceneChip>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};
