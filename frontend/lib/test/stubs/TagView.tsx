import type { TagQuery } from "src/graphql";

export default function TagViewStub({
  tag,
}: {
  tag: NonNullable<TagQuery["findTag"]>;
}) {
  return <h1>{tag.name}</h1>;
}
