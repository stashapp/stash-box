import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import type { FC, MouseEvent } from "react";
import { Button } from "react-bootstrap";

import { Icon, Tooltip } from "src/components/fragments";
import { useSetFavorite } from "src/graphql";

const CLASSNAME = "FavoriteStar";

interface Props {
  entity: {
    id: string;
    deleted: boolean;
    is_favorite: boolean;
  };
  entityType: "performer" | "studio";
  className?: string;
  interactable?: boolean;
}

export const FavoriteStar: FC<Props> = ({
  className,
  entity,
  entityType,
  interactable = false,
}) => {
  const [setFavorite, { loading }] = useSetFavorite(entityType, entity.id);

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    setFavorite({
      variables: {
        id: entity.id,
        favorite: !entity.is_favorite,
      },
    });
  };

  if ((!interactable && !entity.is_favorite) || entity.deleted) return null;

  return (
    <Tooltip
      text={
        interactable ? `${entity.is_favorite ? "Remove" : "Add"} Favorite` : ""
      }
    >
      <Button
        disabled={!interactable || loading}
        onClick={handleClick}
        className={cx(CLASSNAME, className)}
        variant="link"
      >
        <Icon
          icon={entity.is_favorite ? faStar : farStar}
          color={entity.is_favorite ? "gold" : "white"}
        />
      </Button>
    </Tooltip>
  );
};
