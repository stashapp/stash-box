import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useHistory, useParams } from "react-router-dom";
import { loader } from "graphql.macro";

import {
  UpdateUserMutation,
  UpdateUserMutationVariables,
} from "src/definitions/UpdateUserMutation";
import { User, UserVariables } from "src/definitions/User";

import { LoadingIndicator } from "src/components/fragments";
import { userHref } from "src/utils";
import UserEditForm, { UserEditData } from "./UserEditForm";

const UpdateUser = loader("src/mutations/UpdateUser.gql");
const UserQuery = loader("src/queries/User.gql");

const EditUserComponent: React.FC = () => {
  const { name = "" } = useParams();
  const { data, loading } = useQuery<User, UserVariables>(UserQuery, {
    variables: { name },
  });
  const [queryError, setQueryError] = useState();
  const history = useHistory();
  const [updateUser] = useMutation<
    UpdateUserMutation,
    UpdateUserMutationVariables
  >(UpdateUser);

  if (loading) return <LoadingIndicator />;
  if (name === "" || !data?.findUser) return <div>User not found!</div>;

  const user = data.findUser;

  const doUpdate = (userData: UserEditData) => {
    updateUser({ variables: { userData } })
      .then(() => history.push(userHref(user)))
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
