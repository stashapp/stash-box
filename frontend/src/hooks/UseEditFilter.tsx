import React, { useState } from 'react';
import { Form } from 'react-bootstrap';

import { OperationEnum, TargetTypeEnum, VoteStatusEnum } from 'src/definitions/globalTypes';

interface EditFilterProps {
  type?: TargetTypeEnum;
  defaultType?: TargetTypeEnum;
  status?: VoteStatusEnum;
  defaultStatus?: VoteStatusEnum;
  operation?: OperationEnum;
  defaultOperation?: OperationEnum;
}

const useEditFilter = ({ type, status, defaultType, defaultStatus, operation, defaultOperation }: EditFilterProps) => {
  const [selectedStatus, setSelectedStatus] = useState<VoteStatusEnum|undefined>(status ?? defaultStatus);
  const [selectedType, setSelectedType] = useState<TargetTypeEnum|undefined>(type ?? defaultType);
  const [selectedOperation, setSelectedOperation] = useState<OperationEnum|undefined>(operation ?? defaultOperation);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => (
    setSelectedType((e.currentTarget.value === "" ? undefined : e.currentTarget.value) as TargetTypeEnum)
  );

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => (
    setSelectedStatus((e.currentTarget.value === "" ? undefined : e.currentTarget.value) as VoteStatusEnum)
  );

  const handleOperationChange = (e: React.ChangeEvent<HTMLSelectElement>) => (
    setSelectedOperation((e.currentTarget.value === "" ? undefined : e.currentTarget.value) as OperationEnum)
  );

  const enumToOptions = (e: Object) => (
    Object.keys(e).map((val) => <option key={val} value={val}>{val}</option>)
  )

  const editFilter = (
    <Form className="row align-items-center font-weight-bold mx-0">
      <div className="col-4 d-flex align-items-center">
        <Form.Label className="mr-4">Type</Form.Label>
        <Form.Control as="select" onChange={handleTypeChange} value={selectedType} disabled={!!type}>
          <option value="" key="all-targets">All</option>
          { enumToOptions(TargetTypeEnum) }
        </Form.Control>
      </div>
      <div className="col-4 d-flex align-items-center">
        <Form.Label className="mr-4">Status</Form.Label>
        <Form.Control as="select" onChange={handleStatusChange} value={selectedStatus} disabled={!!status}>
          <option value="" key="all-statuses">All</option>
          { enumToOptions(VoteStatusEnum) }
        </Form.Control>
      </div>
      <div className="col-4 d-flex align-items-center">
        <Form.Label className="mr-4">Operation</Form.Label>
        <Form.Control as="select" onChange={handleOperationChange} value={selectedOperation} disabled={!!operation}>
          <option value="" key="all-operations">All</option>
          { enumToOptions(OperationEnum) }
        </Form.Control>
      </div>
    </Form>
  )

  return { editFilter, selectedType, selectedStatus, selectedOperation };
};

export default useEditFilter;
