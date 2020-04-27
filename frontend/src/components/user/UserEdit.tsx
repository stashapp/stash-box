import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { useHistory, useParams } from "react-router-dom";

import {
  UpdateUserMutation,
  UpdateUserMutationVariables,
} from "src/definitions/UpdateUserMutation";
import { User, UserVariables } from "src/definitions/User";
import UpdateUser from "src/mutations/UpdateUser.gql";
import UserQuery from "src/queries/User.gql";

import { LoadingIndicator } from "src/components/fragments";
import UserEditForm, { UserEditData } from "./UserEditForm";

const EditUserComponent: React.FC = () => {
  const { username } = useParams();
  const { data, loading } = useQuery<User, UserVariables>(UserQuery, {
    variables: { name: username },
  });
  const [queryError, setQueryError] = useState();
  const history = useHistory();
  const [updateUser] = useMutation<
    UpdateUserMutation,
    UpdateUserMutationVariables
  >(UpdateUser);

  if (loading) return <LoadingIndicator />;

  const user = data.findUser;

  const doUpdate = (userData: UserEditData) => {
    updateUser({ variables: { userData } })
      .then(() => history.push(`/users/${user.name}`))
      .catch((res) => setQueryError(res.message));
  };

  const userData = {
    id: user.id,
    email: user.email,
    roles: user.roles,
  } as UserEditData;

  return (
    <div>
      <h2>Edit &lsquo;{user.name}&rsquo;</h2>
      <hr />
      <UserEditForm
        user={userData}
        username={user.name}
        error={queryError}
        callback={doUpdate}
      />
    </div>
  );
};

export default EditUserComponent;
