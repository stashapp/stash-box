import type React from "react";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { Icon, Tooltip } from "src/components/fragments";

export const SearchHint: React.FC = () => (
  <Tooltip text='Add " to the end to include all words, or paste in a Stash ID'>
    <div className="SearchHint">
      <Icon icon={faCircleQuestion} color="black" />
    </div>
  </Tooltip>
);
