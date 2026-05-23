import { faArrowRight, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { type FC, useEffect, useState } from "react";
import { Alert, Button, Modal } from "react-bootstrap";
import SceneCard from "src/components/sceneCard";
import { Icon } from "src/components/fragments";
import type { ClusterSceneSummary } from "./types";

export interface MoveCandidate {
  scene: ClusterSceneSummary["scene"];
  memberCount: number;
  submissionCount: number;
}

interface Props {
  show: boolean;
  hashCount: number;
  submissionCount: number;
  linkedOshashCount: number;
  candidates: MoveCandidate[];
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
  seedSceneId,
  paletteFor,
  moving,
  onHide,
  onMove,
}) => {
  const [target, setTarget] = useState<string | undefined>();
  const nothingToMove = candidates.length <= 1;

  useEffect(() => {
    if (!show || candidates.length === 0) {
      setTarget(undefined);
      return;
    }
    const seedCandidate = candidates.find((c) => c.scene.id === seedSceneId);
    setTarget(
      seedCandidate ? seedCandidate.scene.id : candidates[0].scene.id,
    );
  }, [show, candidates, seedSceneId]);

  const handleMove = async () => {
    if (!target) return;
    const ok = await onMove(target);
    if (ok) setTarget(undefined);
  };

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Move Cluster Fingerprints</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Consolidating <strong>{hashCount}</strong> fingerprint
          {hashCount === 1 ? "" : "s"} currently spread across{" "}
          <strong>{candidates.length}</strong> scene
          {candidates.length === 1 ? "" : "s"} (
          <strong>{submissionCount}</strong> user submission
          {submissionCount === 1 ? "" : "s"}
          {linkedOshashCount > 0
            ? `, plus ${linkedOshashCount} linked OSHASH${
                linkedOshashCount === 1 ? "" : "es"
              }`
            : ""}
          ) into the target scene below. Submissions already on the target are
          left alone.
        </p>
        {nothingToMove ? (
          <Alert variant="info" className="mb-0">
            The selected fingerprint
            {hashCount === 1 ? " is" : "s are"} only on{" "}
            {candidates.length === 1
              ? `scene "${candidates[0].scene.title || "Untitled"}"`
              : "a single scene"}
            . Nothing to consolidate.
          </Alert>
        ) : (
          <div
            className="d-grid gap-3"
            style={{
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            }}
          >
            {candidates.map((c) => {
              const isTarget = c.scene.id === target;
              const isSeed = c.scene.id === seedSceneId;
              return (
                <button
                  key={c.scene.id}
                  type="button"
                  onClick={() => setTarget(c.scene.id)}
                  className="p-0 text-start border-0 bg-transparent"
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className="rounded p-2"
                    style={{
                      outline: isTarget
                        ? "3px solid #ffd54f"
                        : "3px solid transparent",
                      transition: "outline-color 150ms ease",
                    }}
                  >
                    <div
                      className="d-flex align-items-center gap-2 mb-2 small"
                      style={{ color: paletteFor(c.scene.id) }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          backgroundColor: paletteFor(c.scene.id),
                          borderRadius: 2,
                          border: isSeed ? "2px solid #fff" : undefined,
                        }}
                      />
                      {isSeed && (
                        <span className="text-light fw-bold">★ Seed scene</span>
                      )}
                      {c.scene.deleted && (
                        <span className="badge bg-danger">deleted</span>
                      )}
                    </div>
                    <SceneCard scene={c.scene} />
                    <div className="mt-2 d-flex justify-content-between small">
                      <span>
                        <strong>{c.submissionCount}</strong> submission
                        {c.submissionCount === 1 ? "" : "s"}
                      </span>
                      <span className="text-muted">
                        {c.memberCount} fingerprint
                        {c.memberCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleMove}
          disabled={moving || !target || nothingToMove}
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
