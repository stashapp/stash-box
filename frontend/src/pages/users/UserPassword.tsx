import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";

import { useChangePassword } from "src/graphql";
import AuthContext from "src/AuthContext";
import { userHref } from "src/utils";
import UserPassword, { UserPasswordData } from "./UserPasswordForm";

const ChangePasswordComponent: React.FC = () => {
  const Auth = useContext(AuthContext);
  const [queryError, setQueryError] = useState();
  const history = useHistory();
  const [changePassword] = useChangePassword();

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
      <h3>Change Password</h3>
      <hr />
      <UserPassword error={queryError} callback={doUpdate} />
    </div>
  );
};

export default ChangePasswordComponent;
