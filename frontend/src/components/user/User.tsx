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
import {
  RescindInviteCodeMutation,
  RescindInviteCodeMutationVariables,
} from "src/definitions/RescindInviteCodeMutation";
import { GenerateInviteCodeMutation } from "src/definitions/GenerateInviteCodeMutation";
import { canEdit, isAdmin } from "src/utils/auth";

import Modal from "src/components/modal";
import { Icon, LoadingIndicator } from "src/components/fragments";
import {
  GrantInviteMutation,
  GrantInviteMutationVariables,
} from "src/definitions/GrantInviteMutation";
import {
  RevokeInviteMutation,
  RevokeInviteMutationVariables,
} from "src/definitions/RevokeInviteMutation";

const UserQuery = loader("src/queries/User.gql");
const DeleteUser = loader("src/mutations/DeleteUser.gql");
const RescindInviteCode = loader("src/mutations/RescindInviteCode.gql");
const GenerateInviteCode = loader("src/mutations/GenerateInviteCode.gql");
const GrantInvite = loader("src/mutations/GrantInvite.gql");
const RevokeInvite = loader("src/mutations/RevokeInvite.gql");

const AddUserComponent: React.FC = () => {
  const history = useHistory();
  const Auth = useContext(AuthContext);
  const { username = "" } = useParams();
  const [showDelete, setShowDelete] = useState(false);
  const [showRescindCode, setShowRescindCode] = useState<string | undefined>();
  const [deleteUser, { loading: deleting }] = useMutation<
    DeleteUserMutation,
    DeleteUserMutationVariables
  >(DeleteUser);
  const [rescindInviteCode] = useMutation<
    RescindInviteCodeMutation,
    RescindInviteCodeMutationVariables
  >(RescindInviteCode);
  const [generateInviteCode] = useMutation<GenerateInviteCodeMutation>(
    GenerateInviteCode
  );
  const [grantInvite] = useMutation<
    GrantInviteMutation,
    GrantInviteMutationVariables
  >(GrantInvite);
  const [revokeInvite] = useMutation<
    RevokeInviteMutation,
    RevokeInviteMutationVariables
  >(RevokeInvite);

  const { data, loading, refetch } = useQuery<User, UserVariables>(UserQuery, {
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

  const handleRescindCode = (status: boolean): void => {
    if (status) {
      rescindInviteCode({ variables: { code: showRescindCode ?? "" } }).then(
        () => {
          refetch();
        }
      );
    }

    setShowRescindCode(undefined);
  };
  const rescindCodeModal = showRescindCode && (
    <Modal
      message={`Are you sure you want to rescind code '${showRescindCode}'? This operation cannot be undone.`}
      callback={handleRescindCode}
    />
  );

  const handleGenerateCode = () => {
    generateInviteCode().then(() => {
      refetch();
    });
  };

  const handleGrantInvite = () => {
    grantInvite({
      variables: {
        input: {
          amount: 1,
          user_id: user.id,
        },
      },
    }).then(() => {
      refetch();
    });
  };

  const handleRevokeInvite = () => {
    revokeInvite({
      variables: {
        input: {
          amount: 1,
          user_id: user.id,
        },
      },
    }).then(() => {
      refetch();
    });
  };

  return (
    <>
      {deleteModal}
      {rescindCodeModal}
      {isAdmin(Auth.user) && (
        <Button
          className="float-right"
          variant="danger"
          disabled={showDelete || deleting}
          onClick={toggleModal}
        >
          Delete User
        </Button>
      )}
      {canEdit(Auth.user) && (
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
      <div className="row">
        <span className="col-2">Invite Tokens</span>
        <div className="col">
          {isAdmin(Auth.user) && (
            <Button variant="link" onClick={() => handleRevokeInvite()}>
              <Icon icon="minus" />
            </Button>
          )}
          <span>{user?.invite_tokens}</span>
          {isAdmin(Auth.user) && (
            <Button variant="link" onClick={() => handleGrantInvite()}>
              <Icon icon="plus" />
            </Button>
          )}
        </div>
      </div>
      <div className="row">
        <span className="col-2">Invite Keys</span>
        <div className="col">
          {user.active_invite_codes?.map((c) => (
            <div>
              <code>{c}</code>
              <Button variant="link" onClick={() => setShowRescindCode(c)}>
                <Icon icon="trash" />
              </Button>
            </div>
          ))}
          <div>
            {isUser() && (
              <Button variant="link" onClick={() => handleGenerateCode()}>
                <Icon icon="plus" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddUserComponent;
