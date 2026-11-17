import { useFragment } from "@apollo/client/react";
import { ImageCategorizationFragmentDoc } from "src/graphql";

/** An image's labels as the cache holds them, which moves ahead of any snapshot taken on open */
export const useImageCategorizationFragment = (imageId: string) => {
  const { data, complete } = useFragment({
    fragment: ImageCategorizationFragmentDoc,
    from: { __typename: "Image", id: imageId },
  });

  return complete ? data : undefined;
};
