import React from "react";

import { useStudio } from "src/graphql";
import ChangeRow from "src/components/changeRow";

interface StudioChangeRowProps {
  newStudioID?: string | null;
  oldStudioID?: string | null;
  name?: string;
  showDiff?: boolean;
}

const StudioChangeRow: React.FC<StudioChangeRowProps> = ({
  newStudioID,
  oldStudioID,
  name,
  showDiff = false,
}) => {
  const { data: newData } = useStudio({ id: newStudioID ?? "" }, !newStudioID);
  const { data: oldData } = useStudio({ id: oldStudioID ?? "" }, !oldStudioID);

  return (
    <ChangeRow
      name={name ?? "Studio"}
      oldValue={oldData?.findStudio?.name}
      newValue={newData?.findStudio?.name}
      showDiff={showDiff}
    />
  );
};

export default StudioChangeRow;
