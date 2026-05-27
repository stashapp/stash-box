import { faArrowRight, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { type FC, useEffect, useMemo, useState } from "react";
import { Alert, Button, Modal, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon, PerformerName } from "src/components/fragments";
import { ROUTE_SCENE } from "src/constants/route";
import { formatDuration } from "src/utils";
import { SceneChip } from "./SceneChip";
import type { ClusterMember } from "./types";
import {
  type ClusterSceneSummary,
  dominantDuration,
  memberDurationCounts,
} from "./utils";

interface Props {
  show: boolean;
  hashCount: number;
  submissionCount: number;
  linkedOshashCount: number;
  candidates: ClusterSceneSummary[];
  selectedMembers: ClusterMember[];
  seedSceneId: string;
  paletteFor: (sceneId: string) => string;
  moving: boolean;
  onHide: () => void;
  onMove: (targetSceneId: string) => Promise<boolean>;
}

export const ClusterMoveModal: FC<Props> = ({
  show,
  hashCount,
  submissionCount,
  linkedOshashCount,
  candidates,
  selectedMembers,
  seedSceneId,
  paletteFor,
  moving,
  onHide,
  onMove,
}) => {
  const [target, setTarget] = useState<string | undefined>();

  useEffect(() => {
    if (!show || candidates.length === 0) {
      setTarget(undefined);
      return;
    }
    setTarget(candidates[0].scene.id);
  }, [show, candidates]);

  const handleMove = async () => {
    if (!target) return;
    const ok = await onMove(target);
    if (ok) setTarget(undefined);
  };

  // Warn when the dominant fingerprint duration of any selected hash
  // differs from the target scene's metadata duration by more than 5s.
  const durationMismatches = useMemo(() => {
    const targetScene = candidates.find((c) => c.scene.id === target)?.scene;
    if (!targetScene?.duration) return [];
    const tDur = targetScene.duration;
    const out: { hash: string; fpDuration: number; diff: number }[] = [];
    for (const m of selectedMembers) {
      const dom = dominantDuration(m);
      if (dom !== null && Math.abs(dom - tDur) > 5) {
        out.push({ hash: m.hash, fpDuration: dom, diff: dom - tDur });
      }
    }
    return out;
  }, [candidates, target, selectedMembers]);

  return (
    <Modal show={show} onHide={onHide} size="xl" className="ClusterMoveModal">
      <Modal.Header closeButton>
        <Modal.Title>Move Cluster Fingerprints</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Consolidating <strong>{hashCount}</strong> fingerprint
          {hashCount === 1 ? "" : "s"} (<strong>{submissionCount}</strong> user
          submission{submissionCount === 1 ? "" : "s"}
          {linkedOshashCount > 0
            ? `, plus ${linkedOshashCount} linked OSHASH${
                linkedOshashCount === 1 ? "" : "es"
              }`
            : ""}
          ) into the target scene below. Submissions already on the target are
          left alone.
        </p>

        {selectedMembers.length > 0 && (
          <details className="mb-3" open>
            <summary className="mb-2">
              Selected fingerprint{selectedMembers.length === 1 ? "" : "s"}
            </summary>
            <Table variant="dark" size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Hash</th>
                  <th>Duration</th>
                  <th>Scenes</th>
                  <th className="text-end">Submissions</th>
                </tr>
              </thead>
              <tbody>
                {selectedMembers.map((m) => {
                  const durations = memberDurationCounts(m);
                  const totalSubs = m.scene_submissions.reduce(
                    (sum, s) => sum + s.submissions,
                    0,
                  );
                  return (
                    <tr key={m.hash}>
                      <td>
                        <code>{m.hash}</code>
                      </td>
                      <td className="small">
                        {durations.length === 0
                          ? "—"
                          : durations
                              .map(([d, n]) =>
                                durations.length === 1
                                  ? formatDuration(d)
                                  : `${formatDuration(d)} (${n}×)`,
                              )
                              .join(", ")}
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {m.scene_submissions.map((s) => (
                            <SceneChip
                              key={s.scene.id}
                              color={paletteFor(s.scene.id)}
                              isSeed={s.scene.id === seedSceneId}
                              title={`${s.submissions} submission${s.submissions === 1 ? "" : "s"}`}
                            >
                              {s.scene.title || s.scene.id}
                              {s.submissions > 1 ? ` ×${s.submissions}` : ""}
                            </SceneChip>
                          ))}
                        </div>
                      </td>
                      <td className="text-end">{totalSubs}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </details>
        )}

        {candidates.length === 0 ? (
          <Alert variant="info" className="mb-0">
            This cluster has no scenes to move into.
          </Alert>
        ) : (
          <Table variant="dark" size="sm" hover>
            <thead>
              <tr>
                <th style={{ width: 1 }} />
                <th>Scene</th>
                <th>Performers</th>
                <th>Studio</th>
                <th className="text-end">Duration</th>
                <th className="text-end">Fingerprints</th>
                <th className="text-end">Submissions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => {
                const isTarget = c.scene.id === target;
                const isSeed = c.scene.id === seedSceneId;
                return (
                  <tr
                    key={c.scene.id}
                    onClick={() => setTarget(c.scene.id)}
                    className={isTarget ? "is-target" : undefined}
                  >
                    <td>
                      <input
                        type="radio"
                        name="move-target"
                        checked={isTarget}
                        onChange={() => setTarget(c.scene.id)}
                        aria-label={`Select ${c.scene.title || "Untitled"} as target`}
                      />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <SceneChip
                          color={paletteFor(c.scene.id)}
                          isSeed={isSeed}
                        >
                          {isSeed ? "Seed" : "Scene"}
                        </SceneChip>
                        <Link
                          to={ROUTE_SCENE.replace(":id", c.scene.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-light"
                        >
                          <strong>{c.scene.title || "Untitled"}</strong>
                        </Link>
                        {c.scene.deleted && (
                          <span className="badge bg-danger">deleted</span>
                        )}
                        {c.scene.release_date && (
                          <span className="text-muted small">
                            ({c.scene.release_date})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="small">
                      {c.scene.performers.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        c.scene.performers.map((p, i) => (
                          <span key={p.performer.id}>
                            {i > 0 && ", "}
                            <PerformerName
                              performer={p.performer}
                              as={p.as ?? undefined}
                            />
                          </span>
                        ))
                      )}
                    </td>
                    <td className="small">
                      {c.scene.studio?.name ?? (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-end small">
                      {c.scene.duration
                        ? formatDuration(c.scene.duration)
                        : "—"}
                    </td>
                    <td className="text-end">{c.memberCount}</td>
                    <td className="text-end">
                      <strong>{c.submissionCount}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}

        {durationMismatches.length > 0 && (
          <Alert variant="warning" className="mt-3 mb-0">
            <strong>Duration mismatch:</strong>{" "}
            {durationMismatches.length === 1
              ? "1 selected fingerprint differs"
              : `${durationMismatches.length} selected fingerprints differ`}{" "}
            from the target scene's duration by more than 5 seconds.
            <ul className="mb-0 mt-1 small">
              {durationMismatches.slice(0, 5).map((m) => (
                <li key={m.hash}>
                  <code>{m.hash}</code>: {formatDuration(m.fpDuration)} (
                  {m.diff > 0 ? "+" : ""}
                  {m.diff}s)
                </li>
              ))}
              {durationMismatches.length > 5 && (
                <li>…and {durationMismatches.length - 5} more</li>
              )}
            </ul>
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleMove}
          disabled={moving || !target}
        >
          {moving ? (
            <>
              <Icon icon={faSpinner} className="fa-spin me-1" />
              Moving...
            </>
          ) : (
            <>
              <Icon icon={faArrowRight} className="me-1" />
              Move to selected
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
