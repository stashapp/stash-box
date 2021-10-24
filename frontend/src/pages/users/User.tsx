import React, { useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Col, Form, InputGroup, Row, Table } from "react-bootstrap";
import { sortBy } from "lodash";

import {
  VoteStatusEnum,
  VoteTypeEnum,
  useConfig,
  useUser,
  useDeleteUser,
  useRescindInviteCode,
  useGenerateInviteCode,
  useGrantInvite,
  useRevokeInvite,
} from "src/graphql";
import {
  User_findUser_edit_count as EditCounts,
  User_findUser_vote_count as VoteCounts,
} from "src/graphql/definitions/User";
import AuthContext from "src/AuthContext";
import {
  ROUTE_USER_EDIT,
  ROUTE_USER_PASSWORD,
  ROUTE_USERS,
  ROUTE_USER_EDITS,
} from "src/constants/route";
import Modal from "src/components/modal";
import { Icon, LoadingIndicator } from "src/components/fragments";
import { isAdmin, createHref } from "src/utils";
import { EditStatusTypes, VoteTypes } from "src/constants";

type EditCount = [VoteStatusEnum, number];
const filterEdits = (editCount: EditCounts): EditCount[] => {
  const edits = Object.entries(editCount)
    .map(([status, count]) => {
      const resolvedStatus =
        VoteStatusEnum[status.toUpperCase() as VoteStatusEnum];
      return resolvedStatus
        ? [EditStatusTypes[resolvedStatus], count]
        : undefined;
    })
    .filter((val): val is EditCount => val !== undefined);
  return sortBy(edits, (value) => value[0]);
};

type VoteCount = [VoteTypeEnum, number];
const filterVotes = (voteCount: VoteCounts): VoteCount[] => {
  const votes = Object.entries(voteCount)
    .map(([status, count]) => {
      const resolvedStatus = VoteTypeEnum[status.toUpperCase() as VoteTypeEnum];
      return resolvedStatus ? [VoteTypes[resolvedStatus], count] : undefined;
    })
    .filter((val): val is VoteCount => val !== undefined);
  return sortBy(votes, (value) => value[0]);
};

const UserComponent: React.FC = () => {
  const Auth = useContext(AuthContext);
  const { data: configData } = useConfig();
  const { name = "" } = useParams<{ name?: string }>();
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
  const isUser = () => Auth.user?.name === user.name;
  const showPrivate = isUser() || isAdmin(Auth.user);
  const endpointURL = configData && `${configData.getConfig.host_url}/graphql`;

  const toggleModal = () => setShowDelete(true);
  const handleDelete = (status: boolean): void => {
    if (status)
      deleteUser({ variables: { input: { id: user.id } } }).then(() => {
        window.location.href = ROUTE_USERS;
      });
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

  const editCount = filterEdits(user.edit_count);
  const voteCount = filterVotes(user.vote_count);

  return (
    <Row className="justify-content-center">
      <Col lg={10}>
        <div className="d-flex">
          <h3>{name}</h3>
          {deleteModal}
          {rescindCodeModal}
          <div className="ml-auto">
            <Link to={createHref(ROUTE_USER_EDITS, user)} className="ml-2">
              <Button variant="secondary">User Edits</Button>
            </Link>
            {isUser() && (
              <Link to={ROUTE_USER_PASSWORD} className="ml-2">
                <Button>Change Password</Button>
              </Link>
            )}
            {isAdmin(Auth.user) && (
              <>
                <Link to={createHref(ROUTE_USER_EDIT, user)} className="ml-2">
                  <Button>Edit User</Button>
                </Link>
                <Button
                  className="ml-2"
                  variant="danger"
                  disabled={showDelete || deleting}
                  onClick={toggleModal}
                >
                  Delete User
                </Button>
              </>
            )}
          </div>
        </div>
        <hr />
        {showPrivate && (
          <Row>
            <span className="col-2">Email</span>
            <span className="col">{user?.email}</span>
          </Row>
        )}
        <Row>
          <span className="col-2">Roles</span>
          <span className="col">{(user?.roles ?? []).join(", ")}</span>
        </Row>
        {showPrivate && (
          <>
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
            {endpointURL && (
              <Row className="my-3">
                <span className="col-2">GraphQL Endpoint</span>
                <InputGroup className="col-10">
                  <Form.Control value={endpointURL} disabled />
                  <InputGroup.Append>
                    <Button
                      onClick={() =>
                        navigator.clipboard?.writeText(endpointURL)
                      }
                    >
                      Copy to Clipboard
                    </Button>
                  </InputGroup.Append>
                </InputGroup>
              </Row>
            )}
            <Row>
              <Col xs={6}>
                <Table>
                  <thead>
                    <tr>
                      <th>Edits</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editCount.map(([status, count]) => (
                      <tr key={status}>
                        <td>{status}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
              <Col xs={6}>
                <Table>
                  <thead>
                    <tr>
                      <th>Votes</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voteCount.map(([vote, count]) => (
                      <tr key={vote}>
                        <td>{vote}</td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
            {(isAdmin(Auth.user) || user.id === Auth.user?.id) && (
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
            )}
            {user.id === Auth.user?.id && (
              <Row className="my-2">
                <span className="col-2">Invite Keys</span>
                <div className="col">
                  {user.active_invite_codes?.map((c) => (
                    <InputGroup className="mb-2" key={c}>
                      <InputGroup.Text>
                        <code>{c}</code>
                      </InputGroup.Text>
                      <InputGroup.Append>
                        <Button
                          onClick={() => navigator.clipboard?.writeText(c)}
                        >
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
                      <Button
                        variant="link"
                        onClick={() => handleGenerateCode()}
                        disabled={user.invite_tokens === 0}
                      >
                        <Icon icon="plus" className="mr-2" />
                        Generate Key
                      </Button>
                    )}
                  </div>
                </div>
              </Row>
            )}
          </>
        )}
      </Col>
    </Row>
  );
};

export default UserComponent;
