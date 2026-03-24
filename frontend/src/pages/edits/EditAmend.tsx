import { type FC, useState } from "react";
import { Button, Form, Card } from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";

import { useEdit, useAmendEdit } from "src/graphql";
import type { AmendItemRemoval } from "src/graphql";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";
import { EditOperationTypes, EditTargetTypes, ROUTE_EDIT } from "src/constants";
import { getEditTargetName, getEditDetailsName, createHref } from "src/utils";
import { OperationEnum } from "src/graphql";
import {
  AmendableModifyEdit,
  AmendmentProvider,
  useAmendment,
} from "src/components/amendableEditCard";

interface EditAmendFormProps {
  edit: NonNullable<
    NonNullable<ReturnType<typeof useEdit>["data"]>["findEdit"]
  >;
}

const EditAmendForm: FC<EditAmendFormProps> = ({ edit }) => {
  const navigate = useNavigate();
  const [amendEdit, { loading: amending }] = useAmendEdit();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { state, hasChanges } = useAmendment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!edit?.id || !reason.trim() || !hasChanges) return;

    setError(null);

    const removeFieldsArray = Array.from(state.removedFields);

    const removeAddedItemsArray: AmendItemRemoval[] = [];
    state.removedAddedItems.forEach((indices, field) => {
      if (indices.size > 0) {
        removeAddedItemsArray.push({
          field,
          indices: Array.from(indices),
        });
      }
    });

    const removeRemovedItemsArray: AmendItemRemoval[] = [];
    state.removedRemovedItems.forEach((indices, field) => {
      if (indices.size > 0) {
        removeRemovedItemsArray.push({
          field,
          indices: Array.from(indices),
        });
      }
    });

    try {
      await amendEdit({
        variables: {
          input: {
            id: edit.id,
            reason: reason.trim(),
            remove_fields: removeFieldsArray,
            remove_added_items: removeAddedItemsArray,
            remove_removed_items: removeRemovedItemsArray,
          },
        },
      });
      navigate(createHref(ROUTE_EDIT, { id: edit.id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to amend edit");
    }
  };

  const targetName =
    edit.operation === OperationEnum.CREATE
      ? getEditDetailsName(edit.details)
      : getEditTargetName(edit.target);

  return (
    <div>
      <Title
        page={`Amend ${EditOperationTypes[edit.operation]} ${EditTargetTypes[edit.target_type]}${targetName && targetName !== "-" ? ` "${targetName}"` : ""}`}
      />
      <h3>
        Amend Edit: {EditOperationTypes[edit.operation]}{" "}
        {EditTargetTypes[edit.target_type]}
        {targetName && targetName !== "-" && ` - ${targetName}`}
      </h3>
      <p className="text-muted">
        Click the X button next to any field or item to mark it for removal from
        this edit. Removed changes will appear dimmed.
      </p>

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>
            <strong>Edit Details</strong>
            <span className="text-muted ms-2">
              (submitted by {edit.user?.name ?? "Unknown"})
            </span>
          </Card.Header>
          <Card.Body>
            <AmendableModifyEdit
              details={edit.details}
              oldDetails={edit.old_details}
              options={edit.options}
            />
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header>
            <strong>Amendment Reason</strong>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why these fields are being removed from the edit..."
                required
                disabled={amending}
              />
            </Form.Group>
            {error && <div className="text-danger mt-3">{error}</div>}
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end gap-2">
          <Link to={createHref(ROUTE_EDIT, edit)}>
            <Button variant="secondary" disabled={amending}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={!reason.trim() || !hasChanges || amending}
          >
            Amend Edit
          </Button>
        </div>
      </Form>
    </div>
  );
};

const EditAmend: FC = () => {
  const { id } = useParams();
  const { data, loading } = useEdit({ id: id ?? "" }, !id);

  if (loading) return <LoadingIndicator message="Loading..." />;

  const edit = data?.findEdit;
  if (!edit) return <ErrorMessage error="Failed to load edit." />;

  if (!edit.closed) {
    return <ErrorMessage error="Only closed edits can be amended." />;
  }

  return (
    <AmendmentProvider>
      <EditAmendForm edit={edit} />
    </AmendmentProvider>
  );
};

export default EditAmend;
