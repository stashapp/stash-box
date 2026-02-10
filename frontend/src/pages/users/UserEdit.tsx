import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CombinedGraphQLErrors } from "@apollo/client";

import {
  useUpdateUser,
  type PublicUserQuery,
  type UserQuery,
} from "src/graphql";
import { userHref, isPrivateUser } from "src/utils";
import UserEditForm, { type UserEditData } from "./UserEditForm";
import { ErrorMessage } from "src/components/fragments";

type User =
  | NonNullable<UserQuery["findUser"]>
  | NonNullable<PublicUserQuery["findUser"]>;

interface Props {
  user: User;
}

const EditUserComponent: FC<Props> = ({ user }) => {
  const [queryError, setQueryError] = useState<string>();
  const navigate = useNavigate();
  const [updateUser] = useUpdateUser();

  if (!isPrivateUser(user)) return <ErrorMessage error="Access Denied" />;

  const doUpdate = (userData: UserEditData) => {
    updateUser({ variables: { userData } })
      .then((res) => navigate(userHref(res.data?.userUpdate ?? user)))
      .catch(
        (error: unknown) =>
          CombinedGraphQLErrors.is(error) && setQueryError(error.message),
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
