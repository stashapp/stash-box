import { FC, useContext } from "react";
import { Link } from "react-router-dom";
import { ROUTE_USER_MY_SCENES } from "src/constants/route";

import { User_findUser as User } from "src/graphql/definitions/User";
import { ROUTE_USER } from "src/constants/route";
import { createHref } from "src/utils";
import { SceneList } from "src/components/list";
import AuthContext from "src/AuthContext";
import { Button } from "react-bootstrap";
import { CriterionModifier } from "src/graphql";

interface Props {
  user: Pick<User, "id" | "name">;
}

/*
  Dev notes

  Fingerprints for self can be removed by calling SubmitFingerprint with FingerprintSubmission.Unmatch = true

*/

const UserScenesComponent: FC<Props> = ({ user }) =>{
  const Auth = useContext(AuthContext);
  const currentUserId = Auth.user?.id;

  // Can only see this page for your own user
  if (user.id != currentUserId){
    return (
      <>
      <h3>My scenes</h3>
      To see your scenes go to <Link to={createHref(ROUTE_USER_MY_SCENES, user)} className="ms-2"><Button variant="secondary">My Scenes</Button></Link>
      </>
    )
  }

  // Find a way to filter on scenes the user has a fingerprint in
  /* const filter = {
    fingerprints: {
      modifier: CriterionModifier.INCLUDES,
      value: [currentUserId],
    },
  }*/
  const filter = undefined;

  
  return (
    <>
      <h3>
        My scenes
      </h3>
      <SceneList filter={filter} />
    </>
  );

}

export default UserScenesComponent;
