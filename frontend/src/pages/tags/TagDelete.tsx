import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { EditNote } from "src/components/form";

import {
  OperationEnum,
  type TagFragment as Tag,
  useTagEdit,
} from "src/graphql";
import { editHref } from "src/utils";
import * as yup from "yup";

const schema = yup.object({
  id: yup.string().required(),
  note: yup.string().required("An edit note is required."),
});
export type FormData = yup.Asserts<typeof schema>;

interface Props {
  tag: Tag;
}

const TagDelete: FC<Props> = ({ tag }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });
  const [deleteTagEdit, { loading: deleting }] = useTagEdit({
    onCompleted: (data) => {
      if (data.tagEdit.id) navigate(editHref(data.tagEdit));
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

  return (
    <Form className="TagDeleteForm" onSubmit={handleSubmit(handleDelete)}>
      <Row>
        <h4>
          Delete tag <em>{tag.name}</em>
        </h4>
      </Row>
      <Form.Control type="hidden" value={tag.id} {...register("id")} />
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

export default TagDelete;
