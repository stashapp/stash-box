import { faCaretDown, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { SceneChip } from "./SceneChip";
import type { Cluster, ClusterMember, ClusterOshashLink } from "./types";
import { fingerprintSearchHref } from "./utils";

interface Props {
  cluster: Cluster;
  seedSceneId: string;
  sceneNames: Map<string, string>;
  paletteFor: (id: string) => string;
  isModerator: boolean;
  isHashSelected: (hash: string) => boolean;
  onToggleHash: (hash: string) => void;
  expandedHashes: Set<string>;
  onToggleExpand: (rowKey: string) => void;
}

const sumSubmissions = (oshashes: ClusterOshashLink[]) =>
  oshashes.reduce(
    (sum, o) =>
      sum + o.scene_submissions.reduce((s, x) => s + x.submissions, 0),
    0,
  );

interface SceneCellProps {
  member: Pick<ClusterMember, "scene_submissions">;
  seedSceneId: string;
  sceneNames: Map<string, string>;
  paletteFor: (id: string) => string;
}

const SceneCell: FC<SceneCellProps> = ({
  member,
  seedSceneId,
  sceneNames,
  paletteFor,
}) => (
  <div className="d-flex flex-wrap gap-1">
    {member.scene_submissions.map((s) => (
      <SceneChip
        key={s.scene_id}
        color={paletteFor(s.scene_id)}
        isSeed={s.scene_id === seedSceneId}
        title={`${s.submissions} submissions, ${s.reports} reports`}
      >
        {sceneNames.get(s.scene_id) || s.scene_id}
        {s.submissions > 1 ? ` ×${s.submissions}` : ""}
      </SceneChip>
    ))}
  </div>
);

export const ClusterMembersTable: FC<Props> = ({
  cluster,
  seedSceneId,
  sceneNames,
  paletteFor,
  isModerator,
  isHashSelected,
  onToggleHash,
  expandedHashes,
  onToggleExpand,
}) => {
  const tainted = cluster.tainted;
  return (
    <Table size="sm" variant="dark" striped responsive>
      <thead>
        <tr>
          <th>Hash</th>
          <th>Algorithm</th>
          <th>Scenes</th>
          <th className="text-end">Submissions</th>
          <th className="text-end">Reports</th>
        </tr>
      </thead>
      <tbody>
        {cluster.members.flatMap((m) => {
          const linkedOshashes = cluster.linked_oshashes.filter(
            (o) => o.attached_to === m.hash,
          );
          const rowKey = `hash:${m.hash}`;
          const expanded = expandedHashes.has(rowKey);
          const rows = [
            <tr key={rowKey}>
              <td>
                {isModerator && (
                  <input
                    type="checkbox"
                    className="me-2"
                    checked={isHashSelected(m.hash)}
                    disabled={tainted}
                    onChange={() => onToggleHash(m.hash)}
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
              <td>{m.algorithm}</td>
              <td>
                <SceneCell
                  member={m}
                  seedSceneId={seedSceneId}
                  sceneNames={sceneNames}
                  paletteFor={paletteFor}
                />
              </td>
              <td className="text-end">{m.total_submissions}</td>
              <td className="text-end">{m.total_reports}</td>
            </tr>,
          ];
          if (linkedOshashes.length > 0) {
            const oshashSubCount = sumSubmissions(linkedOshashes);
            rows.push(
              <tr key={`${rowKey}::oshash-summary`} className="text-muted">
                <td colSpan={5} style={{ paddingLeft: "2.5rem" }}>
                  <button
                    type="button"
                    onClick={() => onToggleExpand(rowKey)}
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
                    <span className="ms-2 small" style={{ opacity: 0.7 }}>
                      (follows phash on move / delete)
                    </span>
                  </button>
                </td>
              </tr>,
            );
            if (expanded) {
              for (const o of linkedOshashes) {
                const totalSubs = o.scene_submissions.reduce(
                  (sum, s) => sum + s.submissions,
                  0,
                );
                const totalReports = o.scene_submissions.reduce(
                  (sum, s) => sum + s.reports,
                  0,
                );
                rows.push(
                  <tr
                    key={`${rowKey}::oshash::${o.hash}`}
                    className="text-muted"
                  >
                    <td style={{ paddingLeft: "4rem" }}>
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
                    <td>OSHASH</td>
                    <td>
                      <SceneCell
                        member={o}
                        seedSceneId={seedSceneId}
                        sceneNames={sceneNames}
                        paletteFor={paletteFor}
                      />
                    </td>
                    <td className="text-end">{totalSubs}</td>
                    <td className="text-end">{totalReports}</td>
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
