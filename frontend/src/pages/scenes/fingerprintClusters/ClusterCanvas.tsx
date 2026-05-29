import { type FC, useMemo } from "react";
import { useClusterPage } from "./ClusterPageContext";
import {
  computeLayout,
  dominantScene,
  type LayoutEdge,
  type LayoutNode,
  VIEW_H,
  VIEW_W,
} from "./clusterLayout";

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
  selected: boolean;
  seed: boolean;
  onToggle: () => void;
}> = ({ node: n, selected, seed, onToggle }) => {
  const stroke = selected ? "#fff" : seed ? "#fff" : "#222";
  const strokeWidth = selected ? 2.5 : seed ? 1.4 : 0.8;
  return (
    <g
      className="ClusterCanvas-node"
      role="button"
      tabIndex={0}
      aria-label={`Toggle fingerprint ${n.member.hash.slice(0, 8)}`}
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
        fillOpacity={0.95}
        stroke={stroke}
        strokeWidth={strokeWidth}
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
      className="ClusterCanvas"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
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
          selected={selection.selectedHashes.has(n.member.hash)}
          seed={dominantScene(n.member) === seedSceneId}
          onToggle={() => selection.toggle(n.member.hash)}
        />
      ))}
    </svg>
  );
};
