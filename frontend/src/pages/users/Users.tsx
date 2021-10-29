import React from "react";
import { Button, Form, Table } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import { faUserEdit } from "@fortawesome/free-solid-svg-icons";
import querystring from "query-string";
import { debounce } from "lodash-es";

import { useUsers, SortDirectionEnum } from "src/graphql";
import { usePagination } from "src/hooks";
import { ErrorMessage, Icon } from "src/components/fragments";
import { List } from "src/components/list";
import { createHref } from "src/utils";
import {
  ROUTE_USER_EDIT,
  ROUTE_USER,
  ROUTE_USER_ADD,
} from "src/constants/route";

const PER_PAGE = 20;

const UsersComponent: React.FC = () => {
  const history = useHistory();
  const queries = querystring.parse(history.location.search);
  const query = Array.isArray(queries.query) ? queries.query[0] : queries.query;
  const { page, setPage } = usePagination();
  const { loading, data } = useUsers({
    filter: {
      page,
      per_page: PER_PAGE,
      sort: "name",
      direction: SortDirectionEnum.ASC,
    },
    userFilter: {
      name: query,
    },
  });

  if (!loading && !data) return <ErrorMessage error="Failed to load users." />;

  const users = data?.queryUsers.users.map((user) => (
    <tr key={user.id}>
      <td>
        <Link to={createHref(ROUTE_USER_EDIT, user)}>
          <Button variant="secondary" className="minimal">
            <Icon icon={faUserEdit} />
          </Button>
        </Link>
        <Link to={createHref(ROUTE_USER, user)}>
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

  const handleQuery = (name: string, value?: string) => {
    const qs = querystring.stringify({
      ...querystring.parse(history.location.search),
      [name]: value || undefined,
      page: undefined,
    });
    history.replace(`${history.location.pathname}?${qs}`);
  };
  const debouncedHandler = debounce(handleQuery, 200);

  const filters = (
    <Form.Control
      id="user-name"
      onChange={(e) => debouncedHandler("query", e.currentTarget.value)}
      placeholder="Filter by username"
      defaultValue={query ?? ""}
      className="w-auto"
    />
  );

  return (
    <>
      <div className="d-flex">
        <h3>Users</h3>
        <Link to={ROUTE_USER_ADD} className="ml-auto">
          <Button>Add User</Button>
        </Link>
      </div>
      <List
        page={page}
        setPage={setPage}
        perPage={PER_PAGE}
        loading={loading}
        listCount={data?.queryUsers.count}
        filters={filters}
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
