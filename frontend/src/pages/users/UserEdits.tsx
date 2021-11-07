import { FC } from "react";
import { Link } from "react-router-dom";

import { User_findUser as User } from "src/graphql/definitions/User";
import { ROUTE_USER } from "src/constants/route";
import { createHref } from "src/utils";
import { EditList } from "src/components/list";

interface Props {
  user: User;
}

const UserEditsComponent: FC<Props> = ({ user }) => (
  <>
    <h3>
      Edits by <Link to={createHref(ROUTE_USER, user)}>{user.name}</Link>
    </h3>
    <EditList userId={user.id} />
  </>
);

export default UserEditsComponent;
