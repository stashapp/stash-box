import { FC } from "react";
import { useConfig } from "src/graphql";

interface Props {
  updatable: boolean;
  updateCount: number;
}

export const UpdateCount: FC<Props> = ({ updatable, updateCount }) => {
  const { data: config } = useConfig();

  const updateLimit = config?.getConfig.edit_update_limit;
  if (!updatable || !updateLimit) return null;

  const updates = updateLimit - updateCount;
  return (
    <small className="text-muted align-content-center me-3">
      Edit can be updated{" "}
      {updates === 1 ? "one more time" : `${updates} more times`}
    </small>
  );
};
