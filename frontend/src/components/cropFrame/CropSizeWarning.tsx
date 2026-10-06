import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import type { FC } from "react";
import { Icon } from "src/components/fragments";

import { CROP_SIZE_WARNINGS, type CropSizeVerdict } from "./geometry";

interface Props {
  verdict?: CropSizeVerdict;
}

// The maybe/definitely split carries in the words as well as the colour, so it
// survives for anyone who cannot tell amber from red
const LABELS: Record<Exclude<CropSizeVerdict, "ok">, string> = {
  marginal: "Small",
  "too-small": "Too small",
};

const CropSizeWarning: FC<Props> = ({ verdict }) =>
  verdict && verdict !== "ok" ? (
    <div
      className={cx(
        "text-center",
        verdict === "too-small" ? "text-danger" : "text-warning",
      )}
      title={CROP_SIZE_WARNINGS[verdict]}
    >
      <Icon icon={faTriangleExclamation} /> {LABELS[verdict]}
    </div>
  ) : null;

export default CropSizeWarning;
