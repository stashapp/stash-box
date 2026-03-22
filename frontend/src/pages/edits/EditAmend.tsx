import { type FC, useState, useCallback } from "react";
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
  type AmendmentState,
  type AmendableEditCallbacks,
} from "src/components/amendableEditCard";

const EditAmend: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useEdit({ id: id ?? "" }, !id);
  const [amendEdit, { loading: amending }] = useAmendEdit();

  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // State for tracking which fields/items are marked for removal
  const [removedFields, setRemovedFields] = useState<Set<string>>(new Set());
  const [removedAddedItems, setRemovedAddedItems] = useState<
    Map<string, Set<number>>
  >(new Map());
  const [removedRemovedItems, setRemovedRemovedItems] = useState<
    Map<string, Set<number>>
  >(new Map());

  const handleRemoveField = useCallback((field: string) => {
    setRemovedFields((prev) => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }, []);

  const handleRemoveAddedItem = useCallback((field: string, index: number) => {
    setRemovedAddedItems((prev) => {
      const next = new Map(prev);
      const indices = next.get(field) ?? new Set<number>();
      indices.add(index);
      next.set(field, indices);
      return next;
    });
  }, []);

  const handleRemoveRemovedItem = useCallback(
    (field: string, index: number) => {
      setRemovedRemovedItems((prev) => {
        const next = new Map(prev);
        const indices = next.get(field) ?? new Set<number>();
        indices.add(index);
        next.set(field, indices);
        return next;
      });
    },
    [],
  );

  const handleRestoreField = useCallback((field: string) => {
    setRemovedFields((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  const handleRestoreAddedItem = useCallback((field: string, index: number) => {
    setRemovedAddedItems((prev) => {
      const next = new Map(prev);
      const indices = next.get(field);
      if (indices) {
        indices.delete(index);
        if (indices.size === 0) {
          next.delete(field);
        } else {
          next.set(field, indices);
        }
      }
      return next;
    });
  }, []);

  const handleRestoreRemovedItem = useCallback(
    (field: string, index: number) => {
      setRemovedRemovedItems((prev) => {
        const next = new Map(prev);
        const indices = next.get(field);
        if (indices) {
          indices.delete(index);
          if (indices.size === 0) {
            next.delete(field);
          } else {
            next.set(field, indices);
          }
        }
        return next;
      });
    },
    [],
  );

  const hasChanges =
    removedFields.size > 0 ||
    Array.from(removedAddedItems.values()).some((s) => s.size > 0) ||
    Array.from(removedRemovedItems.values()).some((s) => s.size > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !reason.trim() || !hasChanges) return;

    setError(null);

    // Convert state to input format
    const removeFieldsArray = Array.from(removedFields);

    const removeAddedItemsArray: AmendItemRemoval[] = [];
    removedAddedItems.forEach((indices, field) => {
      if (indices.size > 0) {
        removeAddedItemsArray.push({
          field,
          indices: Array.from(indices),
        });
      }
    });

    const removeRemovedItemsArray: AmendItemRemoval[] = [];
    removedRemovedItems.forEach((indices, field) => {
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
            id,
            reason: reason.trim(),
            remove_fields:
              removeFieldsArray.length > 0 ? removeFieldsArray : undefined,
            remove_added_items:
              removeAddedItemsArray.length > 0
                ? removeAddedItemsArray
                : undefined,
            remove_removed_items:
              removeRemovedItemsArray.length > 0
                ? removeRemovedItemsArray
                : undefined,
          },
        },
      });
      navigate(createHref(ROUTE_EDIT, { id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to amend edit");
    }
  };

  if (loading) return <LoadingIndicator message="Loading..." />;

  const edit = data?.findEdit;
  if (!edit) return <ErrorMessage error="Failed to load edit." />;

  if (!edit.closed) {
    return <ErrorMessage error="Only closed edits can be amended." />;
  }

  const targetName =
    edit.operation === OperationEnum.CREATE
      ? getEditDetailsName(edit.details)
      : getEditTargetName(edit.target);

  const amendmentState: AmendmentState = {
    removedFields,
    removedAddedItems,
    removedRemovedItems,
  };

  const callbacks: AmendableEditCallbacks = {
    onRemoveField: handleRemoveField,
    onRemoveAddedItem: handleRemoveAddedItem,
    onRemoveRemovedItem: handleRemoveRemovedItem,
    onRestoreField: handleRestoreField,
    onRestoreAddedItem: handleRestoreAddedItem,
    onRestoreRemovedItem: handleRestoreRemovedItem,
  };

  return (
    <div>
      <Title
        page={`Amend ${EditOperationTypes[edit.operation]} ${EditTargetTypes[edit.target_type]} "${targetName}"`}
      />
      <h3>
        Amend Edit: {EditOperationTypes[edit.operation]}{" "}
        {EditTargetTypes[edit.target_type]} - {targetName}
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
              state={amendmentState}
              callbacks={callbacks}
            />
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header>
            <strong>Amendment Reason</strong>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Label>Reason for amendment (required):</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why these fields/items are being removed from the edit..."
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
            variant="warning"
            disabled={!reason.trim() || !hasChanges || amending}
          >
            {amending ? "Amending..." : "Amend Edit"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EditAmend;
