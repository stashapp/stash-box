import type { CategoryQuery } from "src/graphql";

export default function CategoryViewStub({
  category,
}: {
  category: NonNullable<CategoryQuery["findTagCategory"]>;
}) {
  return <h1>{category.name}</h1>;
}
