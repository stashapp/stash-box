import type { FC } from "react";
import { Badge, Stack } from "react-bootstrap";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

import type { GenderEnum, GenderFacet as GenderFacetType } from "src/graphql";
import { GenderIcon, Icon } from "src/components/fragments";
import { GenderTypes } from "src/constants";

interface Props {
  genders: GenderFacetType[];
  selected?: GenderEnum | null;
  onClick?: (gender: GenderEnum | null) => void;
}

export const GenderFacet: FC<Props> = ({ genders, selected, onClick }) => {
  if (!genders || genders.length === 0) return null;

  return (
    <div className="SearchPage-facets">
      <small className="text-muted me-2">Gender:</small>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        {genders.map((g) => {
          const isSelected = selected === g.gender;
          return (
            <Badge
              key={g.gender}
              bg={isSelected ? "primary" : "secondary"}
              className="d-flex align-items-center gap-1"
              style={{ cursor: onClick ? "pointer" : "default" }}
              onClick={() => onClick?.(isSelected ? null : g.gender)}
            >
              <GenderIcon gender={g.gender} />
              {GenderTypes[g.gender] ?? g.gender}
              <Badge bg="dark" pill className="ms-1">
                {g.count}
              </Badge>
              {isSelected && <Icon icon={faTimes} className="ms-1" />}
            </Badge>
          );
        })}
      </Stack>
    </div>
  );
};

