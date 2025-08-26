import type { FC, ReactElement } from "react";
import {
  OverlayTrigger,
  Tooltip as BSTooltip,
  type PopoverProps,
} from "react-bootstrap";

interface Props {
  text: string | ReactElement;
  placement?: PopoverProps["placement"];
  children: ReactElement;
  delay?: number;
}

const Tooltip: FC<Props> = ({
  children,
  text,
  delay = 200,
  placement = "bottom-end",
}) => (
  <OverlayTrigger
    delay={{ show: delay, hide: 0 }}
    overlay={
      <BSTooltip className="Tooltip" id="tooltip">
        {text}
      </BSTooltip>
    }
    show={text ? undefined : false}
    placement={placement}
    trigger={["hover", "focus"]}
  >
    {children}
  </OverlayTrigger>
);

export default Tooltip;
