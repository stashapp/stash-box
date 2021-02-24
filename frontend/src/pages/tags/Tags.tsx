import React, { useContext } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

import { TagList } from "src/components/list";
import { canEdit, createHref } from "src/utils";
import { ROUTE_TAG_ADD } from "src/constants/route";
import AuthContext from "src/AuthContext";

const TagsComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  return (
    <>
      <div className="d-flex">
        <h3>Tags</h3>
        {canEdit(auth.user) && (
          <Link to={createHref(ROUTE_TAG_ADD)} className="ml-auto">
            <Button className="ml-auto">Create</Button>
          </Link>
        )}
      </div>
      <TagList tagFilter={{}} showCategoryLink />
    </>
  );
};

export default TagsComponent;
