import {
  type FC,
  type ReactNode,
  createContext,
  useContext,
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
  ...value
}) => (
  <ClusterPageContext.Provider value={value}>
    {children}
  </ClusterPageContext.Provider>
);
