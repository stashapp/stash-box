import { CombinedGraphQLErrors } from "@apollo/client";
import {
  faArrowRight,
  faCaretDown,
  faCaretRight,
  faExclamationTriangle,
  faExternalLinkAlt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Form, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ErrorMessage, Icon, LoadingIndicator } from "src/components/fragments";
import { ROUTE_SCENE, ROUTE_SCENES } from "src/constants/route";
import {
  FingerprintAlgorithm,
  type FingerprintQueryInput,
  type SceneFragment as Scene,
  useDefaultPhashDistance,
  useDeleteFingerprintSubmissions,
  useFingerprintClusters,
  useMoveFingerprintSubmissions,
} from "src/graphql";
import { useCurrentUser, useToast } from "src/hooks";
import { ClusterCanvas } from "./ClusterCanvas";
import { ClusterList } from "./ClusterList";
import { ClusterMoveModal } from "./ClusterMoveModal";
import {
  type Cluster,
  type ClusterMember,
  type MemberKey,
  memberKeyId,
  sceneColor,
} from "./types";
import { useClusterSelection } from "./useClusterSelection";

interface Props {
  scene: Scene;
}

const SLIDER_MIN = 2;
const SLIDER_MAX = 8;
const SLIDER_STEP = 2;

const snapDistance = (n: number) => {
  const even = Math.round(n / 2) * 2;
  return Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, even));
};

const truncatedHash = (h: string) => (h.length > 12 ? `${h.slice(0, 12)}…` : h);

const fingerprintSearchHref = (hash: string) =>
  `${ROUTE_SCENES}?fingerprint=${encodeURIComponent(hash)}`;

// OSHASHes attached to a given phash hash on a given scene. The cluster
// service links an OSHASH to a phash when both were submitted by the same
// user, on the same scene, within ~1s.
const linkedOshashKeysFor = (
  cluster: Cluster,
  phashHash: string,
  sceneId: string,
): MemberKey[] => {
  const keys: MemberKey[] = [];
  for (const o of cluster.linked_oshashes) {
    if (o.attached_to !== phashHash) continue;
    if (!o.scene_submissions.some((s) => s.scene_id === sceneId)) continue;
    keys.push({
      hash: o.hash,
      algorithm: FingerprintAlgorithm.OSHASH,
      sceneId,
    });
  }
  return keys;
};

export const SceneFingerprintClustersPage: FC<Props> = ({ scene }) => {
  const addToast = useToast();
  const { isModerator } = useCurrentUser();
  const { data: defaultData } = useDefaultPhashDistance();
  const [distance, setDistance] = useState<number>(SLIDER_MAX);
  const [debouncedDistance, setDebouncedDistance] = useState<number>(distance);

  useEffect(() => {
    if (defaultData?.defaultPhashDistance !== undefined) {
      const v = snapDistance(defaultData.defaultPhashDistance);
      setDistance(v);
      setDebouncedDistance(v);
    }
  }, [defaultData?.defaultPhashDistance]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDistance(distance), 300);
    return () => clearTimeout(t);
  }, [distance]);

  const { data, loading, error, refetch } = useFingerprintClusters({
    input: { scene_id: scene.id, distance: debouncedDistance },
  });

  const clusters: Cluster[] = data?.fingerprintClusters ?? [];

  const [activeClusterId, setActiveClusterId] = useState<string | undefined>();

  useEffect(() => {
    if (clusters.length === 0) {
      setActiveClusterId(undefined);
      return;
    }
    if (!activeClusterId || !clusters.some((c) => c.id === activeClusterId)) {
      setActiveClusterId(clusters[0].id);
    }
  }, [clusters, activeClusterId]);

  const activeCluster = useMemo(
    () => clusters.find((c) => c.id === activeClusterId),
    [clusters, activeClusterId],
  );

  const [highlightedSceneId, setHighlightedSceneId] = useState<
    string | undefined
  >();

  // Reset highlight when clusters change.
  useEffect(() => {
    if (
      highlightedSceneId &&
      !clusters.some((c) =>
        c.scenes.some((s) => s.scene.id === highlightedSceneId),
      )
    ) {
      setHighlightedSceneId(undefined);
    }
  }, [clusters, highlightedSceneId]);

  const palette = useMemo(() => {
    const p = new Map<string, string>();
    sceneColor(scene.id, p);
    return p;
  }, [scene.id]);
  const paletteFor = useCallback(
    (id: string) => sceneColor(id, palette),
    [palette],
  );

  const sceneNames = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of clusters) {
      for (const s of c.scenes) m.set(s.scene.id, s.scene.title || "Untitled");
    }
    return m;
  }, [clusters]);

  const { selectedHashes, toggle, setMany, clear, isSelected } =
    useClusterSelection();

  // Expand selected hashes into per-scene MemberKeys for the mutations.
  const selectedKeys: MemberKey[] = useMemo(() => {
    const keys: MemberKey[] = [];
    if (!activeCluster) return keys;
    for (const m of activeCluster.members) {
      if (!selectedHashes.has(m.hash)) continue;
      for (const s of m.scene_submissions) {
        keys.push({
          hash: m.hash,
          algorithm: m.algorithm,
          sceneId: s.scene_id,
        });
      }
    }
    return keys;
  }, [selectedHashes, activeCluster]);

  // Auto-include OSHASHes attached to selected phashes on the same scene.
  // OSHASHes aren't selectable on their own; they follow their phash.
  const expandWithLinkedOshashes = useCallback(
    (keys: MemberKey[]): MemberKey[] => {
      if (!activeCluster) return keys;
      const expanded: MemberKey[] = [];
      const seen = new Set<string>();
      const push = (k: MemberKey) => {
        const id = memberKeyId(k);
        if (seen.has(id)) return;
        seen.add(id);
        expanded.push(k);
      };
      for (const k of keys) {
        push(k);
        if (k.algorithm === FingerprintAlgorithm.PHASH) {
          for (const linked of linkedOshashKeysFor(
            activeCluster,
            k.hash,
            k.sceneId,
          )) {
            push(linked);
          }
        }
      }
      return expanded;
    },
    [activeCluster],
  );

  const expandedSelection = useMemo(
    () => expandWithLinkedOshashes(selectedKeys),
    [selectedKeys, expandWithLinkedOshashes],
  );
  const linkedOshashCount = expandedSelection.length - selectedKeys.length;

  const sourceSceneCount = useMemo(
    () => new Set(selectedKeys.map((k) => k.sceneId)).size,
    [selectedKeys],
  );

  // Sum of user submissions across every (selected hash, source scene) pair.
  const selectedSubmissionCount = useMemo(() => {
    if (!activeCluster) return 0;
    let total = 0;
    for (const m of activeCluster.members) {
      if (!selectedHashes.has(m.hash)) continue;
      for (const s of m.scene_submissions) total += s.submissions;
    }
    return total;
  }, [selectedHashes, activeCluster]);

  // Only the scenes the selected fingerprints actually touch — those are the
  // valid consolidation targets. memberCount/submissionCount are scoped to
  // the selection, not the full cluster.
  const moveCandidates = useMemo(() => {
    if (!activeCluster) return [];
    const byScene = new Map<
      string,
      {
        scene: (typeof activeCluster.scenes)[number]["scene"];
        memberCount: number;
        submissionCount: number;
      }
    >();
    const sceneInfoById = new Map(
      activeCluster.scenes.map((s) => [s.scene.id, s.scene]),
    );
    for (const m of activeCluster.members) {
      if (!selectedHashes.has(m.hash)) continue;
      for (const s of m.scene_submissions) {
        const scene = sceneInfoById.get(s.scene_id);
        if (!scene) continue;
        const entry = byScene.get(s.scene_id) ?? {
          scene,
          memberCount: 0,
          submissionCount: 0,
        };
        entry.memberCount += 1;
        entry.submissionCount += s.submissions;
        byScene.set(s.scene_id, entry);
      }
    }
    return [...byScene.values()].sort(
      (a, b) => b.submissionCount - a.submissionCount,
    );
  }, [selectedHashes, activeCluster]);

  const activeSceneSummaries = useMemo(() => {
    const counts = new Map<
      string,
      { name: string; memberCount: number; isSeed: boolean }
    >();
    if (!activeCluster) return counts;
    for (const s of activeCluster.scenes) {
      counts.set(s.scene.id, {
        name: s.scene.title || "Untitled",
        memberCount: s.member_count,
        isSeed: s.scene.id === scene.id,
      });
    }
    return counts;
  }, [activeCluster, scene.id]);

  const allSceneSummaries = useMemo(() => {
    const counts = new Map<
      string,
      { name: string; memberCount: number; isSeed: boolean }
    >();
    for (const c of clusters) {
      for (const s of c.scenes) {
        const entry = counts.get(s.scene.id) ?? {
          name: s.scene.title || "Untitled",
          memberCount: 0,
          isSeed: s.scene.id === scene.id,
        };
        entry.memberCount += s.member_count;
        counts.set(s.scene.id, entry);
      }
    }
    return counts;
  }, [clusters, scene.id]);

  const onToggleMember = useCallback(
    (member: ClusterMember, clusterId: string) => {
      if (clusterId !== activeClusterId) {
        clear();
        setActiveClusterId(clusterId);
        setMany([member.hash], true);
        return;
      }
      toggle(member.hash);
    },
    [activeClusterId, clear, setMany, toggle],
  );

  const selectAllOnScene = (sceneId: string) => {
    if (!activeCluster || activeCluster.tainted) return;
    const hashes: string[] = [];
    for (const m of activeCluster.members) {
      if (m.scene_submissions.some((s) => s.scene_id === sceneId)) {
        hashes.push(m.hash);
      }
    }
    setMany(hashes, true);
  };

  const [expandedOshashKeys, setExpandedOshashKeys] = useState<Set<string>>(
    new Set(),
  );
  const toggleOshashExpand = (rowKey: string) => {
    setExpandedOshashKeys((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const [moveFingerprints, { loading: moving }] =
    useMoveFingerprintSubmissions();
  const [deleteFingerprints, { loading: deleting }] =
    useDeleteFingerprintSubmissions();
  const [showMove, setShowMove] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const groupBySource = (keys: MemberKey[]) => {
    const groups = new Map<string, FingerprintQueryInput[]>();
    for (const k of keys) {
      const list = groups.get(k.sceneId) ?? [];
      list.push({ hash: k.hash, algorithm: k.algorithm as never });
      groups.set(k.sceneId, list);
    }
    return groups;
  };

  const handleMove = async (targetSceneId: string): Promise<boolean> => {
    const groups = groupBySource(expandedSelection);
    if (groups.has(targetSceneId)) groups.delete(targetSceneId);
    let allOk = true;
    let total = 0;
    for (const [sourceSceneId, fingerprints] of groups.entries()) {
      try {
        const { data: res } = await moveFingerprints({
          variables: {
            input: {
              fingerprints,
              source_scene_id: sourceSceneId,
              target_scene_id: targetSceneId,
            },
          },
        });
        if (res?.sceneMoveFingerprintSubmissions) total += fingerprints.length;
        else allOk = false;
      } catch {
        allOk = false;
      }
    }
    addToast({
      variant: allOk ? "success" : "danger",
      content: allOk
        ? `Moved ${total} fingerprint submission(s) to ${targetSceneId}`
        : "One or more move operations failed",
    });
    if (allOk) {
      clear();
      setShowMove(false);
    }
    await refetch();
    return allOk;
  };

  const handleDelete = async () => {
    const groups = groupBySource(expandedSelection);
    let allOk = true;
    let total = 0;
    for (const [sceneId, fingerprints] of groups.entries()) {
      try {
        const { data: res } = await deleteFingerprints({
          variables: { input: { fingerprints, scene_id: sceneId } },
        });
        if (res?.sceneDeleteFingerprintSubmissions)
          total += fingerprints.length;
        else allOk = false;
      } catch {
        allOk = false;
      }
    }
    addToast({
      variant: allOk ? "success" : "danger",
      content: allOk
        ? `Deleted ${total} fingerprint submission(s)`
        : "One or more delete operations failed",
    });
    if (allOk) {
      clear();
      setShowConfirmDelete(false);
    }
    await refetch();
  };

  if (error) {
    let code: string | undefined;
    if (CombinedGraphQLErrors.is(error)) {
      const ext = error.errors?.[0]?.extensions as
        | { code?: string }
        | undefined;
      code = ext?.code;
    }
    if (code === "BKTREE_REQUIRED") {
      return (
        <ErrorMessage error="The bktree Postgres extension is required for phash distance clustering, but is not installed on this database." />
      );
    }
    return <ErrorMessage error={error.message} />;
  }

  const activeTainted = !!activeCluster?.tainted;

  return (
    <div>
      <h3 className="mb-2">
        Fingerprint clusters for{" "}
        <Link to={ROUTE_SCENE.replace(":id", scene.id)}>
          {scene.title || "Untitled"}
        </Link>
      </h3>
      <p className="text-muted">
        Phash fingerprints reachable from this scene within a Hamming distance.
        Node size scales with submission count; clusters that span more than 10
        scenes are flagged as tainted.
      </p>

      <Card bg="dark" text="light" className="mb-3">
        <Card.Body>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <Form.Label className="mb-0">Distance: {distance}</Form.Label>
            <Form.Range
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={SLIDER_STEP}
              value={distance}
              onChange={(e) =>
                setDistance(snapDistance(Number(e.target.value)))
              }
              style={{ maxWidth: 320 }}
            />
            {loading && <LoadingIndicator message="Computing clusters..." />}
          </div>
        </Card.Body>
      </Card>

      <Card bg="dark" text="light" className="mb-3">
        <Card.Body>
          <div className="d-flex gap-3" style={{ minHeight: 520 }}>
            <div
              style={{
                width: 320,
                flexShrink: 0,
                maxHeight: 620,
                overflowY: "auto",
              }}
            >
              <ClusterList
                clusters={clusters}
                seedSceneId={scene.id}
                activeClusterId={activeClusterId}
                highlightedSceneId={highlightedSceneId}
                paletteFor={paletteFor}
                onSelect={(clusterId) => {
                  if (clusterId === activeClusterId) return;
                  clear();
                  setActiveClusterId(clusterId);
                }}
              />
            </div>
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              {activeCluster ? (
                <ClusterCanvas
                  cluster={activeCluster}
                  seedSceneId={scene.id}
                  paletteFor={paletteFor}
                  selectedHashes={selectedHashes}
                  onToggleMember={(member) =>
                    onToggleMember(member, activeCluster.id)
                  }
                />
              ) : (
                <div className="text-muted py-4 text-center">
                  Select a cluster from the list to inspect it.
                </div>
              )}
            </div>
          </div>
          {allSceneSummaries.size > 0 && (
            <div className="d-flex flex-wrap gap-2 small mt-3 align-items-center">
              {[...allSceneSummaries.entries()].map(([id, info]) => {
                const isHighlighted = highlightedSceneId === id;
                return (
                  <span
                    key={id}
                    className="d-inline-flex align-items-center"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setHighlightedSceneId((curr) =>
                          curr === id ? undefined : id,
                        )
                      }
                      className="btn p-0 border-0"
                      style={{ cursor: "pointer" }}
                    >
                      <Badge
                        style={{
                          backgroundColor: paletteFor(id),
                          color: "#fff",
                          border: isHighlighted
                            ? "2px solid #ffd54f"
                            : info.isSeed
                              ? "2px solid #fff"
                              : "2px solid transparent",
                          boxShadow: isHighlighted
                            ? "0 0 0 2px rgba(255, 213, 79, 0.5)"
                            : undefined,
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                        }}
                      >
                        {info.isSeed ? "★ " : ""}
                        {info.name} · {info.memberCount} fp
                      </Badge>
                    </button>
                    <Link
                      to={ROUTE_SCENE.replace(":id", id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open scene "${info.name}"`}
                      aria-label={`Open scene ${info.name}`}
                      className="d-inline-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: paletteFor(id),
                        color: "#fff",
                        textDecoration: "none",
                        padding: "0 6px",
                        height: "100%",
                        minHeight: 22,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                        borderLeft: "1px solid rgba(255,255,255,0.35)",
                      }}
                    >
                      <Icon icon={faExternalLinkAlt} size="xs" />
                    </Link>
                  </span>
                );
              })}
              {highlightedSceneId && (
                <button
                  type="button"
                  onClick={() => setHighlightedSceneId(undefined)}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Clear scene filter
                </button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {activeCluster && (
        <Card bg="dark" text="light" className="mb-3">
          <Card.Body>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="text-muted small">
                Showing cluster {clusters.indexOf(activeCluster) + 1} of{" "}
                {clusters.length}
              </span>
              {activeTainted && (
                <Badge bg="danger">
                  <Icon icon={faExclamationTriangle} className="me-1" />
                  tainted (&gt;10 scenes)
                </Badge>
              )}
            </div>

            {activeTainted && (
              <Alert variant="warning" className="py-2">
                This cluster spans more than 10 scenes. Move/delete are disabled;
                triage manually.
              </Alert>
            )}

            {isModerator && !activeTainted && (
              <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {[...activeSceneSummaries.entries()].map(([id, info]) => (
                  <Button
                    key={id}
                    size="sm"
                    variant="outline-light"
                    onClick={() => selectAllOnScene(id)}
                  >
                    Select all on {info.name}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={clear}
                  disabled={selectedHashes.size === 0}
                >
                  Clear ({selectedHashes.size})
                </Button>
                <div className="ms-auto d-flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={selectedHashes.size === 0 || moving}
                    onClick={() => setShowMove(true)}
                  >
                    <Icon icon={faArrowRight} className="me-1" />
                    Move {selectedHashes.size}
                    {selectedKeys.length > selectedHashes.size
                      ? ` (${selectedKeys.length} subs)`
                      : ""}
                    {linkedOshashCount > 0
                      ? ` +${linkedOshashCount} oshash`
                      : ""}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={selectedHashes.size === 0 || deleting}
                    onClick={() => setShowConfirmDelete(true)}
                  >
                    <Icon icon={faTrash} className="me-1" />
                    Delete {selectedHashes.size}
                    {linkedOshashCount > 0
                      ? ` +${linkedOshashCount} oshash`
                      : ""}
                  </Button>
                </div>
              </div>
            )}

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
                {activeCluster.members.flatMap((m) => {
                  const linkedOshashes = activeCluster.linked_oshashes.filter(
                    (o) => o.attached_to === m.hash,
                  );
                  const rowKey = `hash:${m.hash}`;
                  const expanded = expandedOshashKeys.has(rowKey);
                  const oshashSubCount = linkedOshashes.reduce(
                    (sum, o) =>
                      sum +
                      o.scene_submissions.reduce(
                        (s, x) => s + x.submissions,
                        0,
                      ),
                    0,
                  );
                  const rowSelected = isSelected(m.hash);
                  const rows = [
                    <tr key={rowKey}>
                      <td>
                        {isModerator && (
                          <input
                            type="checkbox"
                            className="me-2"
                            checked={rowSelected}
                            disabled={activeTainted}
                            onChange={() => toggle(m.hash)}
                          />
                        )}
                        <Link
                          to={fingerprintSearchHref(m.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Find scenes with ${m.hash}`}
                          className="text-decoration-none"
                        >
                          <code>{truncatedHash(m.hash)}</code>
                        </Link>
                      </td>
                      <td>{m.algorithm}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {m.scene_submissions.map((s) => (
                            <Badge
                              key={s.scene_id}
                              style={{
                                backgroundColor: paletteFor(s.scene_id),
                                color: "#fff",
                                border:
                                  s.scene_id === scene.id
                                    ? "2px solid #fff"
                                    : undefined,
                              }}
                              title={`${s.submissions} submissions, ${s.reports} reports`}
                            >
                              {s.scene_id === scene.id ? "★ " : ""}
                              {sceneNames.get(s.scene_id) || s.scene_id}
                              {s.submissions > 1 ? ` ×${s.submissions}` : ""}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="text-end">{m.total_submissions}</td>
                      <td className="text-end">{m.total_reports}</td>
                    </tr>,
                  ];
                  if (linkedOshashes.length > 0) {
                    rows.push(
                      <tr
                        key={`${rowKey}::oshash-summary`}
                        className="text-muted"
                      >
                        <td colSpan={5} style={{ paddingLeft: "2.5rem" }}>
                          <button
                            type="button"
                            onClick={() => toggleOshashExpand(rowKey)}
                            className="btn btn-sm btn-link p-0 text-muted text-decoration-none"
                            aria-expanded={expanded}
                          >
                            <Icon
                              icon={expanded ? faCaretDown : faCaretRight}
                              className="me-2"
                            />
                            {linkedOshashes.length} linked OSHASH
                            {linkedOshashes.length === 1 ? "" : "es"} ·{" "}
                            {oshashSubCount} submission
                            {oshashSubCount === 1 ? "" : "s"}
                            <span
                              className="ms-2 small"
                              style={{ opacity: 0.7 }}
                            >
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
                                <code>↪ {truncatedHash(o.hash)}</code>
                              </Link>
                            </td>
                            <td>OSHASH</td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {o.scene_submissions.map((os) => (
                                  <Badge
                                    key={os.scene_id}
                                    style={{
                                      backgroundColor: paletteFor(os.scene_id),
                                      color: "#fff",
                                    }}
                                    title={`${os.submissions} submissions, ${os.reports} reports`}
                                  >
                                    {sceneNames.get(os.scene_id) || os.scene_id}
                                    {os.submissions > 1
                                      ? ` ×${os.submissions}`
                                      : ""}
                                  </Badge>
                                ))}
                              </div>
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
          </Card.Body>
        </Card>
      )}

      <ClusterMoveModal
        show={showMove}
        hashCount={selectedHashes.size}
        submissionCount={selectedSubmissionCount}
        linkedOshashCount={linkedOshashCount}
        candidates={moveCandidates}
        seedSceneId={scene.id}
        paletteFor={paletteFor}
        moving={moving}
        onHide={() => setShowMove(false)}
        onMove={handleMove}
      />

      {showConfirmDelete && (
        <Alert variant="danger">
          Delete {selectedKeys.length} fingerprint submission(s) across{" "}
          {sourceSceneCount} scene(s)? This can't be undone.
          <div className="mt-2">
            <Button
              size="sm"
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
              className="me-2"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowConfirmDelete(false)}
            >
              Cancel
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
};
