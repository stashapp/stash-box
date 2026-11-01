import { Link } from "@tanstack/react-router";
import type React from "react";
import { useState } from "react";
import { Button, Card } from "react-bootstrap";

import DragList from "src/components/dragList";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import {
  type ImageTypeEnum,
  type ImageTypeGroupEnum,
  type ImageTypeGroupsQuery,
  useImageTypeGroups,
  useUpdateImageTypePreferences,
} from "src/graphql";
import { errorMessage } from "src/utils";

interface Props {
  user: {
    id: string;
    name: string;
    image_type_preferences: ImageTypeEnum[];
    image_type_group_preferences: ImageTypeGroupEnum[];
  };
}

type PreferenceGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

/**
 * Sorts by a user's stated order, with anything they did not mention trailing
 * in the order it arrived. That is exactly how the server resolves a partial
 * preference so what is shown is what is applied
 */
const byPreference = <T, K>(items: T[], keyOf: (item: T) => K, order: K[]) => {
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...items].sort((a, b) => {
    const rankA = rank.get(keyOf(a));
    const rankB = rank.get(keyOf(b));
    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;
    return 0;
  });
};

interface PreferencesProps extends Props {
  initialGroups: PreferenceGroup[];
}

const UserImageTypePreferencesForm: React.FC<PreferencesProps> = ({
  user,
  initialGroups,
}) => {
  const [updatePreferences, { loading: saving }] =
    useUpdateImageTypePreferences();

  const [groups, setGroups] = useState(() =>
    byPreference(
      initialGroups.map((group) => ({
        ...group,
        types: byPreference(
          group.types,
          (type) => type.key,
          user.image_type_preferences,
        ),
      })),
      (group) => group.key,
      user.image_type_group_preferences,
    ),
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();

  const reorderTypes = (
    groupKey: ImageTypeGroupEnum,
    types: PreferenceGroup["types"],
  ) => {
    setSaved(false);
    setGroups((current) =>
      current.map((group) =>
        group.key === groupKey ? { ...group, types } : group,
      ),
    );
  };

  const submit = (input: {
    types: ImageTypeEnum[];
    groups: ImageTypeGroupEnum[];
  }) => {
    setError(undefined);
    setSaved(false);
    updatePreferences({
      variables: { input },
      update(cache, { data }) {
        if (!data?.updateImageTypePreferences) return;
        cache.modify({
          id: cache.identify({ __typename: "User", id: user.id }),
          fields: {
            image_type_preferences: () => input.types,
            image_type_group_preferences: () => input.groups,
          },
        });
      },
    })
      .then(({ data }) => {
        if (!data?.updateImageTypePreferences) {
          throw new Error("Failed to save image preferences.");
        }
        if (input.types.length === 0 && input.groups.length === 0) {
          setGroups(initialGroups);
        }
        setSaved(true);
      })
      .catch((e: unknown) => setError(errorMessage(e)));
  };

  const save = () =>
    submit({
      types: groups.flatMap((group) => group.types.map((type) => type.key)),
      groups: groups.map((group) => group.key),
    });

  const clear = () => submit({ types: [], groups: [] });

  return (
    <>
      <Link to="/users/$name" params={user}>
        <h6 className="mb-4">&larr; {user.name}</h6>
      </Link>
      <h4>Image preferences</h4>
      <hr />
      <p className="text-muted">
        Sets which of an entity&apos;s images you see first, including through
        the API. Whatever you put at the top wins: the dimensions are compared
        from the top down, and within each one its values are. Drag by the
        handles to reorder, or focus a handle and use the arrow keys.
      </p>

      {error && <div className="text-danger mb-2">Error: {error}</div>}
      {saved && <div className="text-success mb-2">Preferences saved.</div>}

      <DragList
        className="is-block"
        items={groups}
        keyOf={(group) => group.key}
        labelOf={(group) => `the ${group.name} group`}
        onReorder={(next) => {
          setSaved(false);
          setGroups(next);
        }}
      >
        {(group) => (
          <Card className="mb-3">
            <Card.Header>
              <b>{group.name}</b>
              {group.description && (
                <small className="text-muted ms-2">{group.description}</small>
              )}
            </Card.Header>
            <Card.Body>
              <DragList
                items={group.types}
                keyOf={(type) => type.key}
                labelOf={(type) => type.name}
                onReorder={(types) => reorderTypes(group.key, types)}
              >
                {(type) => (
                  <>
                    <span>{type.name}</span>
                    {type.description && (
                      <small className="text-muted">{type.description}</small>
                    )}
                  </>
                )}
              </DragList>
            </Card.Body>
          </Card>
        )}
      </DragList>

      <div className="mt-4">
        <Button onClick={clear} disabled={saving} className="me-2">
          Use site default
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </>
  );
};

export const UserImageTypePreferences: React.FC<Props> = ({ user }) => {
  const { loading, data, error } = useImageTypeGroups({});

  if (loading) {
    return <LoadingIndicator message="Loading image types..." />;
  }

  if (!data) {
    return (
      <ErrorMessage
        error={error ? errorMessage(error) : "Failed to load image types."}
      />
    );
  }

  return (
    <UserImageTypePreferencesForm
      key={user.id}
      user={user}
      initialGroups={data.imageTypeGroups}
    />
  );
};
