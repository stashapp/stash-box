import React, { useState, useContext } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";

import {
  useUser,
  useDeleteUser,
  useRescindInviteCode,
  useGenerateInviteCode,
  useGrantInvite,
  useRevokeInvite,
} from "src/graphql";
import AuthContext from "src/AuthContext";
import {
  ROUTE_USER_EDIT,
  ROUTE_USER_PASSWORD,
  ROUTE_USERS,
} from "src/constants/route";
import { canEdit, isAdmin, createHref } from "src/utils";
import Modal from "src/components/modal";
import { Icon, LoadingIndicator } from "src/components/fragments";

const AddUserComponent: React.FC = () => {
  const history = useHistory();
  const Auth = useContext(AuthContext);
  const { name = "" } = useParams();
  const [showDelete, setShowDelete] = useState(false);
  const [showRescindCode, setShowRescindCode] = useState<string | undefined>();

  const [deleteUser, { loading: deleting }] = useDeleteUser();
  const [rescindInviteCode] = useRescindInviteCode();
  const [generateInviteCode] = useGenerateInviteCode();
  const [grantInvite] = useGrantInvite();
  const [revokeInvite] = useRevokeInvite();

  const { data, loading, refetch } = useUser({ name }, name === "");

  if (loading) return <LoadingIndicator />;
  if (name === "" || !data?.findUser) return <div>No user found!</div>;

  const user = data.findUser;

  const isUser = () => Auth.user?.name === name;

  const toggleModal = () => setShowDelete(true);
  const handleDelete = (status: boolean): void => {
    if (status)
      deleteUser({ variables: { input: { id: user.id } } }).then(() =>
        history.push(ROUTE_USERS)
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
    <Row className="justify-content-center">
      <Col lg={10}>
        {deleteModal}
        {rescindCodeModal}
        {isAdmin(Auth.user) && (
          <Button
            className="float-right mx-1"
            variant="danger"
            disabled={showDelete || deleting}
            onClick={toggleModal}
          >
            Delete User
          </Button>
        )}
        {canEdit(Auth.user) && (
          <LinkContainer
            to={createHref(ROUTE_USER_EDIT, user)}
            className="mx-1"
          >
            <Button className="float-right">Edit User</Button>
          </LinkContainer>
        )}
        {isUser() && (
          <LinkContainer to={ROUTE_USER_PASSWORD} className="mx-1">
            <Button className="float-right">Change Password</Button>
          </LinkContainer>
        )}
        <h2>{name}</h2>
        <hr />
        <Row>
          <span className="col-2">Email</span>
          <span className="col">{user?.email}</span>
        </Row>
        <Row>
          <span className="col-2">Roles</span>
          <span className="col">{(user?.roles ?? []).join(", ")}</span>
        </Row>
        <Row className="my-3">
          <span className="col-2">API key</span>
          <InputGroup className="col-10">
            <Form.Control value={user.api_key ?? ""} disabled />
            <InputGroup.Append>
              <Button
                onClick={() =>
                  navigator.clipboard?.writeText(user.api_key ?? "")
                }
              >
                Copy to Clipboard
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </Row>
        <Row>
          <span className="col-2">Invite Tokens</span>
          <InputGroup className="col">
            {isAdmin(Auth.user) && (
              <InputGroup.Prepend>
                <Button onClick={() => handleRevokeInvite()}>
                  <Icon icon="minus" />
                </Button>
              </InputGroup.Prepend>
            )}
            <InputGroup.Text>{user?.invite_tokens ?? 0}</InputGroup.Text>
            {isAdmin(Auth.user) && (
              <InputGroup.Append>
                <Button onClick={() => handleGrantInvite()}>
                  <Icon icon="plus" />
                </Button>
              </InputGroup.Append>
            )}
          </InputGroup>
        </Row>
        <Row className="my-2">
          <span className="col-2">Invite Keys</span>
          <div className="col">
            {user.active_invite_codes?.map((c) => (
              <InputGroup className="mb-2">
                <InputGroup.Text>
                  <code>{c}</code>
                </InputGroup.Text>
                <InputGroup.Append>
                  <Button onClick={() => navigator.clipboard?.writeText(c)}>
                    Copy
                  </Button>
                </InputGroup.Append>
                <InputGroup.Append>
                  <Button
                    variant="danger"
                    onClick={() => setShowRescindCode(c)}
                  >
                    <Icon icon="trash" />
                  </Button>
                </InputGroup.Append>
              </InputGroup>
            ))}
            <div>
              {isUser() && (
                <Button variant="link" onClick={() => handleGenerateCode()}>
                  <Icon icon="plus" className="mr-2" />
                  Generate Key
                </Button>
              )}
            </div>
          </div>
        </Row>
      </Col>
    </Row>
  );
};

export default AddUserComponent;
