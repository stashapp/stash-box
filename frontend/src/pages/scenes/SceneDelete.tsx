import { FC } from "react";
import { useHistory } from "react-router-dom";
import { Button, Col, Row, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  OperationEnum,
  useSceneEdit,
  SceneFragment as Scene,
} from "src/graphql";
import { EditNote } from "src/components/form";
import { editHref } from "src/utils";

const schema = yup.object({
  id: yup.string().required(),
  note: yup.string().required("An edit note is required."),
});
export type FormData = yup.Asserts<typeof schema>;

interface Props {
  scene: Scene;
}

const SceneDelete: FC<Props> = ({ scene }) => {
  const history = useHistory();
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
      if (data.sceneEdit.id) history.push(editHref(data.sceneEdit));
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
              onClick={() => history.goBack()}
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
