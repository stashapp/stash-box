import { type FC, useState } from "react";
import { Button, Table } from "react-bootstrap";
import { faArrowRight, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useCurrentUser } from "src/hooks";
import { Icon } from "src/components/fragments";
import type { FingerprintTableProps } from "./types";
import { useFingerprintSelection } from "./useFingerprintSelection";
import { useFingerprintSort } from "./useFingerprintSort";
import { useFingerprintOperations } from "./useFingerprintOperations";
import { FingerprintTableHeader } from "./FingerprintTableHeader";
import { FingerprintTableRow } from "./FingerprintTableRow";
import { MoveFingerprintsModal } from "./MoveFingerprintsModal";
import { DeleteFingerprintsModal } from "./DeleteFingerprintsModal";

export const FingerprintTable: FC<FingerprintTableProps> = ({ scene }) => {
  const { isModerator } = useCurrentUser();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { selectedFingerprints, toggleFingerprintSelection, clearSelection } =
    useFingerprintSelection();

  const { sortColumn, sortDirection, handleSort, sortedFingerprints } =
    useFingerprintSort(scene.fingerprints);

  const {
    handleFingerprintUnmatch,
    handleMoveFingerprints,
    handleDeleteFingerprints,
    unmatching,
    moving,
    deleting,
  } = useFingerprintOperations(scene.id);

  const handleMove = async (targetSceneId: string) => {
    const fingerprints = scene.fingerprints
      .filter((fp) => selectedFingerprints.has(fp.hash))
      .map((fp) => ({
        hash: fp.hash,
        algorithm: fp.algorithm,
      }));

    const success = await handleMoveFingerprints(fingerprints, targetSceneId);
    if (success) {
      clearSelection();
      setShowMoveModal(false);
    }
    return success;
  };

  const handleDelete = async () => {
    const fingerprints = scene.fingerprints
      .filter((fp) => selectedFingerprints.has(fp.hash))
      .map((fp) => ({
        hash: fp.hash,
        algorithm: fp.algorithm,
      }));

    const success = await handleDeleteFingerprints(fingerprints);
    if (success) {
      clearSelection();
      setShowDeleteModal(false);
    }
    return success;
  };

  return (
    <div className="scene-fingerprints my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Fingerprints:</h4>
        {isModerator && scene.fingerprints.length > 0 && (
          <div>
            <Button
              variant="primary"
              size="sm"
              className="me-2"
              disabled={selectedFingerprints.size === 0 || moving}
              onClick={() => setShowMoveModal(true)}
            >
              <Icon icon={faArrowRight} className="me-1" />
              Move Selected ({selectedFingerprints.size})
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={selectedFingerprints.size === 0 || deleting}
              onClick={() => setShowDeleteModal(true)}
            >
              <Icon icon={faTrash} className="me-1" />
              Delete Selected ({selectedFingerprints.size})
            </Button>
          </div>
        )}
      </div>
      {scene.fingerprints.length === 0 ? (
        <h6>No fingerprints found for this scene.</h6>
      ) : (
        <Table striped variant="dark">
          <FingerprintTableHeader
            isModerator={isModerator}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <tbody>
            {sortedFingerprints.map((fingerprint) => (
              <FingerprintTableRow
                key={fingerprint.hash}
                fingerprint={fingerprint}
                isModerator={isModerator}
                isSelected={selectedFingerprints.has(fingerprint.hash)}
                unmatching={unmatching}
                onSelect={toggleFingerprintSelection}
                onUnmatch={handleFingerprintUnmatch}
              />
            ))}
          </tbody>
        </Table>
      )}

      <MoveFingerprintsModal
        show={showMoveModal}
        selectedCount={selectedFingerprints.size}
        moving={moving}
        onHide={() => setShowMoveModal(false)}
        onMove={handleMove}
      />

      <DeleteFingerprintsModal
        show={showDeleteModal}
        selectedCount={selectedFingerprints.size}
        deleting={deleting}
        onHide={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
      />
    </div>
  );
};
