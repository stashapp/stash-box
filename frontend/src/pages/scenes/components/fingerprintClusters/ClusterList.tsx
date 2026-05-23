import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Badge } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import type { Cluster } from "./types";

interface Props {
  clusters: Cluster[];
  seedSceneId: string;
  activeClusterId?: string;
  highlightedSceneId?: string;
  paletteFor: (sceneId: string) => string;
  onSelect: (clusterId: string) => void;
}

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

export const ClusterList: FC<Props> = ({
  clusters,
  seedSceneId,
  activeClusterId,
  highlightedSceneId,
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
        const totalSubs = c.scenes.reduce(
          (s, x) => s + x.submission_count,
          0,
        );
        const memberCount = c.members.length;
        const warn = c.scenes.some((s) => s.scene.id !== seedSceneId);
        const dimmed =
          !!highlightedSceneId &&
          !c.scenes.some((s) => s.scene.id === highlightedSceneId);
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
              outline: isActive
                ? "2px solid rgba(255,255,255,0.6)"
                : "2px solid transparent",
              opacity: dimmed ? 0.4 : 1,
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
              {c.tainted && <Badge bg="danger">tainted</Badge>}
            </div>
            <div className="small text-muted mb-2">
              {memberCount} fp · {c.scenes.length} scene
              {c.scenes.length === 1 ? "" : "s"} · {totalSubs} submission
              {totalSubs === 1 ? "" : "s"}
            </div>
            <div className="d-flex flex-wrap gap-1">
              {c.scenes.map((s) => (
                <span
                  key={s.scene.id}
                  className="px-2 py-1 small rounded"
                  style={{
                    backgroundColor: paletteFor(s.scene.id),
                    color: "#fff",
                    border:
                      s.scene.id === seedSceneId
                        ? "1px solid #fff"
                        : undefined,
                    fontSize: 11,
                  }}
                  title={s.scene.title || "Untitled"}
                >
                  {s.scene.id === seedSceneId ? "★ " : ""}
                  {truncate(s.scene.title || "Untitled", 22)} · {s.member_count}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};
