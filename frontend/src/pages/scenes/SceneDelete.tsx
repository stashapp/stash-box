import React from "react";
import { useHistory, useParams } from "react-router-dom";
import { Button, Col, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { OperationEnum, useScene, useSceneEdit } from "src/graphql";
import { EditNote } from "src/components/form";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { editHref } from "src/utils";

const schema = yup.object({
  id: yup.string().required(),
  note: yup.string().required("An edit note is required."),
});
export type FormData = yup.Asserts<typeof schema>;

const SceneDelete: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id?: string }>();
  const { data: scene, loading: loadingScene } = useScene(
    { id: id ?? "" },
    !id
  );
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

  if (!id) return <ErrorMessage error="Scene ID is missing" />;
  if (loadingScene) return <LoadingIndicator message="Loading scene..." />;
  if (!scene) return <ErrorMessage error="Scene not found." />;

  return (
    <>
      <Form className="SceneDeleteForm" onSubmit={handleSubmit(handleDelete)}>
        <Form.Row>
          <h4>
            Delete scene{" "}
            <em>{scene.findScene?.title ?? scene.findScene?.id}</em>
          </h4>
        </Form.Row>
        <Form.Control type="hidden" value={id} {...register("id")} />
        <Form.Row className="my-4">
          <Col md={6}>
            <EditNote register={register} error={errors.note} />
          </Col>
        </Form.Row>
        <Form.Row className="mt-2">
          <Button
            variant="danger"
            className="ml-auto mr-2"
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
        </Form.Row>
      </Form>
    </>
  );
};

export default SceneDelete;
