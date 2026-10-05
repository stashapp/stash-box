import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { EditNote } from "src/components/form";

import {
  OperationEnum,
  type SceneFragment as Scene,
  useSceneEdit,
} from "src/graphql";
import { editHref } from "src/utils";
import * as yup from "yup";

const schema = yup.object({
  id: yup.string().required(),
  note: yup.string().required("An edit note is required."),
});
export type FormData = yup.Asserts<typeof schema>;

interface Props {
  scene: Scene;
}

const SceneDelete: FC<Props> = ({ scene }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });
  const [deleteSceneEdit, { loading: deleting }] = useSceneEdit({
    onCompleted: (data) => {
      if (data.sceneEdit.id) navigate(editHref(data.sceneEdit));
    },
  });

  const handleDelete = (data: FormData) =>
    deleteSceneEdit({
      variables: {
        sceneData: {
          edit: {
            operation: OperationEnum.DESTROY,
            id: data.id,
            comment: data.note,
          },
        },
      },
    });

  return (
    <Form className="SceneDeleteForm" onSubmit={handleSubmit(handleDelete)}>
      <Row>
        <h4>
          Delete scene <em>{scene.title}</em>
        </h4>
      </Row>
      <Form.Control type="hidden" value={scene.id} {...register("id")} />
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

export default SceneDelete;
