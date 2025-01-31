import { FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Row } from "react-bootstrap";

import { useDeleteCategory, CategoryQuery } from "src/graphql";
import { createHref } from "src/utils";
import DeleteButton from "src/components/deleteButton";
import { TagList } from "src/components/list";
import { ROUTE_CATEGORIES, ROUTE_CATEGORY_EDIT } from "src/constants/route";
import { useCurrentUser } from "src/hooks";

type Category = NonNullable<CategoryQuery["findTagCategory"]>;

interface Props {
  category: Category;
}

const CategoryComponent: FC<Props> = ({ category }) => {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  const [deleteCategory, { loading: deleting }] = useDeleteCategory({
    onCompleted: (result) => {
      if (result) navigate(ROUTE_CATEGORIES);
    },
  });

  const handleDelete = () => {
    deleteCategory({
      variables: {
        input: { id: category.id },
      },
    });
  };

  return (
    <>
      <Link to={ROUTE_CATEGORIES}>
        <h6 className="mb-4">&larr; Category List</h6>
      </Link>
      <div className="d-flex">
        <h3 className="me-auto">
          <em>{category.name}</em>
        </h3>
        <div className="ms-auto">
          {isAdmin && (
            <>
              <Link
                to={createHref(ROUTE_CATEGORY_EDIT, category)}
                className="me-2"
              >
                <Button>Edit</Button>
              </Link>
              <DeleteButton
                onClick={handleDelete}
                disabled={deleting}
                message="Do you want to delete category? This is only possible if no tags are attached."
              />
            </>
          )}
        </div>
      </div>
      {category.description && (
        <Row className="g-0">
          <b className="me-2">Description:</b>
          <span>{category.description}</span>
        </Row>
      )}
      <hr className="my-2 mb-4" />
      <TagList tagFilter={{ category_id: category.id }} />
    </>
  );
};

export default CategoryComponent;
