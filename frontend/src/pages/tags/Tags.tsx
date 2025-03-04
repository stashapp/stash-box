import { FC } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

import { TagList } from "src/components/list";
import { createHref } from "src/utils";
import { ROUTE_TAG_ADD } from "src/constants/route";
import { useCurrentUser } from "src/hooks";

const Tags: FC = () => {
  const { isTagEditor } = useCurrentUser();
  return (
    <>
      <div className="d-flex">
        <h3>Tags</h3>
        {isTagEditor && (
          <Link to={createHref(ROUTE_TAG_ADD)} className="ms-auto">
            <Button className="ms-auto">Create</Button>
          </Link>
        )}
      </div>
      <TagList tagFilter={{}} showCategoryLink />
    </>
  );
};

export default Tags;
