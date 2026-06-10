import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Icon } from "src/components/fragments";
import SceneCard from "src/components/sceneCard";
import type { FingerprintMovedNotificationType } from "./types";

interface Props {
  notification: FingerprintMovedNotificationType;
}

export const FingerprintMovedNotification: FC<Props> = ({ notification }) => {
  return (
    <div className="d-flex flex-wrap align-items-center gap-3">
      <div className="d-flex flex-column">
        <small className="text-muted">Moved from</small>
        <SceneCard scene={notification.data.source_scene} />
      </div>
      <Icon icon={faArrowRight} className="text-muted fs-4" />
      <div className="d-flex flex-column">
        <small className="text-muted">Moved to</small>
        <SceneCard scene={notification.data.target_scene} />
      </div>
    </div>
  );
};
