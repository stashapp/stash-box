import type { Cluster, ClusterMember } from "./types";
import { memberTotalSubmissions } from "./utils";

export const VIEW_W = 900;
export const VIEW_H = 560;
const MARGIN = 60;
const NODE_MIN_R = 6;
const NODE_MAX_R = 22;

export interface LayoutNode {
  member: ClusterMember;
  submissions: number;
  x: number;
  y: number;
  r: number;
  color: string;
}

export interface LayoutEdge {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  distance: number;
  key: string;
}

const popcount32 = (n: number): number => {
  n = n - ((n >>> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  return (((n + (n >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
};

const hammingHex = (a: string, b: string): number =>
  popcount32(parseInt(a.slice(0, 8), 16) ^ parseInt(b.slice(0, 8), 16)) +
  popcount32(parseInt(a.slice(8, 16), 16) ^ parseInt(b.slice(8, 16), 16));

export const dominantScene = (m: ClusterMember): string | null =>
  m.scene_submissions[0]?.scene.id ?? null;

// Top eigenvector via power iteration; deflate after the first call to get
// the second one. Seed is deterministic (sin(i)) so identical inputs produce
// identical layouts — prevents the canvas from reshuffling on re-renders.
const powerIterate = (B: number[][]): { value: number; vector: number[] } => {
  const n = B.length;
  let v = Array.from({ length: n }, (_, i) => Math.sin(i + 1));
  let norm = Math.hypot(...v) || 1;
  v = v.map((x) => x / norm);
  let lambda = 0;
  for (let iter = 0; iter < 200; iter++) {
    const Bv = B.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
    norm = Math.hypot(...Bv);
    if (norm < 1e-8) break;
    const next = Bv.map((x) => x / norm);
    const nextLambda = Bv.reduce((s, x, i) => s + x * v[i], 0);
    const converged = Math.abs(nextLambda - lambda) < 1e-8;
    v = next;
    lambda = nextLambda;
    if (converged) break;
  }
  return { value: lambda, vector: v };
};

// Classical (Torgerson) MDS into 2D from a pairwise distance matrix.
const classicalMDS = (D: number[][]): { x: number[]; y: number[] } => {
  const n = D.length;
  if (n <= 1) return { x: n === 1 ? [0] : [], y: n === 1 ? [0] : [] };
  if (n === 2) return { x: [-D[0][1] / 2, D[0][1] / 2], y: [0, 0] };

  // Double-centered squared-distance matrix.
  const D2 = D.map((row) => row.map((d) => -0.5 * d * d));
  const rowMeans = D2.map((row) => row.reduce((s, x) => s + x, 0) / n);
  const grandMean = rowMeans.reduce((s, x) => s + x, 0) / n;
  const B = D2.map((row, i) =>
    row.map((d, j) => d - rowMeans[i] - rowMeans[j] + grandMean),
  );

  const e1 = powerIterate(B);
  // Deflate to find the second eigenvector.
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      B[i][j] -= e1.value * e1.vector[i] * e1.vector[j];
  const e2 = powerIterate(B);

  const s1 = Math.sqrt(Math.max(0, e1.value));
  const s2 = Math.sqrt(Math.max(0, e2.value));
  return {
    x: e1.vector.map((c) => c * s1),
    y: e2.vector.map((c) => c * s2),
  };
};

const radiusForSubmissions = (subs: number, min: number, max: number) => {
  if (max === min) return (NODE_MIN_R + NODE_MAX_R) / 2;
  const t =
    (Math.sqrt(subs) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min));
  return NODE_MIN_R + t * (NODE_MAX_R - NODE_MIN_R);
};

// Scale layout coords to fill the viewport with `MARGIN` padding.
const fitToViewport = (coords: { x: number[]; y: number[] }) => {
  const n = coords.x.length;
  const cx = coords.x.reduce((s, x) => s + x, 0) / n;
  const cy = coords.y.reduce((s, y) => s + y, 0) / n;
  const maxRx = Math.max(...coords.x.map((x) => Math.abs(x - cx)), 1e-6);
  const maxRy = Math.max(...coords.y.map((y) => Math.abs(y - cy)), 1e-6);
  const scale = Math.min(
    (VIEW_W - MARGIN * 2) / 2 / maxRx,
    (VIEW_H - MARGIN * 2) / 2 / maxRy,
  );
  return coords.x.map((_, i) => ({
    x: VIEW_W / 2 + (coords.x[i] - cx) * scale,
    y: VIEW_H / 2 + (coords.y[i] - cy) * scale,
  }));
};

export const computeLayout = (
  cluster: Cluster,
  paletteFor: (sceneId: string) => string,
  distanceThreshold: number,
): { nodes: LayoutNode[]; edges: LayoutEdge[] } => {
  const members = cluster.members;
  if (members.length === 0) return { nodes: [], edges: [] };

  const subCounts = members.map((m) => Math.max(1, memberTotalSubmissions(m)));
  const minSubs = Math.min(...subCounts);
  const maxSubs = Math.max(...subCounts);

  const D = members.map(() => new Array(members.length).fill(0));
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const d = hammingHex(members[i].hash, members[j].hash);
      D[i][j] = d;
      D[j][i] = d;
    }
  }
  const positions =
    members.length === 1
      ? [{ x: VIEW_W / 2, y: VIEW_H / 2 }]
      : fitToViewport(classicalMDS(D));

  const nodes: LayoutNode[] = members.map((m, i) => {
    const sc = dominantScene(m);
    return {
      member: m,
      submissions: subCounts[i],
      x: positions[i].x,
      y: positions[i].y,
      r: radiusForSubmissions(subCounts[i], minSubs, maxSubs),
      color: sc ? paletteFor(sc) : "#666",
    };
  });

  const edges: LayoutEdge[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      if (D[i][j] > distanceThreshold) continue;
      edges.push({
        ax: positions[i].x,
        ay: positions[i].y,
        bx: positions[j].x,
        by: positions[j].y,
        distance: D[i][j],
        key: `${members[i].hash}-${members[j].hash}`,
      });
    }
  }

  return { nodes, edges };
};
