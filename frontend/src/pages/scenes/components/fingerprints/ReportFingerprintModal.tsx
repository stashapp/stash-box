import { useMutation } from "@apollo/client/react";
import { type FC, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { type Fingerprint, ReportFingerprintDocument } from "src/graphql";
import { useToast } from "src/hooks";
import { extractIdFromUrl } from "src/utils";

interface Props {
  sceneId: string;
  fingerprint: Fingerprint;
  onHide: () => void;
}

export const ReportFingerprintModal: FC<Props> = ({
  sceneId,
  fingerprint,
  onHide,
}) => {
  const [correctScene, setCorrectScene] = useState("");
  const [comment, setComment] = useState("");
  const [submit, { loading, error }] = useMutation(ReportFingerprintDocument);
  const toast = useToast();
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await submit({
        variables: {
          input: {
            scene_id: sceneId,
            hash: fingerprint.hash,
            algorithm: fingerprint.algorithm,
            correct_scene_id: correctScene.trim()
              ? extractIdFromUrl(correctScene.trim())
              : null,
            comment: comment.trim() || null,
          },
        },
      });
      toast({
        variant: "success",
        content: "Fingerprint report added to the moderator queue.",
      });
      onHide();
    } catch {
      /* The mutation error is displayed in the form. */
    }
  };
  return (
    <Modal show onHide={onHide}>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Report fingerprint</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Report {fingerprint.algorithm} <code>{fingerprint.hash}</code> as
            incorrectly attached to this scene. This does not change its
            submissions.
          </p>
          {error && <Alert variant="danger">{error.message}</Alert>}
          <Form.Group className="mb-3" controlId="report-correct-scene">
            <Form.Label>Correct scene (optional)</Form.Label>
            <Form.Control
              value={correctScene}
              onChange={(e) => setCorrectScene(e.target.value)}
              placeholder="Scene URL or ID"
            />
          </Form.Group>
          <Form.Group controlId="report-comment">
            <Form.Label>Comment (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={10000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            Submit report
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
