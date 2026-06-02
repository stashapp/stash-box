import { type DocumentNode, gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";

interface Identified {
  id: string;
}

interface Options {
  enabled?: boolean;
}

// useQuery requires a DocumentNode even when skipped; this stands in until
// the caller has at least one source to query.
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

const buildQuery = (n: number, field: string, fragment: DocumentNode) => {
  const fragmentName = getFragmentName(fragment);
  const range = Array.from({ length: n }, (_, i) => i);
  const params = range.map((i) => `$id${i}: ID!`).join(", ");
  const fields = range
    .map((i) => `s${i}: ${field}(id: $id${i}) { ...${fragmentName} }`)
    .join("\n");
  return gql`
    query MergeEntities(${params}) {
      ${fields}
    }
    ${fragment}
  `;
};

// Loads the full record for each source via one aliased GraphQL operation —
// `s0..sN-1: <field>(id: $idN) { ...Fragment }`. The selection list returns
// slim shapes from search/select components; consumers that need every field
// (merge forms, etc.) use this to pull the rest. Apollo's normalized cache
// dedupes by entity, so a re-issued query after a source is added still
// serves the already-loaded records from cache.
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
