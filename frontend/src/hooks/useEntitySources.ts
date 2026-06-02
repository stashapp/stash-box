import type { TypedDocumentNode } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useEffect, useRef, useState } from "react";

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
// pick is stashed in a ref so callers don't need useCallback.
export function useEntitySources<TData, TResult>(
  sources: Identified[],
  document: TypedDocumentNode<TData, { id: string }>,
  pick: (data: TData) => TResult | null | undefined,
  { enabled = true }: Options = {},
): { sources: TResult[]; ready: boolean } {
  const client = useApolloClient();
  const [cache, setCache] = useState<Record<string, TResult>>({});
  const pickRef = useRef(pick);
  pickRef.current = pick;

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
            const item = r.data ? pickRef.current(r.data) : undefined;
            if (item) next[missing[i].id] = item;
          });
          return next;
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        throw err;
      });
    return () => controller.abort();
  }, [client, enabled, sources, cache, document]);

  const loaded = sources
    .map((s) => cache[s.id])
    .filter((s): s is TResult => s !== undefined);
  return { sources: loaded, ready: loaded.length === sources.length };
}
