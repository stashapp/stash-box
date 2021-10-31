import React, { useState } from "react";
import { useHistory } from "react-router-dom";

import { useUpdateUser } from "src/graphql";
import { User_findUser as User } from "src/graphql/definitions/User";
import { userHref } from "src/utils";
import UserEditForm, { UserEditData } from "./UserEditForm";

interface Props {
  user: User;
}

const EditUserComponent: React.FC<Props> = ({ user }) => {
  const [queryError, setQueryError] = useState();
  const history = useHistory();
  const [updateUser] = useUpdateUser();

  const doUpdate = (userData: UserEditData) => {
    updateUser({ variables: { userData } })
      .then((res) => history.push(userHref(res.data?.userUpdate ?? user)))
      .catch((res) => setQueryError(res.message));
  };

  return (
    <div>
      <h3>Edit &lsquo;{user.name}&rsquo;</h3>
      <hr />
      <UserEditForm
        user={user}
        username={user.name}
        error={queryError}
        callback={doUpdate}
      />
    </div>
  );
};

export default EditUserComponent;
