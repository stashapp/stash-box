import {
  faCompress,
  faDownload,
  faExpand,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import { type FC, useState } from "react";
import { Modal } from "react-bootstrap";
import { Icon, Tooltip } from "src/components/fragments";
import type { CropGuide } from "src/graphql";

import CropFrame from "./CropFrame";
import {
  type CropRect,
  cropPixels,
  isRoundSize,
  refitRect,
  rotatedSize,
} from "./geometry";

const CLASSNAME = "CropFrame";

interface CropFrameControlsProps {
  /** Object URL of the image being cropped -- only needed to expand the canvas. */
  src: string;
  value: CropRect;
  onChange: (rect: CropRect) => void;
  aspectRatio?: number;
  naturalWidth: number;
  naturalHeight: number;
  guides?: CropGuide[];
  /**
   * The chosen template's own file, offered as a download so someone
   * cropping in their own editor works to the identical frame. Omitted
   * when no template is chosen.
   */
  templateDownloadHref?: string;
}

/**
 * The toolbar that normally sits under CropFrame's own stage, split out so a
 * host can place it somewhere else entirely -- see CropStep's side-by-side
 * layout. Not exercised by CropFrame itself: pass `hideControls` there and
 * render this wherever it belongs instead.
 *
 * Straightening is done by dragging the image's own edge, not a control in
 * this toolbar -- the rotate button here is just a reset, since that isn't
 * discoverable from the edge alone.
 */
const CropFrameControls: FC<CropFrameControlsProps> = ({
  src,
  value,
  onChange,
  aspectRatio,
  naturalWidth,
  naturalHeight,
  guides = [],
  templateDownloadHref,
}) => {
  const [expanded, setExpanded] = useState(false);
  const framed = aspectRatio !== undefined;
  const output = cropPixels(value, naturalWidth, naturalHeight);

  const setAngle = (angle: number) => {
    const turned = rotatedSize(naturalWidth, naturalHeight, angle);
    onChange(
      refitRect({ ...value, angle }, aspectRatio, turned.width / turned.height),
    );
  };

  const sizeReadout = (
    <span
      className={cx(`${CLASSNAME}-size`, {
        [`${CLASSNAME}-size-round`]: isRoundSize(output.width, output.height),
      })}
      title={
        framed
          ? [
              "Size of the finished image.",
              guides.length > 0 && "Hold Shift to resize around the guides, or",
              "Hold Ctrl/Cmd to size freely.",
            ]
              .filter(Boolean)
              .join(" ")
          : "Size of the finished image"
      }
    >
      {value.angle !== 0 && "≈ "}
      {output.width} × {output.height} px
    </span>
  );

  // Shared between the normal toolbar and the one shown inside the expanded
  // canvas, which differ only in which icon sits in the expand/collapse spot
  // -- everything else, including the rotate button and the size readout,
  // is the same control acting on the same value either way.
  const toolbar = (expandAction: {
    icon: typeof faExpand;
    label: string;
    onClick: () => void;
  }) => (
    <div className={`${CLASSNAME}-toolbar`}>
      <button
        type="button"
        className={`${CLASSNAME}-toolbar-btn`}
        title={expandAction.label}
        aria-label={expandAction.label}
        onClick={expandAction.onClick}
      >
        <Icon icon={expandAction.icon} />
      </button>

      {framed && (
        <Tooltip text="Drag the image's edge to straighten it. Click to reset.">
          {/* Disabled buttons don't fire the hover events OverlayTrigger
              needs, so the span (never disabled) is the actual trigger. */}
          <span className="d-inline-block">
            <button
              type="button"
              className={`${CLASSNAME}-toolbar-btn`}
              aria-label="Reset rotation"
              disabled={value.angle === 0}
              onClick={() => setAngle(0)}
            >
              <Icon icon={faRotate} />
            </button>
          </span>
        </Tooltip>
      )}
      {templateDownloadHref && (
        <a
          className={`${CLASSNAME}-toolbar-btn`}
          href={templateDownloadHref}
          download
          rel="noreferrer"
          title="Download template"
          aria-label="Download template"
        >
          <Icon icon={faDownload} />
        </a>
      )}
      {framed && value.angle !== 0 && (
        <span className={`${CLASSNAME}-angle-badge`}>
          {value.angle.toFixed(1)}°
        </span>
      )}

      {sizeReadout}
    </div>
  );

  return (
    <>
      {toolbar({
        icon: faExpand,
        label: "Expand canvas",
        onClick: () => setExpanded(true),
      })}

      {expanded && (
        <Modal
          show
          fullscreen
          onHide={() => setExpanded(false)}
          dialogClassName={`${CLASSNAME}-expand-modal`}
        >
          <Modal.Body>
            <CropFrame
              src={src}
              naturalWidth={naturalWidth}
              naturalHeight={naturalHeight}
              aspectRatio={aspectRatio}
              guides={guides}
              value={value}
              onChange={onChange}
              fill
              hideControls
            />
            {toolbar({
              icon: faCompress,
              label: "Collapse canvas",
              onClick: () => setExpanded(false),
            })}
          </Modal.Body>
        </Modal>
      )}
    </>
  );
};

export default CropFrameControls;
