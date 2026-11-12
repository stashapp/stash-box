import type { FC } from "react";
import { Form } from "react-bootstrap";
import { TagLink } from "src/components/fragments";
import { useTag } from "src/graphql";
import { tagHref } from "src/utils/route";
import {
  parseTagFilterMode,
  TAG_FILTER_MODE_LABELS,
  TAG_FILTER_MODES,
  type TagFilterMode,
} from "./criterion";
import TagFilter from "./TagFilter";

interface TagChipProps {
  id: string;
  onRemove: () => void;
}

const TagChip: FC<TagChipProps> = ({ id, onRemove }) => {
  const { data } = useTag({ id });
  const tag = data?.findTag;

  return (
    <TagLink
      title={tag?.name ?? "..."}
      description={tag?.description}
      link={tag ? tagHref(tag) : undefined}
      onRemove={onRemove}
      disabled
    />
  );
};

interface Props {
  tags: string[];
  mode: TagFilterMode;
  onTagsChange: (tags: string[]) => void;
  onModeChange: (mode: TagFilterMode) => void;
}

const TagCriterionFilter: FC<Props> = ({
  tags,
  mode,
  onTagsChange,
  onModeChange,
}) => (
  <div className="TagCriterionFilter d-flex align-items-center flex-wrap">
    {tags.length > 0 && (
      <Form.Select
        className="w-auto me-2"
        aria-label="Tag filter mode"
        value={mode}
        onChange={(e) =>
          onModeChange(parseTagFilterMode(e.currentTarget.value))
        }
      >
        {TAG_FILTER_MODES.map((m) => (
          <option value={m} key={m}>
            {TAG_FILTER_MODE_LABELS[m]}
          </option>
        ))}
      </Form.Select>
    )}
    {tags.map((id) => (
      <TagChip
        key={id}
        id={id}
        onRemove={() => onTagsChange(tags.filter((t) => t !== id))}
      />
    ))}
    <TagFilter
      tag=""
      excludeTags={tags}
      onChange={(t) => t && onTagsChange([...tags, t.id])}
      placeholder={tags.length > 0 ? "Add tag" : "Filter by tag"}
    />
  </div>
);

export default TagCriterionFilter;
