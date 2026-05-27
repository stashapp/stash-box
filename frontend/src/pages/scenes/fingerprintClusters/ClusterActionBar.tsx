import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Button } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import { useClusterPage } from "./ClusterPageContext";
import { multiSceneHashes } from "./utils";

export const ClusterActionBar: FC = () => {
  const { activeCluster, selection, moving, openMoveModal } = useClusterPage();
  const multiScene = multiSceneHashes(activeCluster);
  const selectedCount = selection.selectedHashes.size;
  return (
    <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={selection.clear}
        disabled={selectedCount === 0}
      >
        Clear ({selectedCount})
      </Button>
      <div className="ms-auto d-flex gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            selection.clear();
            selection.setMany(multiScene, true);
          }}
          disabled={multiScene.length === 0}
        >
          Select conflicting hashes ({multiScene.length})
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={selectedCount === 0 || moving}
          onClick={openMoveModal}
        >
          <Icon icon={faArrowRight} className="me-1" />
          Move hashes ({selectedCount})
        </Button>
      </div>
    </div>
  );
};
