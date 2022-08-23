import { FC, useContext } from "react";
import { Link } from "react-router-dom";
import { ROUTE_USER_MY_SCENES } from "src/constants/route";

import { User_findUser as User } from "src/graphql/definitions/User";
import { ROUTE_USER } from "src/constants/route";
import { createHref } from "src/utils";
import UserSceneList from "./UserScenes/UserSceneList";
import AuthContext from "src/AuthContext";
import { Button } from "react-bootstrap";
import { CriterionModifier, useMyFingerprints } from "src/graphql";
import { ErrorMessage } from "src/components/fragments";

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

  const { loading, data :userFingerprints} = useMyFingerprints()

  if (!loading && !userFingerprints) return <ErrorMessage error="Failed to load scenes." />;
  
  console.log(userFingerprints)

  const filter = {
        fingerprints: {
          modifier: CriterionModifier.INCLUDES,
          value: userFingerprints?.myFingerprints.fingerprints.map(fing => fing.hash) ?? [''],
        },
      }

  
  return (
    <>
      <h3>
        My scenes
      </h3>
      <UserSceneList filter={filter} userFingerprints={userFingerprints?.myFingerprints.fingerprints}/>
    </>
  );

}

export default UserScenesComponent;
