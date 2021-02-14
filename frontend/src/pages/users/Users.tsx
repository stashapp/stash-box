import React from "react";
import { useQuery } from "@apollo/client";
import { Button, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { loader } from "graphql.macro";

import { Users, UsersVariables } from "src/definitions/Users";
import { usePagination } from "src/hooks";
import { ErrorMessage, Icon } from "src/components/fragments";
import { List } from "src/components/list";

const UsersQuery = loader("src/queries/Users.gql");

const PER_PAGE = 20;

const UsersComponent: React.FC = () => {
  const { page, setPage } = usePagination();
  const { loading, data } = useQuery<Users, UsersVariables>(UsersQuery, {
    variables: {
      filter: {
        page,
        per_page: PER_PAGE,
      },
    },
  });

  if (!loading && !data) return <ErrorMessage error="Failed to load users." />;

  const users = data?.queryUsers.users.map((user) => (
    <tr key={user.id}>
      <td>
        <Link to={`/users/${user.name}/edit`}>
          <Button variant="secondary" className="minimal">
            <Icon icon="user-edit" />
          </Button>
        </Link>
        <Link to={`/users/${user.name}`}>
          <Button variant="link">
            <span>{user.name}</span>
          </Button>
        </Link>
      </td>
      <td>{user.email}</td>
      <td>{user?.roles?.join(", ") ?? ""}</td>
      <td>{user?.invited_by?.name ?? ""}</td>
      <td>{user?.invite_tokens ?? ""}</td>
    </tr>
  ));

  return (
    <>
      <div className="d-flex">
        <h2>Users</h2>
        <Link to="/users/add" className="ml-auto">
          <Button>Add User</Button>
        </Link>
      </div>
      <List
        page={page}
        setPage={setPage}
        loading={loading}
        listCount={data?.queryUsers.count}
      >
        <Table striped className="users-table">
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
      </List>
    </>
  );
};

export default UsersComponent;
