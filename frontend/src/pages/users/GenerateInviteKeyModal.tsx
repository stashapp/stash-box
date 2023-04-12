import { FC, useState, useMemo } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { GenerateInviteCodeInput } from "src/graphql";
import { formatDateTime } from "src/utils";

interface ModalProps {
  callback: (input?: GenerateInviteCodeInput) => void;
}

const ms = 1000;
const minutesInSeconds = 60;
const hoursInSeconds = 60 * minutesInSeconds;
const daysInSeconds = 24 * hoursInSeconds;
const yearsInSeconds = 365 * daysInSeconds;

export const GenerateInviteKeyModal: FC<ModalProps> = ({ callback }) => {
  const [keyAmount, setKeyAmount] = useState(1);
  const [keyUses, setKeyUses] = useState(1);
  const [keyExpireAmount, setKeyExpireAmount] = useState(30);
  const [keyExpireUnit, setKeyExpireUnit] = useState(daysInSeconds);

  const handleCancel = () => callback();
  const handleAccept = () =>
    callback({
      keys: keyAmount,
      uses: keyUses,
      ttl: keyExpireAmount * keyExpireUnit,
    });

  const expireTime = useMemo(() => {
    const ret = new Date();
    ret.setTime(ret.getTime() + keyExpireAmount * keyExpireUnit * ms);
    return ret;
  }, [keyExpireAmount, keyExpireUnit]);

  return (
    <Modal show onHide={handleCancel}>
      <Modal.Header closeButton>
        <b>Generate Invite Keys</b>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="key-amount">
            <Form.Label>Amount of Keys</Form.Label>
            <Form.Control
              value={keyAmount}
              onChange={(e) => setKeyAmount(parseInt(e.currentTarget.value))}
              type="number"
              min={1}
              max={100}
              placeholder="Enter number of keys"
            />
          </Form.Group>
          <Form.Group controlId="key-uses">
            <Form.Label>Uses per key</Form.Label>
            <Form.Control
              value={keyUses}
              onChange={(e) => setKeyUses(parseInt(e.currentTarget.value))}
              type="number"
              min={0}
              max={100}
              placeholder="Uses per key"
            />
            <Form.Text className="text-muted">
              Enter 0 for unlimited uses.
            </Form.Text>
          </Form.Group>
          <Form.Group controlId="key-uses">
            <Form.Label>Expire time</Form.Label>
            <Form.Control
              type="number"
              min={1}
              value={keyExpireAmount}
              onChange={(e) =>
                setKeyExpireAmount(parseInt(e.currentTarget.value))
              }
            />
            <Form.Select
              value={keyExpireUnit}
              onChange={(e) => {
                setKeyExpireUnit(parseInt(e.currentTarget.value));
              }}
            >
              <option value={minutesInSeconds}>Minutes</option>
              <option value={hoursInSeconds}>Hours</option>
              <option value={daysInSeconds}>Days</option>
              <option value={yearsInSeconds}>Years</option>
            </Form.Select>
            <Form.Text className="text-muted">
              Expires at {formatDateTime(expireTime)}
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="success" onClick={handleAccept}>
          Generate
        </Button>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
