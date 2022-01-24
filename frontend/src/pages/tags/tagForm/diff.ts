import { OldTagDetails, TagDetails } from "src/components/editCard/ModifyEdit";
import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";
import { CastedTagFormData } from "./schema";
import { diffValue, diffArray, filterData } from "src/utils";

const selectTagDetails = (
  data: CastedTagFormData,
  original: Tag
): [Required<OldTagDetails>, Required<TagDetails>] => {
  const [addedAliases, removedAliases] = diffArray(
    filterData(data?.aliases),
    original.aliases,
    (a) => a
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
