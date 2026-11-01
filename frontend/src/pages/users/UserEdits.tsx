import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { EditList } from "src/components/list";
import { ROUTE_USER } from "src/constants/route";
import { VoteStatusEnum } from "src/graphql";
import { useCurrentUser } from "src/hooks";

interface Props {
  user: {
    id: string;
    name: string;
  };
}

const UserEditsComponent: FC<Props> = ({ user }) => {
  const { isSelf } = useCurrentUser();
  return (
    <>
      <h3>
        Edits by{" "}
        <Link to={ROUTE_USER} params={user}>
          {user.name}
        </Link>
      </h3>
      <EditList
        userId={user.id}
        defaultVoteStatus={VoteStatusEnum.PENDING}
        showVotedFilter={!isSelf(user)}
        userSubmitted={true}
      />
    </>
  );
};

export default UserEditsComponent;
