import { type DocumentNode, gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { parse, print } from "graphql";
import { useMemo } from "react";

interface Identified {
  id: string;
}

interface Options {
  enabled?: boolean;
}

const EMPTY_QUERY = gql`
  query EmptyMergeSources {
    __typename
  }
`;

const getFragmentName = (doc: DocumentNode): string => {
  const def = doc.definitions.find((d) => d.kind === "FragmentDefinition");
  if (!def || def.kind !== "FragmentDefinition") {
    throw new Error(
      "useEntities: expected a FragmentDefinition in the supplied fragment document",
    );
  }
  return def.name.value;
};

// gql tag accepts DocumentNode interpolations only, not raw strings, so the
// query is assembled as a plain string and parsed once. The fragment is
// printed back to source and appended so its dependency fragments
// (URLFragment, ImageFragment, etc.) come along with it.
const buildQuery = (n: number, field: string, fragment: DocumentNode) => {
  const fragmentName = getFragmentName(fragment);
  const operationName = `${fragmentName.replace(/Fragment$/, "")}Entities`;
  const range = Array.from({ length: n }, (_, i) => i);
  const params = range.map((i) => `$id${i}: ID!`).join(", ");
  const fields = range
    .map((i) => `s${i}: ${field}(id: $id${i}) { ...${fragmentName} }`)
    .join("\n");
  return parse(`
    query ${operationName}(${params}) {
      ${fields}
    }
    ${print(fragment)}
  `);
};

// Load {n} entities in a single query
export function useEntities<T>(
  sources: Identified[],
  field: string,
  fragment: DocumentNode,
  { enabled = true }: Options = {},
): { sources: T[]; ready: boolean; error: Error | null } {
  const query = useMemo(
    () =>
      sources.length > 0
        ? buildQuery(sources.length, field, fragment)
        : EMPTY_QUERY,
    [sources.length, field, fragment],
  );
  const variables = useMemo(
    () => Object.fromEntries(sources.map((s, i) => [`id${i}`, s.id])),
    [sources],
  );

  const { data, loading, error } = useQuery(query, {
    variables,
    skip: !enabled || sources.length === 0,
  });

  const loaded = sources
    .map((_, i) => (data as Record<string, T | null> | undefined)?.[`s${i}`])
    .filter((t): t is T => t != null);

  return {
    sources: loaded,
    ready: !loading && loaded.length === sources.length,
    error: error ?? null,
  };
}
