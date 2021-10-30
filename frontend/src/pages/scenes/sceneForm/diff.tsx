import { SceneDetails as SceneDet } from "src/components/editCard/ModifyEdit";

import { SceneFragment } from "src/graphql";
import { genderEnum, parseDuration } from "src/utils";

import { CastedSceneFormData } from "./SceneForm";

const diffArray = <T extends unknown>(
  a: T[],
  b: T[],
  getKey: (t: T) => string
) => [
  a.filter((x) => !b.some((val) => getKey(val) === getKey(x))),
  b.filter((x) => !a.some((val) => getKey(val) === getKey(x))),
];

const diffValue = <T extends unknown>(
  a: T | undefined | null,
  b: T | undefined | null
): T | null => (a && a !== b ? a : null);

const selectSceneDetails = (
  data: CastedSceneFormData,
  original: SceneFragment
): [SceneDet, SceneDet] => {
  const [addedPerformers, removedPerformers] = diffArray(
    (data.performers ?? []).flatMap((p) =>
      p.performerId && p.name
        ? [
            {
              performer: {
                id: p.performerId,
                name: p.name,
                gender: genderEnum(p.gender),
                disambiguation: p.disambiguation ?? null,
                deleted: false,
              },
              as: p.alias ?? null,
            },
          ]
        : []
    ),
    original.performers,
    (s) => `${s.performer.id}${s.as}`
  );

  const [addedTags, removedTags] = diffArray(
    (data.tags ?? []).flatMap((t) =>
      t.id && t.name
        ? [
            {
              id: t.id,
              name: t.name,
            },
          ]
        : []
    ),
    original.tags,
    (t) => t.id
  );

  const [addedImages, removedImages] = diffArray(
    (data.images ?? []).flatMap((i) =>
      i.id && i.url
        ? [
            {
              id: i.id,
              url: i.url,
            },
          ]
        : []
    ),
    original.images,
    (i) => i.id
  );

  const [addedUrls, removedUrls] = diffArray(
    data.studioURL
      ? [
          {
            url: data.studioURL,
            type: "STUDIO",
          },
        ]
      : [],
    original.urls.map((u) => ({
      url: u.url,
      type: u.type,
    })),
    (u) => `${u.url}${u.type}`
  );

  return [
    {
      title: diffValue(original.title, data.title),
      details: diffValue(original.details, data.details),
      date: diffValue(original.date, data.date),
      duration: diffValue(original.duration, parseDuration(data.duration)),
      director: diffValue(original.director, data.director),
      studio:
        original.studio?.id !== data.studio?.id &&
        original.studio?.id &&
        original.studio.name
          ? {
              id: original.studio.id,
              name: original.studio.name,
            }
          : null,
    },
    {
      title: diffValue(data.title, original.title),
      details: diffValue(data.details, original.details),
      date: diffValue(data.date, original.date),
      duration: diffValue(parseDuration(data.duration), original.duration),
      director: diffValue(data.director, original.director),
      studio:
        data.studio?.id !== original.studio?.id &&
        data.studio?.id &&
        data.studio?.name
          ? {
              id: data.studio.id,
              name: data.studio.name,
            }
          : null,
      added_urls: addedUrls,
      removed_urls: removedUrls,
      added_performers: addedPerformers,
      removed_performers: removedPerformers,
      added_tags: addedTags,
      removed_tags: removedTags,
      added_images: addedImages,
      removed_images: removedImages,
    },
  ];
};

export default selectSceneDetails;
