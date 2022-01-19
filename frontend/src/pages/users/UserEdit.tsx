import { FC, useState } from "react";
import { useHistory } from "react-router-dom";
import { isApolloError } from "@apollo/client";

import { useUpdateUser } from "src/graphql";
import { User_findUser as User } from "src/graphql/definitions/User";
import { PublicUser_findUser as PublicUser } from "src/graphql/definitions/PublicUser";
import { userHref, isPrivateUser } from "src/utils";
import UserEditForm, { UserEditData } from "./UserEditForm";
import { ErrorMessage } from "src/components/fragments";

interface Props {
  user: User | PublicUser;
}

const EditUserComponent: FC<Props> = ({ user }) => {
  const [queryError, setQueryError] = useState<string>();
  const history = useHistory();
  const [updateUser] = useUpdateUser();

  if (!isPrivateUser(user)) return <ErrorMessage error="Access Denied" />;

  const doUpdate = (userData: UserEditData) => {
    updateUser({ variables: { userData } })
      .then((res) => history.push(userHref(res.data?.userUpdate ?? user)))
      .catch(
        (error: unknown) =>
          error instanceof Error &&
          isApolloError(error) &&
          setQueryError(error.message)
      );
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
