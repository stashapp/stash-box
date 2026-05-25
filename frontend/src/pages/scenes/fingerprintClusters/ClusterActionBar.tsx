import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Button } from "react-bootstrap";
import { Icon } from "src/components/fragments";

interface Props {
  selectedHashCount: number;
  selectedKeyCount: number;
  linkedOshashCount: number;
  multiSceneHashCount: number;
  moving: boolean;
  onClear: () => void;
  onSelectMultiScene: () => void;
  onMoveClick: () => void;
}

export const ClusterActionBar: FC<Props> = ({
  selectedHashCount,
  selectedKeyCount,
  linkedOshashCount,
  multiSceneHashCount,
  moving,
  onClear,
  onSelectMultiScene,
  onMoveClick,
}) => (
  <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
    <Button
      size="sm"
      variant="outline-secondary"
      onClick={onClear}
      disabled={selectedHashCount === 0}
    >
      Clear ({selectedHashCount})
    </Button>
    <div className="ms-auto d-flex gap-2">
      <Button
        size="sm"
        variant="primary"
        onClick={onSelectMultiScene}
        disabled={multiSceneHashCount === 0}
      >
        Select hashes on &gt;1 scene ({multiSceneHashCount})
      </Button>
      <Button
        variant="primary"
        size="sm"
        disabled={selectedHashCount === 0 || moving}
        onClick={onMoveClick}
      >
        <Icon icon={faArrowRight} className="me-1" />
        Move {selectedHashCount}
        {selectedKeyCount > selectedHashCount
          ? ` (${selectedKeyCount} subs)`
          : ""}
        {linkedOshashCount > 0 ? ` +${linkedOshashCount} oshash` : ""}
      </Button>
    </div>
  </div>
);
