import { FC } from "react";
import UserSceneList from "./UserScenes/UserSceneList";

const UserScenesComponent: FC = () => {
  const filter = {
    has_fingerprint_submissions: true,
  };

  return (
    <>
      <h3>My scenes</h3>
      <UserSceneList filter={filter} />
    </>
  );
};

export default UserScenesComponent;
