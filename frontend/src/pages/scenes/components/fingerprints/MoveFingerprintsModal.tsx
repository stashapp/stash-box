import { type FC, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { faArrowRight, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLazyQuery } from "@apollo/client/react";
import { SceneDocument, type SceneQuery } from "src/graphql";
import { useToast } from "src/hooks";
import { Icon } from "src/components/fragments";

interface Props {
  show: boolean;
  selectedCount: number;
  moving: boolean;
  onHide: () => void;
  onMove: (targetSceneId: string) => Promise<boolean | undefined>;
}

export const MoveFingerprintsModal: FC<Props> = ({
  show,
  selectedCount,
  moving,
  onHide,
  onMove,
}) => {
  const addToast = useToast();
  const [targetSceneId, setTargetSceneId] = useState("");
  const [targetScene, setTargetScene] = useState<
    SceneQuery["findScene"] | null
  >(null);

  const [fetchScene, { loading: loadingScene }] = useLazyQuery(SceneDocument, {
    onCompleted: (data) => {
      setTargetScene(data.findScene);
    },
    onError: () => {
      setTargetScene(null);
      addToast({
        variant: "danger",
        content: "Scene not found",
      });
    },
  });

  const handleTargetSceneIdChange = (id: string) => {
    setTargetSceneId(id);
    setTargetScene(null);

    if (id.trim()) {
      fetchScene({ variables: { id } });
    }
  };

  const handleMove = async () => {
    if (!targetSceneId || selectedCount === 0) {
      addToast({
        variant: "danger",
        content: "Please select fingerprints and enter a target scene ID",
      });
      return;
    }

    const success = await onMove(targetSceneId);
    if (success) {
      setTargetSceneId("");
      setTargetScene(null);
    }
  };

  const handleClose = () => {
    setTargetSceneId("");
    setTargetScene(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Move Fingerprint Submissions</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Move {selectedCount} fingerprint submission(s) to another scene.</p>
        <Form.Group className="mb-3">
          <Form.Label>Target Scene ID</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter scene ID"
            value={targetSceneId}
            onChange={(e) => handleTargetSceneIdChange(e.target.value)}
          />
        </Form.Group>
        {loadingScene && (
          <div className="text-center my-3">
            <Icon icon={faSpinner} className="fa-spin" /> Loading scene...
          </div>
        )}
        {targetScene && (
          <div className="d-flex align-items-center p-3 border rounded">
            {targetScene.images.length > 0 && (
              <img
                src={targetScene.images[0].url}
                alt={targetScene.title || "Scene"}
                style={{ width: "120px", height: "80px", objectFit: "cover" }}
                className="me-3"
              />
            )}
            <div>
              <h6 className="mb-1">{targetScene.title || "Untitled"}</h6>
              <small className="text-muted">
                {targetScene.studio?.name && `${targetScene.studio.name} • `}
                {targetScene.release_date}
              </small>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleMove}
          disabled={moving || !targetScene}
        >
          {moving ? (
            <>
              <Icon icon={faSpinner} className="fa-spin me-1" />
              Moving...
            </>
          ) : (
            <>
              <Icon icon={faArrowRight} className="me-1" />
              Move
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
