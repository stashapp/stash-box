import { FC } from "react";
import { Badge, BadgeProps } from "react-bootstrap";

import { VoteStatusEnum } from "src/graphql";
import { EditStatusTypes } from "src/constants/enums";
import { Tooltip } from "src/components/fragments";

interface Props {
  status: VoteStatusEnum;
}

const EditStatus: FC<Props> = ({ status }) => {
  let editVariant: BadgeProps["bg"] = "warning";
  if (
    status === VoteStatusEnum.REJECTED ||
    status === VoteStatusEnum.IMMEDIATE_REJECTED ||
    status === VoteStatusEnum.FAILED ||
    status === VoteStatusEnum.CANCELED
  )
    editVariant = "danger";
  else if (
    status === VoteStatusEnum.ACCEPTED ||
    status === VoteStatusEnum.IMMEDIATE_ACCEPTED
  )
    editVariant = "success";

  let tooltip = "";
  switch (status) {
    case VoteStatusEnum.REJECTED:
    tooltip = "Edit did not get sufficient votes to pass.";
    break;
    case VoteStatusEnum.CANCELED:
    tooltip = "Edit was cancelled by the editor.";
    break;
    case VoteStatusEnum.IMMEDIATE_REJECTED:
    tooltip = "Edit was cancelled by an admin.";
    break;
    case VoteStatusEnum.FAILED:
    tooltip = "Edit application failed due to an error. See edit note for more details.";
    break;
  }

  return (
    <Tooltip text={tooltip}>
      <Badge className="text-uppercase" bg={editVariant}>
        {EditStatusTypes[status]}
      </Badge>
    </Tooltip>
  );

}

export default EditStatus;
