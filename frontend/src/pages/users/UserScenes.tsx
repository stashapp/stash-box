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
import UserSceneList from "./UserScenes/UserSceneList";

type User = NonNullable<UserQuery["findUser"]>;

type PublicUser = NonNullable<PublicUserQuery["findUser"]>;

const UserScenesComponent: FC = () => {
    const filter = {
          has_fingerprint_submissions:true,
        }
  
    
    return (
      <>
        <h3>
          My scenes
        </h3>
        <UserSceneList filter={filter}/>
      </>
    );
  
  }
  
  export default UserScenesComponent;