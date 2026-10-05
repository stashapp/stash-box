import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import type { Cluster } from "./types";

interface Selection {
  selectedHashes: Set<string>;
  toggle: (hash: string) => void;
  isSelected: (hash: string) => boolean;
  clear: () => void;
  setMany: (hashes: string[], on: boolean) => void;
}

interface ExpandedRows {
  expanded: Set<string>;
  toggle: (rowKey: string) => void;
}

interface ClusterPageContextValue {
  clusters: Cluster[];
  activeCluster: Cluster | undefined;
  activeIndex: number;
  switchTo: (index: number) => boolean;
  seedSceneId: string;
  isModerator: boolean;
  paletteFor: (sceneId: string) => string;
  distanceThreshold: number;
  selection: Selection;
  expandedRows: ExpandedRows;
  moving: boolean;
  openMoveModal: () => void;
}

const ClusterPageContext = createContext<ClusterPageContextValue | null>(null);

export const useClusterPage = (): ClusterPageContextValue => {
  const ctx = useContext(ClusterPageContext);
  if (!ctx)
    throw new Error("useClusterPage must be used within ClusterPageProvider");
  return ctx;
};

interface ProviderProps extends ClusterPageContextValue {
  children: ReactNode;
}

export const ClusterPageProvider: FC<ProviderProps> = ({
  children,
  clusters,
  activeCluster,
  activeIndex,
  switchTo,
  seedSceneId,
  isModerator,
  paletteFor,
  distanceThreshold,
  selection,
  expandedRows,
  moving,
  openMoveModal,
}) => {
  const value = useMemo(
    () => ({
      clusters,
      activeCluster,
      activeIndex,
      switchTo,
      seedSceneId,
      isModerator,
      paletteFor,
      distanceThreshold,
      selection,
      expandedRows,
      moving,
      openMoveModal,
    }),
    [
      clusters,
      activeCluster,
      activeIndex,
      switchTo,
      seedSceneId,
      isModerator,
      paletteFor,
      distanceThreshold,
      selection,
      expandedRows,
      moving,
      openMoveModal,
    ],
  );
  return (
    <ClusterPageContext.Provider value={value}>
      {children}
    </ClusterPageContext.Provider>
  );
};
