import type { FC } from "react";
import SceneCard from "src/components/sceneCard";
import type { SceneNotificationType } from "./types";

interface Props {
  notification: SceneNotificationType;
}

export const SceneNotification: FC<Props> = ({ notification }) => {
  return <SceneCard scene={notification.data.scene} />;
};
