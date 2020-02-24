import React, { useContext, useState } from 'react';
import { useMutation } from '@apollo/react-hooks';
import { useHistory } from 'react-router-dom';

import { ChangePasswordMutation, ChangePasswordMutationVariables } from 'src/definitions/ChangePasswordMutation';
import ChangePassword from 'src/mutations/ChangePassword.gql';

import AuthContext from 'src/AuthContext';
import UserPassword, { UserPasswordData } from './UserPasswordForm';

const ChangePasswordComponent: React.FC = () => {
    const Auth = useContext(AuthContext);
    const [queryError, setQueryError] = useState();
    const history = useHistory();
    const [changePassword] = useMutation<ChangePasswordMutation, ChangePasswordMutationVariables>(ChangePassword);

    const doUpdate = (formData: UserPasswordData) => {
        const userData = {
            existing_password: formData.existingPassword,
            new_password: formData.newPassword
        };
        changePassword({ variables: { userData } })
            .then(() => (
                history.push(`/users/${Auth.user?.name ?? ''}`)
            ))
            .catch((res) => (
                setQueryError(res.message)
            ));
    };

    return (
        <div>
            <h2>Change Password</h2>
            <hr />
            <UserPassword error={queryError} callback={doUpdate} />
        </div>
    );
};

export default ChangePasswordComponent;
