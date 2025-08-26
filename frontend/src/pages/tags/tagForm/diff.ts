import type {
  OldTagDetails,
  TagDetails,
} from "src/components/editCard/ModifyEdit";
import type { TagFragment as Tag } from "src/graphql";
import type { TagFormData } from "./schema";
import { diffValue, diffArray } from "src/utils";

const selectTagDetails = (
  data: TagFormData,
  original: Tag,
): [Required<OldTagDetails>, Required<TagDetails>] => {
  const [addedAliases, removedAliases] = diffArray(
    data?.aliases,
    original.aliases,
    (a) => a,
  );

  return [
    {
      name: diffValue(original.name, data.name),
      description: diffValue(original.description, data.description),
      category:
        original.category?.id !== data.category?.id &&
        original.category?.id &&
        original.category.name
          ? {
              id: original.category.id,
              name: original.category.name,
            }
          : null,
    },
    {
      name: diffValue(data.name, original.name),
      description: diffValue(data.description, original.description),
      category:
        data.category?.id !== original.category?.id &&
        data.category?.id &&
        data.category?.name
          ? {
              id: data.category?.id,
              name: data.category?.name,
            }
          : null,
      added_aliases: addedAliases,
      removed_aliases: removedAliases,
    },
  ];
};

export default selectTagDetails;
