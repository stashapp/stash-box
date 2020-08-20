import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import { loader } from "graphql.macro";

import {
  AddUserMutation,
  AddUserMutationVariables,
} from "src/definitions/AddUserMutation";

import UserForm, { UserData } from "./UserForm";

const AddUser = loader("src/mutations/AddUser.gql");

const AddUserComponent: React.FC = () => {
  const [queryError, setQueryError] = useState();
  const history = useHistory();
  const [insertUser] = useMutation<AddUserMutation, AddUserMutationVariables>(
    AddUser,
    {
      onCompleted: () => {
        history.push("/admin/");
      },
    }
  );

  const doInsert = (formData: UserData) => {
    const { id, ...userData } = formData;
    insertUser({ variables: { userData } })
      .then(() => history.push("/admin"))
      .catch((res) => setQueryError(res.message));
  };

  const emptyUser = {
    id: "",
    name: "",
    email: "",
    password: "",
    roles: [],
  } as UserData;

  return (
    <div>
      <h2>Add new performer</h2>
      <hr />
      <UserForm user={emptyUser} error={queryError} callback={doInsert} />
    </div>
  );
};

export default AddUserComponent;
