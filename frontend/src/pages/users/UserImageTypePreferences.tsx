import { type FC, useEffect, useState } from "react";
import { Button, Card } from "react-bootstrap";

import { DragList } from "src/components/dragList";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import {
  type ImageTypeEnum,
  type ImageTypeGroupEnum,
  useImageTypeGroups,
  useUpdateImageTypePreferences,
} from "src/graphql";

interface Props {
  user: {
    id: string;
    image_type_preferences: ImageTypeEnum[];
    image_type_group_preferences: ImageTypeGroupEnum[];
  };
}

type PreferenceGroup = {
  key: ImageTypeGroupEnum;
  name: string;
  description?: string | null;
  types: { key: ImageTypeEnum; name: string; description?: string | null }[];
};

/**
 * Sorts by a user's stated order, with anything they did not mention trailing
 * in the order it arrived. That is exactly how the server resolves a partial
 * preference, so what is shown is what is applied.
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

/**
 * Orders the image type vocabulary for this user alone: both which dimension
 * is compared first and which values lead within it
 *
 * Group order is the stronger of the two: it decides which dimension wins,
 * where type order only breaks ties inside one, so a preference confined to
 * types could not express itself at all when the dimension someone cared about
 * was compared last
 */
export const UserImageTypePreferences: FC<Props> = ({ user }) => {
  const { loading, data } = useImageTypeGroups({});
  const [updatePreferences, { loading: saving }] =
    useUpdateImageTypePreferences();

  const [groups, setGroups] = useState<PreferenceGroup[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!data?.imageTypeGroups) return;

    setGroups(
      byPreference(
        data.imageTypeGroups.map((group) => ({
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
  }, [data, user.image_type_preferences, user.image_type_group_preferences]);

  if (loading) return <LoadingIndicator message="Loading image types..." />;

  const reorderGroup = (
    groupIndex: number,
    types: PreferenceGroup["types"],
  ) => {
    setSaved(false);
    setGroups((current) =>
      current.map((group, i) =>
        i === groupIndex ? { ...group, types } : group,
      ),
    );
  };

  const submit = (input: {
    types: ImageTypeEnum[];
    groups: ImageTypeGroupEnum[];
  }) => {
    setError(undefined);
    updatePreferences({ variables: { input } })
      .then(() => setSaved(true))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      );
  };

  const save = () =>
    submit({
      types: groups.flatMap((group) => group.types.map((type) => type.key)),
      groups: groups.map((group) => group.key),
    });

  const clear = () => submit({ types: [], groups: [] });

  return (
    <>
      <h4>Image preferences</h4>
      <hr />
      <p className="text-muted">
        Sets which of an entity&apos;s images you see first, including through
        the API. Whatever you put at the top wins: the dimensions are compared
        from the top down, and within each one its values are. Drag by the
        handles to reorder, or focus a handle and use the arrow keys.
      </p>

      {error && <ErrorMessage error={error} />}
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
                onReorder={(types) =>
                  reorderGroup(
                    groups.findIndex((g) => g.key === group.key),
                    types,
                  )
                }
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
        <Button variant="secondary" onClick={clear} className="me-2">
          Use site default
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </>
  );
};
