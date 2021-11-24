import React from "react";
import { useParams, Link } from "react-router-dom";

import { useUser } from "src/graphql";
import { ROUTE_USER } from "src/constants/route";
import { createHref } from "src/utils";
import { LoadingIndicator } from "src/components/fragments";
import { EditList } from "src/components/list";

const AddUserComponent: React.FC = () => {
  const { name = "" } = useParams<{ name?: string }>();

  const { data, loading } = useUser({ name });

  if (loading) return <LoadingIndicator />;
  if (name === "" || !data?.findUser) return <div>No user found!</div>;

  const user = data.findUser;

  return (
    <>
      <h3>
        Edits by <Link to={createHref(ROUTE_USER, user)}>{name}</Link>
      </h3>
      <EditList userId={user.id} />
    </>
  );
};

export default AddUserComponent;
