import React, { useState, useContext } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useParams, useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { loader } from "graphql.macro";

import { User, UserVariables } from "src/definitions/User";

import AuthContext from "src/AuthContext";
import {
  DeleteUserMutation,
  DeleteUserMutationVariables,
} from "src/definitions/DeleteUserMutation";
import { canEdit, isAdmin } from "src/utils/auth";

import Modal from "src/components/modal";
import { LoadingIndicator } from "src/components/fragments";

const UserQuery = loader("src/queries/User.gql");
const DeleteUser = loader("src/mutations/DeleteUser.gql");

const AddUserComponent: React.FC = () => {
  const history = useHistory();
  const Auth = useContext(AuthContext);
  const { username = "" } = useParams();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteUser, { loading: deleting }] = useMutation<
    DeleteUserMutation,
    DeleteUserMutationVariables
  >(DeleteUser);
  const { data, loading } = useQuery<User, UserVariables>(UserQuery, {
    variables: { name: username },
    skip: username === "",
  });

  if (loading) return <LoadingIndicator />;
  if (username === "" || !data?.findUser) return <div>No user found!</div>;

  const user = data.findUser;

  const isUser = () => Auth.user?.name === username;

  const toggleModal = () => setShowDelete(true);
  const handleDelete = (status: boolean): void => {
    if (status)
      deleteUser({ variables: { input: { id: user.id } } }).then(() =>
        history.push("/admin")
      );
    setShowDelete(false);
  };
  const deleteModal = showDelete && (
    <Modal
      message={`Are you sure you want to delete '${user.name}'? This operation cannot be undone.`}
      callback={handleDelete}
    />
  );

  return (
    <>
      {deleteModal}
      {isAdmin() && (
        <Button
          className="float-right"
          variant="danger"
          disabled={showDelete || deleting}
          onClick={toggleModal}
        >
          Delete User
        </Button>
      )}
      {canEdit() && (
        <LinkContainer to={`/users/${user.name}/edit`}>
          <Button className="float-right">Edit User</Button>
        </LinkContainer>
      )}
      {isUser() && (
        <LinkContainer to="/users/change-password">
          <Button className="float-right">Change Password</Button>
        </LinkContainer>
      )}
      <h2>{username}</h2>
      <hr />
      <div className="row">
        <span className="col-2">Email</span>
        <span className="col">{user?.email}</span>
      </div>
      <div className="row">
        <span className="col-2">Roles</span>
        <span className="col">{(user?.roles ?? []).join(", ")}</span>
      </div>
      <div className="row">
        <span className="col-2">API key</span>
        <textarea disabled className="col">
          {user.api_key}
        </textarea>
      </div>
    </>
  );
};

export default AddUserComponent;
