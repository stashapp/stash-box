import { type FC, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import { List } from "src/components/list";
import { type GenderEnum, useSearchPerformers } from "src/graphql";
import { usePagination } from "src/hooks";
import { GenderFacet } from "./GenderFacet";
import { PerformerCard } from "./PerformerCard";

const PER_PAGE = 20;

export const SearchPerformersTab: FC = () => {
  const [searchParams] = useSearchParams();
  const term = searchParams.get("q") ?? "";
  const { page, setPage } = usePagination();
  const [selectedGender, setSelectedGender] = useState<GenderEnum | null>(null);

  const { loading, data } = useSearchPerformers(
    {
      term: term ?? "",
      page,
      per_page: PER_PAGE,
      filter: {
        gender: selectedGender,
      },
    },
    !term,
  );

  const handleGenderClick = (gender: GenderEnum | null) => {
    setSelectedGender(gender);
    setPage(1);
  };

  if (!term) {
    return null;
  }

  if (loading && !data) {
    return <LoadingIndicator message="Searching performers..." />;
  }

  const performers = data?.searchPerformers.performers ?? [];
  const count = data?.searchPerformers.count ?? 0;
  const facets = data?.searchPerformers.facets;

  return (
    <List
      entityName="performers"
      page={page}
      setPage={setPage}
      perPage={PER_PAGE}
      loading={loading}
      listCount={count}
      filters={
        facets && (
          <GenderFacet
            genders={facets.genders}
            selected={selectedGender}
            onClick={handleGenderClick}
          />
        )
      }
    >
      <div>
        {performers.map((p) => (
          <PerformerCard performer={p} key={p.id} />
        ))}
      </div>
    </List>
  );
};
