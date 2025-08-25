import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  usePerformerEdit,
  OperationEnum,
  type FullPerformerQuery,
} from "src/graphql";
import { EditNote } from "src/components/form";
import { editHref } from "src/utils";

type Performer = NonNullable<FullPerformerQuery["findPerformer"]>;

const schema = yup.object({
  id: yup.string().required(),
  note: yup.string().required("An edit note is required."),
});
export type FormData = yup.Asserts<typeof schema>;

interface Props {
  performer: Performer;
}

const PerformerDelete: FC<Props> = ({ performer }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });
  const [deletePerformerEdit, { loading: deleting }] = usePerformerEdit({
    onCompleted: (data) => {
      if (data.performerEdit.id) navigate(editHref(data.performerEdit));
    },
  });

  const handleDelete = (data: FormData) =>
    deletePerformerEdit({
      variables: {
        performerData: {
          edit: {
            operation: OperationEnum.DESTROY,
            id: data.id,
            comment: data.note,
          },
        },
      },
    });

  return (
    <Form className="PerformerDeleteForm" onSubmit={handleSubmit(handleDelete)}>
      <Row>
        <h4>
          Delete performer <em>{performer.name}</em>
        </h4>
      </Row>
      <Form.Control type="hidden" value={performer.id} {...register("id")} />
      <Row className="my-4">
        <Col md={6}>
          <EditNote register={register} error={errors.note} />
          <div className="d-flex mt-2">
            <Button
              variant="danger"
              className="ms-auto me-2"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled
              className="d-none"
              aria-hidden="true"
            />
            <Button type="submit" disabled={deleting}>
              Submit Edit
            </Button>
          </div>
        </Col>
      </Row>
    </Form>
  );
};

export default PerformerDelete;
