import { FC, useContext } from "react";
import { Link } from "react-router-dom";
import { ROUTE_USER_MY_SCENES } from "src/constants/route";

import { ROUTE_USER } from "src/constants/route";
import { createHref, isPrivateUser } from "src/utils";
import { SceneList } from "src/components/list";
import {
    UserQuery,
    PublicUserQuery,
  } from "src/graphql";
  import AuthContext from "src/AuthContext";
import { Button } from "react-bootstrap";
import { CriterionModifier } from "src/graphql";

type User = NonNullable<UserQuery["findUser"]>;

type PublicUser = NonNullable<PublicUserQuery["findUser"]>;

interface Props {
    user: User | PublicUser;
  }
  
const UserScenesComponent: FC<Props> = ({ user }) => {
    const showPrivate = isPrivateUser(user);

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