import type { FC } from "react";
import SceneCard from "src/components/sceneCard";
import type { FingerprintMovedNotificationType } from "./types";

interface Props {
  notification: FingerprintMovedNotificationType;
}

export const FingerprintMovedNotification: FC<Props> = ({ notification }) => {
  return (
    <div className="d-flex flex-column gap-2">
      <div>
        <small className="text-muted">Moved from</small>
        <SceneCard scene={notification.data.source_scene} />
      </div>
      <div>
        <small className="text-muted">Moved to</small>
        <SceneCard scene={notification.data.target_scene} />
      </div>
    </div>
  );
};
