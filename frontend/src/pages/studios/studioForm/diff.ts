import {
  OldStudioDetails,
  StudioDetails,
} from "src/components/editCard/ModifyEdit";
import { StudioFragment } from "src/graphql";
import { StudioFormData } from "./schema";
import { diffValue, diffImages, diffURLs, diffArray } from "src/utils";

const selectStudioDetails = (
  data: StudioFormData,
  original: StudioFragment | null | undefined,
): [Required<OldStudioDetails>, Required<StudioDetails>] => {
  const [addedImages, removedImages] = diffImages(
    data.images,
    original?.images ?? [],
  );
  const [addedUrls, removedUrls] = diffURLs(data.urls, original?.urls ?? []);
  const [addedAliases, removedAliases] = diffArray(
    data?.aliases,
    original?.aliases ?? [],
    (a) => a,
  );

  return [
    {
      name: diffValue(original?.name, data.name),
      parent:
        original?.parent?.id !== data.parent?.id &&
        original?.parent?.id &&
        original?.parent.name
          ? {
              id: original.parent.id,
              name: original.parent.name,
            }
          : null,
    },
    {
      name: diffValue(data.name, original?.name),
      parent:
        data.parent?.id !== original?.parent?.id &&
        data.parent?.id &&
        data.parent?.name
          ? {
              id: data.parent.id,
              name: data.parent.name,
            }
          : null,
      added_urls: addedUrls,
      removed_urls: removedUrls,
      added_images: addedImages,
      removed_images: removedImages,
      added_aliases: addedAliases,
      removed_aliases: removedAliases,
    },
  ];
};

export default selectStudioDetails;
