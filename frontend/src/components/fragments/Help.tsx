import type { FC } from "react";
import { Button, OverlayTrigger, Popover } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

interface Props {
  message: string;
}

const Help: FC<Props> = ({ message }) => {
  const renderContent = () => (
    <Popover id="help">
      <Popover.Body>{message}</Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      overlay={renderContent()}
      placement="bottom"
      trigger="hover"
    >
      <Button variant="link" className="minimal">
        <Icon icon={faQuestionCircle} />
      </Button>
    </OverlayTrigger>
  );
};

export default Help;
