import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate, useRouter } from "@tanstack/react-router";
import type { FC } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { EditNote } from "src/components/form";

import {
  OperationEnum,
  type StudioFragment as Studio,
  useStudioEdit,
} from "src/graphql";
import * as yup from "yup";

const schema = yup.object({
  id: yup.string().required(),
  note: yup.string().required("An edit note is required."),
});
export type FormData = yup.Asserts<typeof schema>;

interface Props {
  studio: Studio;
}

const StudioDelete: FC<Props> = ({ studio }) => {
  const navigate = useNavigate();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });
  const [deleteStudioEdit, { loading: deleting }] = useStudioEdit({
    onCompleted: (data) => {
      if (data.studioEdit.id)
        navigate({ to: "/edits/$id", params: data.studioEdit });
    },
  });

  const handleDelete = (data: FormData) =>
    deleteStudioEdit({
      variables: {
        studioData: {
          edit: {
            operation: OperationEnum.DESTROY,
            id: data.id,
            comment: data.note,
          },
        },
      },
    });

  return (
    <Form className="StudioDeleteForm" onSubmit={handleSubmit(handleDelete)}>
      <Row>
        <h4>
          Delete studio <em>{studio.name}</em>
        </h4>
      </Row>
      <Form.Control type="hidden" value={studio.id} {...register("id")} />
      <Row className="my-4">
        <Col md={6}>
          <EditNote register={register} error={errors.note} />
          <div className="d-flex mt-2">
            <Button
              variant="danger"
              className="ms-auto me-2"
              onClick={() => router.history.go(-1)}
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

export default StudioDelete;
