import { uniq, uniqBy } from "lodash-es";
import type { MergeConflict } from "src/components/mergeConflicts";
import type { SceneFragment as Scene } from "src/graphql";
import { formatDuration } from "src/utils";
import type { SceneFormData } from "./schema";
import type { InitialScene } from "./types";

export type SceneMergeConflict = MergeConflict<keyof SceneFormData>;

const sceneLabel = (scene: Scene) =>
  [scene.title, scene.release_date, scene.studio?.name]
    .filter(Boolean)
    .join(" ") || scene.id;

type Scalar = string | number;

interface ScalarField {
  field: keyof SceneFormData;
  initialKey: keyof InitialScene;
  label: string;
  get: (scene: Scene) => Scalar | null | undefined;
}

const SCALAR_FIELDS: ScalarField[] = [
  { field: "title", initialKey: "title", label: "Title", get: (s) => s.title },
  {
    field: "details",
    initialKey: "details",
    label: "Details",
    get: (s) => s.details,
  },
  {
    field: "date",
    initialKey: "date",
    label: "Date",
    get: (s) => s.release_date,
  },
  {
    field: "production_date",
    initialKey: "production_date",
    label: "Production Date",
    get: (s) => s.production_date,
  },
  {
    field: "director",
    initialKey: "director",
    label: "Director",
    get: (s) => s.director,
  },
  {
    field: "code",
    initialKey: "code",
    label: "Studio Code",
    get: (s) => s.code,
  },
];

const isSet = (value: Scalar | null | undefined): value is Scalar =>
  value !== null && value !== undefined && value !== "";

// Builds the seed values and detected conflicts for merging the sources into
// the target. Empty target fields are filled from the first source that has a
// value; multi-value fields are combined; single-value fields that differ
// across scenes are returned as conflicts for the user to resolve.
export const buildSceneMerge = (
  target: Scene,
  sources: Scene[],
): { initial: InitialScene; conflicts: SceneMergeConflict[] } => {
  const all = [target, ...sources];
  const initial: InitialScene = {};
  const conflicts: SceneMergeConflict[] = [];

  for (const def of SCALAR_FIELDS) {
    const values = all.map(def.get);

    const merged = values.find(isSet);
    if (merged !== undefined) {
      (initial as Record<string, unknown>)[def.initialKey] = merged;
    }

    const distinct = uniq(values.filter(isSet));
    if (distinct.length > 1) {
      conflicts.push({
        field: def.field,
        label: def.label,
        currentKey: (value) => (value == null ? "" : String(value)),
        options: distinct.map((value) => ({
          key: String(value),
          value,
          display: String(value),
          sources: all
            .filter((scene) => def.get(scene) === value)
            .map(sceneLabel),
        })),
      });
    }
  }

  const durations = all
    .map((scene) => scene.duration)
    .filter((d): d is number => !!d);
  if (durations.length > 0) initial.duration = durations[0];

  const distinctDurations = uniq(durations);
  if (distinctDurations.length > 1) {
    conflicts.push({
      field: "duration",
      label: "Duration",
      currentKey: (value) => (value == null ? "" : String(value)),
      options: distinctDurations.map((duration) => ({
        key: formatDuration(duration),
        value: formatDuration(duration),
        display: formatDuration(duration),
        sources: all
          .filter((scene) => scene.duration === duration)
          .map(sceneLabel),
      })),
    });
  }

  const studios = all
    .map((scene) => scene.studio)
    .filter((s): s is NonNullable<Scene["studio"]> => s != null)
    .map(({ id, name }) => ({ id, name }));
  if (studios.length > 0) initial.studio = studios[0];

  const distinctStudioIds = uniq(studios.map((s) => s.id));
  if (distinctStudioIds.length > 1) {
    conflicts.push({
      field: "studio",
      label: "Studio",
      currentKey: (value) => (value as { id?: string } | null)?.id ?? "",
      options: distinctStudioIds.map((id) => {
        const studio = studios.find((s) => s.id === id) as {
          id: string;
          name: string;
        };
        return {
          key: id,
          value: { id: studio.id, name: studio.name },
          display: studio.name,
          sources: all
            .filter((scene) => scene.studio?.id === id)
            .map(sceneLabel),
        };
      }),
    });
  }

  initial.urls = uniqBy(
    all.flatMap((scene) => scene.urls),
    (url) => `${url.url}-${url.site.id}`,
  );
  initial.images = uniqBy(
    all.flatMap((scene) => scene.images),
    (image) => image.id,
  );
  initial.tags = uniqBy(
    all.flatMap((scene) => scene.tags),
    (tag) => tag.id,
  );
  initial.performers = uniqBy(
    all.flatMap((scene) => scene.performers),
    (performance) => performance.performer.id,
  );

  return { initial, conflicts };
};
