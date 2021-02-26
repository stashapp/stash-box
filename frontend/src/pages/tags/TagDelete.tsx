import React from "react";
import { useHistory, useParams } from "react-router-dom";
import { Button, Col, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { useTagEdit, useTag, OperationEnum } from "src/graphql";
import { EditNote } from "src/components/form";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { editHref } from "src/utils";

const schema = yup.object().shape({
  id: yup.string().required(),
  note: yup.string().required("An edit note is required."),
});
export type FormData = yup.Asserts<typeof schema>;

const TagDelete: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id?: string }>();
  const { data: tag, loading: loadingTag } = useTag({ id: id ?? "" }, !id);
  const { register, handleSubmit, errors } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });
  const [deleteTagEdit, { loading: deleting }] = useTagEdit({
    onCompleted: (data) => {
      if (data.tagEdit.id) history.push(editHref(data.tagEdit));
    },
  });

  const handleDelete = (data: FormData) =>
    deleteTagEdit({
      variables: {
        tagData: {
          edit: {
            operation: OperationEnum.DESTROY,
            id: data.id,
            comment: data.note,
          },
        },
      },
    });

  if (!id) return <ErrorMessage error="Tag ID is missing" />;
  if (loadingTag) return <LoadingIndicator message="Loading tag..." />;
  if (!tag) return <ErrorMessage error="Tag not found." />;

  return (
    <>
      <Form className="TagDeleteForm" onSubmit={handleSubmit(handleDelete)}>
        <Form.Row>
          <h4>
            Delete tag <em>{tag.findTag?.name}</em>
          </h4>
        </Form.Row>
        <Form.Control type="hidden" name="id" value={id} ref={register} />
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

export default TagDelete;
