import React from "react";
import {
  OverlayTrigger,
  Tooltip as BSTooltip,
  PopoverProps,
} from "react-bootstrap";

interface Props {
  text: string | React.ReactElement;
  placement?: PopoverProps["placement"];
  children: React.ReactElement;
  delay?: number;
}

const Tooltip: React.FC<Props> = ({
  children,
  text,
  delay = 200,
  placement = "bottom-end",
}) => (
  <OverlayTrigger
    delay={{ show: delay, hide: 0 }}
    overlay={<BSTooltip id="tooltip">{text}</BSTooltip>}
    placement={placement}
    trigger="hover"
  >
    {children}
  </OverlayTrigger>
);

export default Tooltip;
