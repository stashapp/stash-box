import { Link } from "@tanstack/react-router";
import { GenderIcon, PerformerName, TagLink } from "src/components/fragments";
import type { FingerprintAlgorithm, PerformerFragment } from "src/graphql";
import { formatDuration, tagHref } from "src/utils";

type Appearance = {
  performer: PerformerFragment;
  as: string;
};

export const renderPerformer = (appearance: {
  as?: string | null;
  performer: Pick<
    Appearance["performer"],
    "name" | "id" | "gender" | "disambiguation" | "deleted"
  >;
}) => (
  <Link
    key={appearance.performer.id}
    to="/performers/$id"
    params={appearance.performer}
  >
    <GenderIcon gender={appearance.performer.gender} />
    <PerformerName performer={appearance.performer} as={appearance.as} />
  </Link>
);

export const renderTag = (tag: {
  id: string;
  name: string;
  description?: string | null;
}) => (
  <TagLink title={tag.name} link={tagHref(tag)} description={tag.description} />
);

export const renderFingerprint = (fingerprint: {
  hash: string;
  duration: number;
  algorithm: FingerprintAlgorithm;
}) => (
  <>
    <Link to="/scenes" search={{ fingerprint: fingerprint.hash }}>
      {fingerprint.algorithm}: {fingerprint.hash}
    </Link>
    <span title={`${fingerprint.duration}s`}>
      {", duration: "}
      {formatDuration(fingerprint.duration)}
    </span>
  </>
);
