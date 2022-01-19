import { FC, MouseEvent } from "react";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";
import { Button } from "react-bootstrap";
import cx from "classnames";

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
  const [setFavorite] = useSetFavorite(entityType, entity.id);

  const handleClick = (e: MouseEvent) => {
    setFavorite({
      variables: {
        id: entity.id,
        favorite: !entity.is_favorite,
      },
    });

    e.preventDefault();
  };

  if ((!interactable && !entity.is_favorite) || entity.deleted) return null;

  return (
    <Tooltip
      text={
        interactable ? `${entity.is_favorite ? "Remove" : "Add"} Favorite` : ""
      }
    >
      <Button
        disabled={!interactable}
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
