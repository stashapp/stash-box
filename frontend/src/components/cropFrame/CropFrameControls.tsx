import {
  faCompress,
  faDownload,
  faExpand,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faRotate,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import { type FC, useState } from "react";
import { Badge, Button, Modal } from "react-bootstrap";
import { Icon, Tooltip } from "src/components/fragments";
import type { CropGuide } from "src/graphql";

import CropFrame from "./CropFrame";
import {
  CROP_SIZE_WARNINGS,
  type CropRect,
  type CropSizeVerdict,
  cropPixels,
  refitRect,
  rotatedSize,
} from "./geometry";
import { MAX_ZOOM, MIN_ZOOM, stepZoom } from "./zoom";

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
  /** Current stage zoom; the cluster is omitted unless both are given. */
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  /**
   * Upper bound for the zoom-in button, from CropFrame's own measuring: past
   * it the crop frame would be larger than the viewport showing it. Defaults
   * to the absolute cap for callers that do not track it.
   */
  maxZoom?: number;
  /**
   * The host's judgement of the finished crop's size (see cropSizeVerdict);
   * anything but "ok" marks the size readout as a warning. Advisory only --
   * nothing here blocks the crop.
   */
  sizeVerdict?: CropSizeVerdict;
}

/**
 * The toolbar for a CropFrame stage: readout, rotate reset, zoom cluster and
 * template download. Straightening is done by dragging the image's edge; the
 * rotate button only resets, since that is not discoverable from the edge.
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
  zoom,
  onZoomChange,
  maxZoom = MAX_ZOOM,
  sizeVerdict,
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

  const sizeWarningText =
    sizeVerdict && sizeVerdict !== "ok"
      ? CROP_SIZE_WARNINGS[sizeVerdict]
      : undefined;

  const sizeReadout = (
    <small
      className={cx(`${CLASSNAME}-size`, {
        "text-muted": !sizeWarningText,
        "text-warning fw-bold": sizeVerdict === "marginal",
        "text-danger fw-bold": sizeVerdict === "too-small",
      })}
      // The icon's own title answers what the warning is; this one says
      // what the number is
      title="Size of the final image."
    >
      {sizeWarningText && (
        // On a wrapper: Icon's title reaches FontAwesomeIcon, which drops it
        <span className="me-1" title={sizeWarningText}>
          <Icon icon={faTriangleExclamation} />
        </span>
      )}
      {value.angle !== 0 && "≈ "}
      {output.width} × {output.height} px
    </small>
  );

  // Shared by the normal toolbar and the expanded canvas's, which differ
  // only in the expand/collapse icon
  const toolbar = (expandAction: {
    icon: typeof faExpand;
    label: string;
    onClick: () => void;
  }) => (
    <div className={`${CLASSNAME}-toolbar`}>
      <Tooltip text={expandAction.label}>
        <Button
          variant="link"
          className="minimal"
          aria-label={expandAction.label}
          onClick={expandAction.onClick}
        >
          <Icon icon={expandAction.icon} />
        </Button>
      </Tooltip>

      {framed && (
        <Tooltip text="Drag the image's edge to straighten it. Click to reset.">
          {/* Disabled buttons fire no hover events, so the span triggers */}
          <span className="d-inline-block">
            <Button
              variant="link"
              className="minimal"
              aria-label="Reset rotation"
              disabled={value.angle === 0}
              onClick={() => setAngle(0)}
            >
              <Icon icon={faRotate} />
            </Button>
          </span>
        </Tooltip>
      )}
      {templateDownloadHref && (
        // An anchor rather than Button as="a": that adds role="button", and
        // a download is a link
        <Tooltip text="Download template">
          <a
            className="btn btn-link minimal"
            href={templateDownloadHref}
            download
            aria-label="Download template"
          >
            <Icon icon={faDownload} />
          </a>
        </Tooltip>
      )}
      {framed && value.angle !== 0 && (
        <Badge bg="secondary" className={`${CLASSNAME}-angle-badge`}>
          {value.angle.toFixed(1)}°
        </Badge>
      )}

      {zoom !== undefined && onZoomChange && (
        <>
          {/* Spans as triggers throughout: disabled buttons fire no hover
              events, and every one of these can be disabled */}
          <Tooltip text="Zoom out">
            <span className="d-inline-block">
              <Button
                variant="link"
                className="minimal"
                aria-label="Zoom out"
                disabled={zoom <= MIN_ZOOM}
                onClick={() => onZoomChange(stepZoom(zoom, -1))}
              >
                <Icon icon={faMagnifyingGlassMinus} />
              </Button>
            </span>
          </Tooltip>
          {/* The readout doubles as the reset */}
          <Tooltip text="Reset zoom (Ctrl/Cmd + wheel zooms too)">
            <span className="d-inline-block">
              <Button
                variant="link"
                className={cx("minimal", `${CLASSNAME}-zoom`)}
                aria-label="Reset zoom"
                disabled={zoom === MIN_ZOOM}
                onClick={() => onZoomChange(MIN_ZOOM)}
              >
                {Math.round(zoom * 100)}%
              </Button>
            </span>
          </Tooltip>
          <Tooltip text="Zoom in">
            <span className="d-inline-block">
              <Button
                variant="link"
                className="minimal"
                aria-label="Zoom in"
                disabled={zoom >= maxZoom}
                onClick={() =>
                  onZoomChange(Math.min(maxZoom, stepZoom(zoom, 1)))
                }
              >
                <Icon icon={faMagnifyingGlassPlus} />
              </Button>
            </span>
          </Tooltip>
        </>
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
            <Tooltip text="Collapse canvas" placement="bottom-start">
              <Button
                className={cx(`${CLASSNAME}-expand-close`, "minimal")}
                variant="link"
                aria-label="Collapse canvas"
                onClick={() => setExpanded(false)}
              >
                <Icon icon={faXmark} />
              </Button>
            </Tooltip>
            <CropFrame
              src={src}
              naturalWidth={naturalWidth}
              naturalHeight={naturalHeight}
              aspectRatio={aspectRatio}
              guides={guides}
              value={value}
              onChange={onChange}
              fill
              zoom={zoom}
              onZoomChange={onZoomChange}
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
