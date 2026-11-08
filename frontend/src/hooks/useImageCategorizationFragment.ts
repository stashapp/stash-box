import { useFragment } from "@apollo/client/react";
import { ImageCategorizationFragmentDoc } from "src/graphql";

/**
 * An image's labels as the cache currently holds them, which is what anything
 * outside the form has to read: labels are saved directly rather than through
 * the edit queue, so the cache moves ahead of any snapshot taken on open
 */
export const useImageCategorizationFragment = (imageId: string) => {
  const { data, complete } = useFragment({
    fragment: ImageCategorizationFragmentDoc,
    from: { __typename: "Image", id: imageId },
  });

  return complete ? data : undefined;
};
