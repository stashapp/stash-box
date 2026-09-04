import cx from "classnames";
import { type FC, useEffect, useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { DragList } from "src/components/dragList";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Modal from "src/components/modal";
import Title from "src/components/title";
import {
  type ImageTypeEnum,
  type ImageTypeGroupEnum,
  useImageTypeGroups,
  useSetImageTypeEnabled,
  useUpdateImageTypeOrder,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";

const CLASSNAME = "ImageTypeOrder";

interface OrderedGroup {
  key: ImageTypeGroupEnum;
  name: string;
  description?: string | null;
  enabled: boolean;
  types: {
    key: ImageTypeEnum;
    name: string;
    description?: string | null;
    enabled: boolean;
  }[];
}

const ImageTypeOrder: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { loading, data } = useImageTypeGroups({ includeDisabled: true });
  const [updateOrder, { loading: savingOrder }] = useUpdateImageTypeOrder();
  const [setEnabled, { loading: savingEnabled }] = useSetImageTypeEnabled();
  const saving = savingOrder || savingEnabled;

  const [groups, setGroups] = useState<OrderedGroup[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (data?.imageTypeGroups) setGroups(data.imageTypeGroups);
  }, [data]);

  if (!isAdmin) return <ErrorMessage error="You do not have permission" />;
  if (loading) return <LoadingIndicator message="Loading image types..." />;

  const reorderGroups = (next: OrderedGroup[]) => {
    setSaved(false);
    setGroups(next);
  };

  const reorderTypes = (groupIndex: number, types: OrderedGroup["types"]) => {
    setSaved(false);
    setGroups((current) =>
      current.map((group, i) =>
        i === groupIndex ? { ...group, types } : group,
      ),
    );
  };

  const toggleGroup = (key: ImageTypeGroupEnum) => {
    setSaved(false);
    setGroups((current) =>
      current.map((group) =>
        group.key === key ? { ...group, enabled: !group.enabled } : group,
      ),
    );
  };

  const toggleType = (key: ImageTypeEnum) => {
    setSaved(false);
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        types: group.types.map((type) =>
          type.key === key ? { ...type, enabled: !type.enabled } : type,
        ),
      })),
    );
  };

  const save = () => {
    setConfirming(false);
    setError(undefined);

    updateOrder({
      variables: {
        input: {
          // Both lists go complete: a partial ordering is rejected rather than
          // merged so an admin cannot half-apply a reordering
          groups: groups.map((group) => group.key),
          types: groups.flatMap((group) => group.types.map((type) => type.key)),
        },
      },
    })
      .then(() =>
        setEnabled({
          variables: {
            input: {
              disabled_groups: groups
                .filter((group) => !group.enabled)
                .map((group) => group.key),
              disabled_types: groups.flatMap((group) =>
                group.types
                  .filter((type) => !type.enabled)
                  .map((type) => type.key),
              ),
            },
          },
        }),
      )
      .then(() => setSaved(true))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      );
  };

  return (
    <>
      <Title page="Image Types" />
      <div className="d-flex align-items-center mb-2">
        <h3 className="me-4">Image Types</h3>
        <Button
          onClick={() => setConfirming(true)}
          disabled={saving}
          className="ms-auto"
        >
          {saving ? "Saving..." : "Save Order"}
        </Button>
      </div>

      <p className="text-muted">
        Which of the vocabulary this instance uses, and which image ranks first{" "}
        <b>instance-wide</b>. Groups are compared in this order, and within a
        group its types are. Drag by the handles to reorder, or focus a handle
        and use the arrow keys. Users may reorder all of this for themselves:
        what you set here is the default they start from
      </p>
      <p className="text-muted">
        Switching something off hides it when labelling and drops it from
        ranking. <b>Nothing is deleted</b>: labels already applied are kept and
        come back if you switch it on again.
      </p>

      {error && <ErrorMessage error={error} />}
      {saved && <div className="text-success mb-2">Order saved.</div>}

      <div className={CLASSNAME}>
        <DragList
          className="is-block"
          items={groups}
          keyOf={(group) => group.key}
          labelOf={(group) => `the ${group.name} group`}
          onReorder={reorderGroups}
        >
          {(group) => (
            <Card className={cx("mb-3", { "is-disabled": !group.enabled })}>
              <Card.Header className="d-flex align-items-center">
                <b>{group.name}</b>
                {group.description && (
                  <small className="text-muted ms-2">{group.description}</small>
                )}
                <Form.Switch
                  className="ms-auto"
                  id={`enabled-${group.key}`}
                  label={group.enabled ? "In use" : "Off"}
                  checked={group.enabled}
                  onChange={() => toggleGroup(group.key)}
                />
              </Card.Header>
              <Card.Body>
                <DragList
                  items={group.types}
                  keyOf={(type) => type.key}
                  labelOf={(type) => type.name}
                  onReorder={(types) =>
                    reorderTypes(
                      groups.findIndex((g) => g.key === group.key),
                      types,
                    )
                  }
                >
                  {(type) => (
                    <>
                      <span
                        className={cx({
                          // A type inside a switched-off group is unusable
                          // whatever its own setting, so it reads as off
                          "text-muted": !type.enabled || !group.enabled,
                        })}
                      >
                        {type.name}
                      </span>
                      {type.description && (
                        <small className="text-muted">{type.description}</small>
                      )}
                      <Form.Switch
                        className="ms-auto"
                        id={`enabled-${type.key}`}
                        aria-label={`Use ${type.name}`}
                        checked={type.enabled}
                        disabled={!group.enabled}
                        title={
                          group.enabled
                            ? undefined
                            : `${group.name} is switched off, so none of its types are in use`
                        }
                        onChange={() => toggleType(type.key)}
                      />
                    </>
                  )}
                </DragList>
              </Card.Body>
            </Card>
          )}
        </DragList>
      </div>

      {confirming && (
        <Modal
          acceptTerm="Save for everyone"
          cancelTerm="Cancel"
          callback={(confirmed) => (confirmed ? save() : setConfirming(false))}
        >
          <p>
            This changes the ranking for <b>every user on this instance</b>, not
            just you.
          </p>
          <p className="mb-0">
            To change only your own ordering, use <b>Image preferences</b> on
            your user page instead.
          </p>
        </Modal>
      )}
    </>
  );
};

export default ImageTypeOrder;
