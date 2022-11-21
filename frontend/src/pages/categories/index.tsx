import { FC } from "react";
import { useParams, Route, Routes } from "react-router-dom";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";

import { useCategory } from "src/graphql";

import Category from "./Category";
import Categories from "./Categories";
import CategoryAdd from "./CategoryAdd";
import CategoryEdit from "./CategoryEdit";

const CategoryLoader: FC = () => {
  const { id } = useParams();
  const { data, loading } = useCategory({ id: id ?? "" }, !id);

  if (!id) return <ErrorMessage error="Category ID is required" />;
  if (loading) return <LoadingIndicator message="Loading..." />;
  if (!data?.findTagCategory)
    return <ErrorMessage error="Category not found" />;

  return (
    <Routes>
      <Route
        path="/edit"
        element={
          <>
            <Title page={`Edit Category "${data.findTagCategory.name}"`} />
            <CategoryEdit category={data.findTagCategory} />
          </>
        }
      />
      <Route
        path="/"
        element={
          <>
            <Title page={`Category "${data.findTagCategory.name}"`} />
            <Category category={data.findTagCategory} />
          </>
        }
      />
    </Routes>
  );
};

const CategoryRoutes: FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <>
          <Title page="Categories" />
          <Categories />
        </>
      }
    />
    <Route
      path="/add"
      element={
        <>
          <Title page="Add Category" />
          <CategoryAdd />
        </>
      }
    />
    <Route path="/:id/*" element={<CategoryLoader />} />
  </Routes>
);

export default CategoryRoutes;
