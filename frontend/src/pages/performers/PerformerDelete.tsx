import React from "react";
import { useHistory, useParams } from "react-router-dom";
import { Button, Col, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { usePerformerEdit, usePerformer, OperationEnum } from "src/graphql";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { EditNote } from "src/components/form";
import { editHref } from "src/utils";

const schema = yup.object({
  id: yup.string().required(),
  note: yup.string().required("An edit note is required."),
});
export type FormData = yup.Asserts<typeof schema>;

const PerformerDelete: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id?: string }>();
  const { data: performer, loading: loadingPerformer } = usePerformer(
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
  const [deletePerformerEdit, { loading: deleting }] = usePerformerEdit({
    onCompleted: (data) => {
      if (data.performerEdit.id) history.push(editHref(data.performerEdit));
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

  if (!id) return <ErrorMessage error="Performer ID is missing" />;
  if (loadingPerformer)
    return <LoadingIndicator message="Loading performer..." />;
  if (!performer) return <ErrorMessage error="Performer not found." />;

  return (
    <>
      <Form
        className="PerformerDeleteForm"
        onSubmit={handleSubmit(handleDelete)}
      >
        <Form.Row>
          <h4>
            Delete performer <em>{performer.findPerformer?.name}</em>
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

export default PerformerDelete;
