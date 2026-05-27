import { faCaretDown, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { useClusterPage } from "./ClusterPageContext";
import { SceneChip } from "./SceneChip";
import type { Cluster, ClusterLinkedFingerprint, ClusterScene } from "./types";
import { fingerprintSearchHref, memberTotalSubmissions } from "./utils";

const memberTotalReports = (m: { scene_submissions: { reports: number }[] }) =>
  m.scene_submissions.reduce((s, x) => s + x.reports, 0);

type LinkedRow = ClusterLinkedFingerprint & { scene: ClusterScene };

const memberLinkedFingerprints = (
  m: Cluster["members"][number],
): LinkedRow[] =>
  m.scene_submissions.flatMap((s) =>
    s.linked_fingerprints.map((o) => ({ ...o, scene: s.scene })),
  );

const sumSubmissions = (linked: { submissions: number }[]) =>
  linked.reduce((sum, o) => sum + o.submissions, 0);

interface SceneCellSubmission {
  scene: { id: string; title?: string | null };
  submissions: number;
  reports: number;
}

const SceneCell: FC<{ submissions: SceneCellSubmission[] }> = ({
  submissions,
}) => {
  const { paletteFor, seedSceneId } = useClusterPage();
  return (
    <div className="d-flex flex-wrap gap-1">
      {submissions.map((s) => (
        <SceneChip
          key={s.scene.id}
          color={paletteFor(s.scene.id)}
          isSeed={s.scene.id === seedSceneId}
          title={`${s.submissions} submissions, ${s.reports} reports`}
        >
          {s.scene.title || s.scene.id}
          {s.submissions > 1 ? ` ×${s.submissions}` : ""}
        </SceneChip>
      ))}
    </div>
  );
};

export const ClusterMembersTable: FC = () => {
  const { activeCluster, isModerator, selection, expandedRows } =
    useClusterPage();
  if (!activeCluster) return null;
  const poisoned = activeCluster.poisoned;
  return (
    <Table size="sm" variant="dark" striped responsive>
      <thead>
        <tr>
          <th>Hash</th>
          <th>Scenes</th>
          <th className="text-end">Submissions</th>
          <th className="text-end">Reports</th>
        </tr>
      </thead>
      <tbody>
        {activeCluster.members.flatMap((m) => {
          const linkedOshashes = memberLinkedFingerprints(m);
          const rowKey = `hash:${m.hash}`;
          const expanded = expandedRows.expanded.has(rowKey);
          const rows = [
            <tr key={rowKey}>
              <td>
                {isModerator && (
                  <input
                    type="checkbox"
                    className="me-2"
                    checked={selection.isSelected(m.hash)}
                    disabled={poisoned}
                    onChange={() => selection.toggle(m.hash)}
                  />
                )}
                <Link
                  to={fingerprintSearchHref(m.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Find scenes with ${m.hash}`}
                  className="text-decoration-none"
                >
                  <code>{m.hash}</code>
                </Link>
              </td>
              <td>
                <SceneCell submissions={m.scene_submissions} />
              </td>
              <td className="text-end">{memberTotalSubmissions(m)}</td>
              <td className="text-end">{memberTotalReports(m)}</td>
            </tr>,
          ];
          if (linkedOshashes.length > 0) {
            const oshashSubCount = sumSubmissions(linkedOshashes);
            rows.push(
              <tr
                key={`${rowKey}::oshash-summary`}
                className="ClusterMembersTable-oshash-summary text-muted"
              >
                <td colSpan={4}>
                  <button
                    type="button"
                    onClick={() => expandedRows.toggle(rowKey)}
                    className="btn btn-sm btn-link p-0 text-muted text-decoration-none"
                    aria-expanded={expanded}
                  >
                    <Icon
                      icon={expanded ? faCaretDown : faCaretRight}
                      className="me-2"
                    />
                    {linkedOshashes.length} linked OSHASH
                    {linkedOshashes.length === 1 ? "" : "es"} · {oshashSubCount}{" "}
                    submission
                    {oshashSubCount === 1 ? "" : "s"}
                    <span className="ms-2 small ClusterMembersTable-oshash-note">
                      (follows phash on move / delete)
                    </span>
                  </button>
                </td>
              </tr>,
            );
            if (expanded) {
              for (const o of linkedOshashes) {
                rows.push(
                  <tr
                    key={`${rowKey}::oshash::${o.hash}`}
                    className="ClusterMembersTable-oshash-row text-muted"
                  >
                    <td>
                      <Link
                        to={fingerprintSearchHref(o.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Find scenes with ${o.hash}`}
                        className="text-decoration-none"
                      >
                        <code>↪ {o.hash}</code>
                      </Link>
                    </td>
                    <td>
                      <SceneCell
                        submissions={[
                          {
                            scene: o.scene,
                            submissions: o.submissions,
                            reports: o.reports,
                          },
                        ]}
                      />
                    </td>
                    <td className="text-end">{o.submissions}</td>
                    <td className="text-end">{o.reports}</td>
                  </tr>,
                );
              }
            }
          }
          return rows;
        })}
      </tbody>
    </Table>
  );
};
