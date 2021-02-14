import React, { useContext, useState } from "react";
import { useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import { loader } from "graphql.macro";

import {
  ChangePasswordMutation,
  ChangePasswordMutationVariables,
} from "src/definitions/ChangePasswordMutation";

import AuthContext from "src/AuthContext";
import { userHref } from "src/utils";
import UserPassword, { UserPasswordData } from "./UserPasswordForm";

const ChangePassword = loader("src/mutations/ChangePassword.gql");

const ChangePasswordComponent: React.FC = () => {
  const Auth = useContext(AuthContext);
  const [queryError, setQueryError] = useState();
  const history = useHistory();
  const [changePassword] = useMutation<
    ChangePasswordMutation,
    ChangePasswordMutationVariables
  >(ChangePassword);

  const doUpdate = (formData: UserPasswordData) => {
    const userData = {
      existing_password: formData.existingPassword,
      new_password: formData.newPassword,
    };
    changePassword({ variables: { userData } })
      .then(() => Auth.user && history.push(userHref(Auth.user)))
      .catch((res) => setQueryError(res.message));
  };

  return (
    <div className="col-6">
      <h2>Change Password</h2>
      <hr />
      <UserPassword error={queryError} callback={doUpdate} />
    </div>
  );
};

export default ChangePasswordComponent;
