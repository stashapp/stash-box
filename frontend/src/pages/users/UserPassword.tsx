import { FC, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isApolloError } from "@apollo/client";

import { useChangePassword } from "src/graphql";
import AuthContext from "src/AuthContext";
import { userHref } from "src/utils";
import UserPassword, { UserPasswordData } from "./UserPasswordForm";

const ChangePasswordComponent: FC = () => {
  const Auth = useContext(AuthContext);
  const [queryError, setQueryError] = useState<string>();
  const navigate = useNavigate();
  const [changePassword] = useChangePassword();

  const doUpdate = (formData: UserPasswordData) => {
    const userData = {
      existing_password: formData.existingPassword,
      new_password: formData.newPassword,
    };
    changePassword({ variables: { userData } })
      .then(() => Auth.user && navigate(userHref(Auth.user)))
      .catch(
        (error: unknown) =>
          error instanceof Error &&
          isApolloError(error) &&
          setQueryError(error.message),
      );
  };

  return (
    <div className="col-6">
      <h3>Change Password</h3>
      <hr />
      <UserPassword error={queryError} callback={doUpdate} />
    </div>
  );
};

export default ChangePasswordComponent;
