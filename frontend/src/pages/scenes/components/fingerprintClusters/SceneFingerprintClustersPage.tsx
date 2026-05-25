import { CombinedGraphQLErrors } from "@apollo/client";
import {
  faArrowRight,
  faCaretDown,
  faCaretRight,
  faExclamationTriangle,
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
  useFingerprintClusters,
  useMoveFingerprintSubmissions,
} from "src/graphql";
import { useCurrentUser, useToast } from "src/hooks";
import { ClusterCanvas } from "./ClusterCanvas";
import { ClusterList } from "./ClusterList";
import { ClusterMoveModal } from "./ClusterMoveModal";
import { SceneChip } from "./SceneChip";
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
  const [distance, setDistance] = useState<number>(SLIDER_MAX);
  const [debouncedDistance, setDebouncedDistance] = useState<number>(distance);

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

  const selectedPhashBreakdown = useMemo(() => {
    if (!activeCluster) return [];
    const out: {
      hash: string;
      perScene: {
        sceneId: string;
        submissions: number;
        durations: number[];
        durationSubmissions: number[];
      }[];
    }[] = [];
    for (const m of activeCluster.members) {
      if (!selectedHashes.has(m.hash)) continue;
      out.push({
        hash: m.hash,
        perScene: m.scene_submissions.map((s) => ({
          sceneId: s.scene_id,
          submissions: s.submissions,
          durations: s.durations,
          durationSubmissions: s.duration_submissions,
        })),
      });
    }
    return out;
  }, [selectedHashes, activeCluster]);

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

  // All scenes in the active cluster are valid targets — even a fingerprint
  // currently on just one (wrong) scene should be movable to a correct one.
  const moveCandidates = useMemo(() => {
    if (!activeCluster) return [];
    return activeCluster.scenes
      .map((s) => ({
        scene: s.scene,
        memberCount: s.member_count,
        submissionCount: s.submission_count,
      }))
      .sort((a, b) => b.submissionCount - a.submissionCount);
  }, [activeCluster]);

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

  // Hashes that exist on more than one scene in the active cluster — these
  // are the candidates that actually need consolidation.
  const multiSceneHashes = useMemo(() => {
    if (!activeCluster || activeCluster.tainted) return [];
    return activeCluster.members
      .filter((m) => m.scene_submissions.length > 1)
      .map((m) => m.hash);
  }, [activeCluster]);

  const selectMultiSceneHashes = () => {
    if (multiSceneHashes.length === 0) return;
    setMany(multiSceneHashes, true);
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
  const [showMove, setShowMove] = useState(false);

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
                    size="sm"
                    variant="primary"
                    onClick={selectMultiSceneHashes}
                    disabled={multiSceneHashes.length === 0}
                  >
                    Select hashes on &gt;1 scene ({multiSceneHashes.length})
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={
                      selectedHashes.size === 0 ||
                      moving ||
                      multiSceneHashes.length === 0
                    }
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
                          <code>{m.hash}</code>
                        </Link>
                      </td>
                      <td>{m.algorithm}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {m.scene_submissions.map((s) => (
                            <SceneChip
                              key={s.scene_id}
                              color={paletteFor(s.scene_id)}
                              isSeed={s.scene_id === scene.id}
                              title={`${s.submissions} submissions, ${s.reports} reports`}
                            >
                              {sceneNames.get(s.scene_id) || s.scene_id}
                              {s.submissions > 1 ? ` ×${s.submissions}` : ""}
                            </SceneChip>
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
                                <code>↪ {o.hash}</code>
                              </Link>
                            </td>
                            <td>OSHASH</td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {o.scene_submissions.map((os) => (
                                  <SceneChip
                                    key={os.scene_id}
                                    color={paletteFor(os.scene_id)}
                                    isSeed={os.scene_id === scene.id}
                                    title={`${os.submissions} submissions, ${os.reports} reports`}
                                  >
                                    {sceneNames.get(os.scene_id) || os.scene_id}
                                    {os.submissions > 1
                                      ? ` ×${os.submissions}`
                                      : ""}
                                  </SceneChip>
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
        selectedPhashes={selectedPhashBreakdown}
        sceneNames={sceneNames}
        seedSceneId={scene.id}
        paletteFor={paletteFor}
        moving={moving}
        onHide={() => setShowMove(false)}
        onMove={handleMove}
      />

    </div>
  );
};
