import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { EditNote } from "src/components/form";
import {
  type GalleryFragment as Gallery,
  OperationEnum,
  useGalleryEdit,
} from "src/graphql";
import { editHref } from "src/utils";
import * as yup from "yup";

const schema = yup.object({
  note: yup.string().required("An edit note is required."),
});

const GalleryDelete: FC<{ gallery: Gallery }> = ({ gallery }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });
  const [destroy, { loading }] = useGalleryEdit({
    onCompleted: (data) => navigate(editHref(data.galleryEdit)),
  });

  return (
    <Form
      onSubmit={handleSubmit(({ note }) =>
        destroy({
          variables: {
            galleryData: {
              edit: {
                id: gallery.id,
                operation: OperationEnum.DESTROY,
                comment: note,
              },
            },
          },
        }),
      )}
    >
      <h4>
        Delete gallery <em>{gallery.title}</em>
      </h4>
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
            <Button type="submit" disabled={loading}>
              Submit Edit
            </Button>
          </div>
        </Col>
      </Row>
    </Form>
  );
};

export default GalleryDelete;
