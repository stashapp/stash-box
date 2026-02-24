import { type FC, useState } from "react";

import { TagLink } from "src/components/fragments";
import SearchField, { SearchType } from "src/components/searchField";
import { formatDisambiguation, performerHref } from "src/utils";

import type { SearchPerformersQuery } from "src/graphql";

type Performer = NonNullable<
  SearchPerformersQuery["searchPerformers"]["performers"][number]
>;

interface PerformerSelectProps {
  performers: Performer[];
  onChange: (performers: Performer[]) => void;
  message?: string;
  excludePerformers?: string[];
}

const CLASSNAME = "PerformerSelect";
const CLASSNAME_LIST = `${CLASSNAME}-list`;
const CLASSNAME_CONTAINER = `${CLASSNAME}-container`;

const PerformerSelect: FC<PerformerSelectProps> = ({
  performers: initialPerformers,
  onChange,
  message = "Add performer:",
  excludePerformers = [],
}) => {
  const [performers, setPerformers] = useState(initialPerformers);

  const handleChange = (performer: Performer) => {
    const newPerformers = [...performers, performer];
    setPerformers(newPerformers);
    onChange(newPerformers);
  };

  const removePerformer = (id: string) => {
    const newPerformers = performers.filter((performer) => performer.id !== id);
    setPerformers(newPerformers);
    onChange(newPerformers);
  };

  const performerList = [...(performers ?? [])]
    .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
    .map((performer) => (
      <TagLink
        title={`${performer.name}${formatDisambiguation(performer)}`}
        link={performerHref(performer)}
        onRemove={() => removePerformer(performer.id)}
        key={performer.id}
        disabled
      />
    ));

  return (
    <div className={CLASSNAME}>
      <div className={CLASSNAME_CONTAINER}>
        <SearchField
          onClickPerformer={handleChange}
          searchType={SearchType.Performer}
          excludeIDs={excludePerformers}
          placeholder={message}
        />
      </div>
      <div className={CLASSNAME_LIST}>{performerList}</div>
    </div>
  );
};

export default PerformerSelect;
