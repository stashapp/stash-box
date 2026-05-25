import { type FC, useMemo } from "react";
import type { Cluster, ClusterMember } from "./types";

interface Props {
  cluster: Cluster;
  seedSceneId: string;
  paletteFor: (sceneId: string) => string;
  selectedHashes: Set<string>;
  onToggleMember: (member: ClusterMember) => void;
}

const VIEW_W = 900;
const VIEW_H = 560;
const MARGIN = 60;
const NODE_MIN_R = 6;
const NODE_MAX_R = 22;

const hashToBig = (hex: string): bigint => BigInt(`0x${hex}`);

const hammingHex = (a: string, b: string): number => {
  let x = hashToBig(a) ^ hashToBig(b);
  let n = 0;
  while (x > 0n) {
    if (x & 1n) n++;
    x >>= 1n;
  }
  return n;
};

const dominantScene = (m: ClusterMember): string | null =>
  m.scene_submissions[0]?.scene_id ?? null;

const seededRandom = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
};

const hashSeed = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};

const powerIterate = (
  B: number[][],
  rand: () => number,
  maxIter = 200,
  tol = 1e-8,
): { value: number; vector: number[] } => {
  const n = B.length;
  let v: number[] = Array.from({ length: n }, () => rand() - 0.5);
  let norm = Math.hypot(...v);
  if (norm === 0) {
    v = v.map((_, i) => (i === 0 ? 1 : 0));
    norm = 1;
  }
  v = v.map((x) => x / norm);
  let lambda = 0;
  for (let iter = 0; iter < maxIter; iter++) {
    const Bv = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = 0;
      const row = B[i];
      for (let j = 0; j < n; j++) s += row[j] * v[j];
      Bv[i] = s;
    }
    const newNorm = Math.hypot(...Bv);
    if (newNorm < tol) break;
    const newV = Bv.map((x) => x / newNorm);
    let newLambda = 0;
    for (let i = 0; i < n; i++) newLambda += Bv[i] * v[i];
    const converged = Math.abs(newLambda - lambda) < tol;
    v = newV;
    lambda = newLambda;
    if (converged) break;
  }
  return { value: lambda, vector: v };
};

const classicalMDS = (
  D: number[][],
  rand: () => number,
): { x: number[]; y: number[] } => {
  const n = D.length;
  if (n === 0) return { x: [], y: [] };
  if (n === 1) return { x: [0], y: [0] };
  if (n === 2) {
    const d = D[0][1] / 2;
    return { x: [-d, d], y: [0, 0] };
  }
  const D2 = D.map((row) => row.map((d) => -0.5 * d * d));
  const rowMeans = D2.map((row) => row.reduce((s, x) => s + x, 0) / n);
  let grandMean = 0;
  for (let i = 0; i < n; i++) grandMean += rowMeans[i] / n;
  const B: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n);
    for (let j = 0; j < n; j++) {
      row[j] = D2[i][j] - rowMeans[i] - rowMeans[j] + grandMean;
    }
    B.push(row);
  }
  const { value: lambda1, vector: v1 } = powerIterate(B, rand);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) B[i][j] -= lambda1 * v1[i] * v1[j];
  }
  const { value: lambda2, vector: v2 } = powerIterate(B, rand);
  const s1 = Math.sqrt(Math.max(0, lambda1));
  const s2 = Math.sqrt(Math.max(0, lambda2));
  return { x: v1.map((c) => c * s1), y: v2.map((c) => c * s2) };
};

const radiusForSubmissions = (
  submissions: number,
  minSubs: number,
  maxSubs: number,
): number => {
  if (maxSubs === minSubs) return (NODE_MIN_R + NODE_MAX_R) / 2;
  const t =
    (Math.sqrt(submissions) - Math.sqrt(minSubs)) /
    (Math.sqrt(maxSubs) - Math.sqrt(minSubs));
  return NODE_MIN_R + t * (NODE_MAX_R - NODE_MIN_R);
};

export const ClusterCanvas: FC<Props> = ({
  cluster,
  seedSceneId,
  paletteFor,
  selectedHashes,
  onToggleMember,
}) => {
  const { nodes, edges } = useMemo(() => {
    const members = cluster.members;
    if (members.length === 0) {
      return {
        nodes: [] as {
          member: ClusterMember;
          x: number;
          y: number;
          r: number;
          color: string;
        }[],
        edges: [] as {
          ax: number;
          ay: number;
          bx: number;
          by: number;
          distance: number;
          key: string;
        }[],
      };
    }

    let minSubs = Number.POSITIVE_INFINITY;
    let maxSubs = 0;
    for (const m of members) {
      const s = Math.max(1, m.total_submissions);
      if (s < minSubs) minSubs = s;
      if (s > maxSubs) maxSubs = s;
    }
    if (!Number.isFinite(minSubs)) minSubs = 1;

    const rand = seededRandom(hashSeed(cluster.id));
    let coords: { x: number[]; y: number[] };
    if (members.length === 1) {
      coords = { x: [0], y: [0] };
    } else {
      const D: number[][] = [];
      for (let i = 0; i < members.length; i++)
        D.push(new Array(members.length).fill(0));
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const d = hammingHex(members[i].hash, members[j].hash);
          D[i][j] = d;
          D[j][i] = d;
        }
      }
      coords = classicalMDS(D, rand);
    }

    let cx0 = 0;
    let cy0 = 0;
    for (let i = 0; i < members.length; i++) {
      cx0 += coords.x[i];
      cy0 += coords.y[i];
    }
    cx0 /= members.length;
    cy0 /= members.length;

    let maxRx = 0;
    let maxRy = 0;
    for (let i = 0; i < members.length; i++) {
      const dx = Math.abs(coords.x[i] - cx0);
      const dy = Math.abs(coords.y[i] - cy0);
      if (dx > maxRx) maxRx = dx;
      if (dy > maxRy) maxRy = dy;
    }
    const availW = VIEW_W - MARGIN * 2;
    const availH = VIEW_H - MARGIN * 2;
    const scaleX = maxRx > 1e-6 ? availW / 2 / maxRx : 1;
    const scaleY = maxRy > 1e-6 ? availH / 2 / maxRy : 1;
    const scale = Math.min(scaleX, scaleY);

    const positionByHash = new Map<string, { x: number; y: number }>();
    const nodes = members.map((m, i) => {
      const x = VIEW_W / 2 + (coords.x[i] - cx0) * scale;
      const y = VIEW_H / 2 + (coords.y[i] - cy0) * scale;
      positionByHash.set(m.hash, { x, y });
      const sc = dominantScene(m);
      return {
        member: m,
        x,
        y,
        r: radiusForSubmissions(
          Math.max(1, m.total_submissions),
          minSubs,
          maxSubs,
        ),
        color: sc ? paletteFor(sc) : "#666",
      };
    });

    const edges = cluster.edges
      .map((e) => {
        const a = positionByHash.get(e.a);
        const b = positionByHash.get(e.b);
        if (!a || !b) return null;
        return {
          ax: a.x,
          ay: a.y,
          bx: b.x,
          by: b.y,
          distance: e.distance,
          key: `${e.a}-${e.b}`,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return { nodes, edges };
  }, [cluster, paletteFor]);

  if (cluster.members.length === 0) {
    return (
      <div className="text-muted py-4 text-center">
        No fingerprints in this cluster.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label="Cluster node graph"
    >
      <title>Cluster node graph</title>
      {edges.map((e) => {
        const mx = (e.ax + e.bx) / 2;
        const my = (e.ay + e.by) / 2;
        const opacity = Math.max(0.25, 1 - e.distance / 16);
        return (
          <g key={e.key} pointerEvents="none">
            <line
              x1={e.ax}
              y1={e.ay}
              x2={e.bx}
              y2={e.by}
              stroke="#bbb"
              strokeOpacity={opacity}
              strokeWidth={Math.max(0.8, 2.4 - e.distance / 6)}
            />
            <text
              x={mx}
              y={my - 3}
              fontSize={10}
              textAnchor="middle"
              fill="#fff"
              fillOpacity={0.85}
              stroke="#000"
              strokeWidth={2}
              paintOrder="stroke"
            >
              {e.distance}
            </text>
          </g>
        );
      })}
      {nodes.map((n) => {
        const isSelected = selectedHashes.has(n.member.hash);
        const isSeed = dominantScene(n.member) === seedSceneId;
        return (
          <g
            key={n.member.hash}
            role="button"
            tabIndex={0}
            aria-label={`Toggle fingerprint ${n.member.hash.slice(0, 8)}`}
            style={{ cursor: "pointer" }}
            onClick={() => onToggleMember(n.member)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                onToggleMember(n.member);
              }
            }}
            transform={`translate(${n.x}, ${n.y})`}
          >
            <circle
              r={n.r + (isSelected ? 2.5 : 0)}
              fill={n.color}
              fillOpacity={cluster.tainted ? 0.55 : 0.95}
              stroke={
                isSelected
                  ? "#fff"
                  : cluster.tainted
                    ? "#dc3545"
                    : isSeed
                      ? "#fff"
                      : "#222"
              }
              strokeWidth={
                isSelected ? 2.5 : cluster.tainted ? 1.8 : isSeed ? 1.4 : 0.8
              }
              strokeDasharray={cluster.tainted ? "3 2" : undefined}
            />
            <title>{`${n.member.hash.slice(0, 12)} · ${n.member.total_submissions} submissions`}</title>
          </g>
        );
      })}
    </svg>
  );
};
