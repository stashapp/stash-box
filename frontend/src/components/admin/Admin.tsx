import React from "react";
import { useQuery } from "@apollo/react-hooks";
import { Button, Table } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";

import UsersQuery from "src/queries/Users.gql";
import { Users } from "src/definitions/Users";

import { Icon, LoadingIndicator } from "src/components/fragments";

const AdminComponent: React.FC = () => {
  const { loading, data } = useQuery<Users>(UsersQuery);

  if (loading) return <LoadingIndicator />;

  const users = data.queryUsers.users.map((user) => (
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
      <td>{user.roles.join(", ")}</td>
      <td className="apikey">
        <textarea className="w-100" rows={1} disabled value={user.api_key} />
      </td>
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
            <th className="apikey">API-key</th>
          </tr>
        </thead>
        <tbody>{users}</tbody>
      </Table>
      <hr />
    </div>
  );
};

export default AdminComponent;
