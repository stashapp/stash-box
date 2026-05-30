import type {
  OperationEnum,
  TargetTypeEnum,
  VoteStatusEnum,
  VoteTypeEnum,
} from "src/graphql";

export interface EditCardUser {
  id: string;
  name: string;
}

export interface EditCardTarget {
  __typename: string;
  id: string;
  name?: string;
  title?: string | null;
  disambiguation?: string | null;
  studio?: { id: string; name: string } | null;
}

export interface EditCardDetails {
  __typename: string;
  title?: string | null;
  studio?: { id: string; name: string } | null;
}

export interface EditCardVote {
  user?: EditCardUser | null;
  date: string;
  vote: VoteTypeEnum;
}

export interface EditCardEdit {
  id: string;
  operation: OperationEnum;
  target_type: TargetTypeEnum;
  status: VoteStatusEnum;
  applied: boolean;
  bot: boolean;
  destructive: boolean;
  created: string;
  updated?: string | null;
  closed?: string | null;
  expires?: string | null;
  update_count: number;
  vote_count: number;
  user?: EditCardUser | null;
  target?: EditCardTarget | null;
  merge_sources?: EditCardTarget[] | null;
  options?: { set_merge_aliases?: boolean | null } | null;
  details?: EditCardDetails | null;
  votes: EditCardVote[];
}
