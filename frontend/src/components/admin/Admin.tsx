import React from "react";
import { useQuery } from "@apollo/client";
import { Button, Table } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { loader } from "graphql.macro";

import { Users } from "src/definitions/Users";

import { Icon, LoadingIndicator } from "src/components/fragments";

const UsersQuery = loader("src/queries/Users.gql");

const AdminComponent: React.FC = () => {
  const { loading, data } = useQuery<Users>(UsersQuery);

  if (loading) return <LoadingIndicator />;

  const users = (data?.queryUsers?.users ?? []).map((user) => (
    <tr key={user.id}>
      <td>
        <LinkContainer to={`/users/${user.name}/edit`}>
          <Button variant="link">
            <Icon icon="user-edit" />
          </Button>
        </LinkContainer>
        <LinkContainer to={`/users/${user.name}`}>
          <Button variant="link">
            <span>{user.name}</span>
          </Button>
        </LinkContainer>
      </td>
      <td>{user.email}</td>
      <td>{user?.roles?.join(", ") ?? ""}</td>
      <td>{user?.invited_by?.name ?? ""}</td>
      <td>{user?.invite_tokens ?? ""}</td>
    </tr>
  ));

  return (
    <div className="users">
      <LinkContainer to="/users/add" className="float-right">
        <Button>Add User</Button>
      </LinkContainer>
      <h4>Users:</h4>
      <Table className="users-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Invited by</th>
            <th>Invite Tokens</th>
          </tr>
        </thead>
        <tbody>{users}</tbody>
      </Table>
      <hr />
    </div>
  );
};

export default AdminComponent;
