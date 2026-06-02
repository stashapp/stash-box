import type { TypedDocumentNode } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useEffect, useState } from "react";

interface Identified {
  id: string;
}

interface Options {
  enabled?: boolean;
}

// Lazily fetches the full record for each source via the given document. The
// search/select components return slim shapes; consumers that need the full
// entity (merge forms, etc.) use this to populate the missing fields without
// rendering a hook-bearing child per source.
//
// `field` names the top-level key on the query result (e.g. "findPerformer").
export function useEntitySources<TData, K extends keyof TData>(
  sources: Identified[],
  document: TypedDocumentNode<TData, { id: string }>,
  field: K,
  { enabled = true }: Options = {},
): { sources: NonNullable<TData[K]>[]; ready: boolean } {
  const client = useApolloClient();
  const [cache, setCache] = useState<
    Record<string, NonNullable<TData[K]> | undefined>
  >({});

  useEffect(() => {
    if (!enabled) return;
    const missing = sources.filter((s) => !cache[s.id]);
    if (missing.length === 0) return;
    const controller = new AbortController();
    Promise.all(
      missing.map((s) =>
        client.query<TData, { id: string }>({
          query: document,
          variables: { id: s.id },
          context: { fetchOptions: { signal: controller.signal } },
        }),
      ),
    )
      .then((results) => {
        setCache((prev) => {
          const next = { ...prev };
          results.forEach((r, i) => {
            const item = r.data?.[field];
            if (item) next[missing[i].id] = item as NonNullable<TData[K]>;
          });
          return next;
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        throw err;
      });
    return () => controller.abort();
  }, [client, enabled, sources, cache, document, field]);

  const loaded = sources
    .map((s) => cache[s.id])
    .filter((s): s is NonNullable<TData[K]> => s !== undefined);
  return { sources: loaded, ready: loaded.length === sources.length };
}
