import { type FC, useMemo } from "react";
import {
  type LayoutEdge,
  type LayoutNode,
  VIEW_H,
  VIEW_W,
  computeLayout,
  dominantScene,
} from "./clusterLayout";
import { useClusterPage } from "./ClusterPageContext";

const Edge: FC<{ edge: LayoutEdge }> = ({ edge: e }) => {
  const mx = (e.ax + e.bx) / 2;
  const my = (e.ay + e.by) / 2;
  return (
    <g pointerEvents="none">
      <line
        x1={e.ax}
        y1={e.ay}
        x2={e.bx}
        y2={e.by}
        stroke="#bbb"
        strokeOpacity={Math.max(0.25, 1 - e.distance / 16)}
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
};

const Node: FC<{
  node: LayoutNode;
  poisoned: boolean;
  selected: boolean;
  seed: boolean;
  onToggle: () => void;
}> = ({ node: n, poisoned, selected, seed, onToggle }) => {
  const stroke = selected
    ? "#fff"
    : poisoned
      ? "#dc3545"
      : seed
        ? "#fff"
        : "#222";
  const strokeWidth = selected ? 2.5 : poisoned ? 1.8 : seed ? 1.4 : 0.8;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Toggle fingerprint ${n.member.hash.slice(0, 8)}`}
      style={{ cursor: "pointer" }}
      onClick={onToggle}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onToggle();
        }
      }}
      transform={`translate(${n.x}, ${n.y})`}
    >
      <circle
        r={n.r + (selected ? 2.5 : 0)}
        fill={n.color}
        fillOpacity={poisoned ? 0.55 : 0.95}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={poisoned ? "3 2" : undefined}
      />
      <title>{`${n.member.hash.slice(0, 12)} · ${n.submissions} submissions`}</title>
    </g>
  );
};

export const ClusterCanvas: FC = () => {
  const {
    activeCluster,
    seedSceneId,
    paletteFor,
    distanceThreshold,
    selection,
  } = useClusterPage();
  const { nodes, edges } = useMemo(
    () =>
      activeCluster
        ? computeLayout(activeCluster, paletteFor, distanceThreshold)
        : { nodes: [], edges: [] },
    [activeCluster, paletteFor, distanceThreshold],
  );

  if (!activeCluster || nodes.length === 0) {
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
      {edges.map((e) => (
        <Edge key={e.key} edge={e} />
      ))}
      {nodes.map((n) => (
        <Node
          key={n.member.hash}
          node={n}
          poisoned={activeCluster.poisoned}
          selected={selection.selectedHashes.has(n.member.hash)}
          seed={dominantScene(n.member) === seedSceneId}
          onToggle={() => selection.toggle(n.member.hash)}
        />
      ))}
    </svg>
  );
};
