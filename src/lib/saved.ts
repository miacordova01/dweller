import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useSavedListings() {
  const ids = useQuery(api.saved.listingIds);
  const toggle = useMutation(api.saved.toggle).withOptimisticUpdate((store, { listingId }) => {
    const current = store.getQuery(api.saved.listingIds, {});
    if (current === undefined) return;
    store.setQuery(
      api.saved.listingIds,
      {},
      current.includes(listingId) ? current.filter((id) => id !== listingId) : [...current, listingId],
    );
  });
  const saved = new Set(ids ?? []);
  return {
    ids,
    isSaved: (id: Id<"listings">) => saved.has(id),
    toggle: (listingId: Id<"listings">) => {
      toggle({ listingId }).catch(() => {});
    },
  };
}
