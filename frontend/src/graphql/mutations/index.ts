import { type MutationHookOptions, useMutation } from "@apollo/client/react";
import { isReference, type Reference } from "@apollo/client/utilities";

import MeGql from "../queries/Me.gql";
import {
  ActivateNewUserDocument,
  type ActivateNewUserMutation,
  type ActivateNewUserMutationVariables,
  AddImageDocument,
  type AddImageMutation,
  type AddImageMutationVariables,
  AddSceneDocument,
  type AddSceneMutation,
  type AddSceneMutationVariables,
  AddSiteDocument,
  type AddSiteMutation,
  type AddSiteMutationVariables,
  AddStudioDocument,
  type AddStudioMutation,
  type AddStudioMutationVariables,
  AddTagCategoryDocument,
  type AddTagCategoryMutation,
  type AddTagCategoryMutationVariables,
  AddUserDocument,
  type AddUserMutation,
  type AddUserMutationVariables,
  AmendEditDocument,
  type AmendEditMutation,
  type AmendEditMutationVariables,
  ApproveEditDocument,
  type ApproveEditMutation,
  type ApproveEditMutationVariables,
  CancelEditDocument,
  type CancelEditMutation,
  type CancelEditMutationVariables,
  ChangePasswordDocument,
  type ChangePasswordMutation,
  type ChangePasswordMutationVariables,
  ConfirmChangeEmailDocument,
  type ConfirmChangeEmailMutation,
  type ConfirmChangeEmailMutationVariables,
  DeleteDraftDocument,
  type DeleteDraftMutation,
  type DeleteDraftMutationVariables,
  DeleteEditDocument,
  type DeleteEditMutation,
  type DeleteEditMutationVariables,
  DeleteFingerprintSubmissionsDocument,
  type DeleteFingerprintSubmissionsMutation,
  type DeleteFingerprintSubmissionsMutationVariables,
  DeleteSceneDocument,
  type DeleteSceneMutation,
  type DeleteSceneMutationVariables,
  DeleteSiteDocument,
  type DeleteSiteMutation,
  type DeleteSiteMutationVariables,
  DeleteStudioDocument,
  type DeleteStudioMutation,
  type DeleteStudioMutationVariables,
  DeleteTagCategoryDocument,
  type DeleteTagCategoryMutation,
  type DeleteTagCategoryMutationVariables,
  DeleteUserDocument,
  type DeleteUserMutation,
  type DeleteUserMutationVariables,
  EditCommentDocument,
  type EditCommentMutation,
  type EditCommentMutationVariables,
  FavoritePerformerDocument,
  type FavoritePerformerMutation,
  type FavoritePerformerMutationVariables,
  FavoriteStudioDocument,
  type FavoriteStudioMutation,
  type FavoriteStudioMutationVariables,
  GenerateInviteCodesDocument,
  type GenerateInviteCodesMutation,
  type GenerateInviteCodesMutationVariables,
  GrantInviteDocument,
  type GrantInviteMutation,
  type GrantInviteMutationVariables,
  MarkNotificationReadDocument,
  type MarkNotificationReadMutationVariables,
  MarkNotificationsReadDocument,
  type MeQuery,
  MoveFingerprintSubmissionsDocument,
  type MoveFingerprintSubmissionsMutation,
  type MoveFingerprintSubmissionsMutationVariables,
  NewUserDocument,
  type NewUserMutation,
  type NewUserMutationVariables,
  PerformerEditDocument,
  type PerformerEditMutation,
  type PerformerEditMutationVariables,
  PerformerEditUpdateDocument,
  type PerformerEditUpdateMutation,
  type PerformerEditUpdateMutationVariables,
  RegenerateApiKeyDocument,
  type RegenerateApiKeyMutation,
  type RegenerateApiKeyMutationVariables,
  RequestChangeEmailDocument,
  type RequestChangeEmailMutation,
  type RequestChangeEmailMutationVariables,
  RescindInviteCodeDocument,
  type RescindInviteCodeMutation,
  type RescindInviteCodeMutationVariables,
  ResetPasswordDocument,
  type ResetPasswordMutation,
  type ResetPasswordMutationVariables,
  RevokeInviteDocument,
  type RevokeInviteMutation,
  type RevokeInviteMutationVariables,
  SceneEditDocument,
  type SceneEditMutation,
  type SceneEditMutationVariables,
  SceneEditUpdateDocument,
  type SceneEditUpdateMutation,
  type SceneEditUpdateMutationVariables,
  StudioEditDocument,
  type StudioEditMutation,
  type StudioEditMutationVariables,
  StudioEditUpdateDocument,
  type StudioEditUpdateMutation,
  type StudioEditUpdateMutationVariables,
  TagEditDocument,
  type TagEditMutation,
  type TagEditMutationVariables,
  TagEditUpdateDocument,
  type TagEditUpdateMutation,
  type TagEditUpdateMutationVariables,
  UnmatchFingerprintDocument,
  type UnmatchFingerprintMutation,
  type UnmatchFingerprintMutationVariables,
  UpdateNotificationSubscriptionsDocument,
  type UpdateNotificationSubscriptionsMutation,
  type UpdateNotificationSubscriptionsMutationVariables,
  UpdateSceneDocument,
  type UpdateSceneMutation,
  type UpdateSceneMutationVariables,
  UpdateSiteDocument,
  type UpdateSiteMutation,
  type UpdateSiteMutationVariables,
  UpdateStudioDocument,
  type UpdateStudioMutation,
  type UpdateStudioMutationVariables,
  UpdateTagCategoryDocument,
  type UpdateTagCategoryMutation,
  type UpdateTagCategoryMutationVariables,
  UpdateUserDocument,
  type UpdateUserMutation,
  type UpdateUserMutationVariables,
  ValidateChangeEmailDocument,
  type ValidateChangeEmailMutation,
  type ValidateChangeEmailMutationVariables,
  VoteDocument,
  type VoteMutation,
  type VoteMutationVariables,
} from "../types";

export const useActivateUser = (
  options?: useMutation.Options<
    ActivateNewUserMutation,
    ActivateNewUserMutationVariables
  >,
) => useMutation(ActivateNewUserDocument, options);

export const useAddUser = (
  options?: useMutation.Options<AddUserMutation, AddUserMutationVariables>,
) => useMutation(AddUserDocument, options);

export const useNewUser = (
  options?: useMutation.Options<NewUserMutation, NewUserMutationVariables>,
) => useMutation(NewUserDocument, options);

export const useUpdateUser = (
  options?: useMutation.Options<
    UpdateUserMutation,
    UpdateUserMutationVariables
  >,
) => useMutation(UpdateUserDocument, options);

export const useDeleteUser = (
  options?: useMutation.Options<
    DeleteUserMutation,
    DeleteUserMutationVariables
  >,
) => useMutation(DeleteUserDocument, options);

export const useAddCategory = (
  options?: useMutation.Options<
    AddTagCategoryMutation,
    AddTagCategoryMutationVariables
  >,
) => useMutation(AddTagCategoryDocument, options);

export const useDeleteCategory = (
  options?: useMutation.Options<
    DeleteTagCategoryMutation,
    DeleteTagCategoryMutationVariables
  >,
) => useMutation(DeleteTagCategoryDocument, options);

export const useUpdateCategory = (
  options?: useMutation.Options<
    UpdateTagCategoryMutation,
    UpdateTagCategoryMutationVariables
  >,
) => useMutation(UpdateTagCategoryDocument, options);

export const useAddImage = (
  options?: useMutation.Options<AddImageMutation, AddImageMutationVariables>,
) => useMutation(AddImageDocument, options);

export const usePerformerEdit = (
  options?: useMutation.Options<
    PerformerEditMutation,
    PerformerEditMutationVariables
  >,
) => useMutation(PerformerEditDocument, options);

export const usePerformerEditUpdate = (
  options?: useMutation.Options<
    PerformerEditUpdateMutation,
    PerformerEditUpdateMutationVariables
  >,
) => useMutation(PerformerEditUpdateDocument, options);

export const useAddScene = (
  options?: useMutation.Options<AddSceneMutation, AddSceneMutationVariables>,
) => useMutation(AddSceneDocument, options);

export const useDeleteScene = (
  options?: useMutation.Options<
    DeleteSceneMutation,
    DeleteSceneMutationVariables
  >,
) => useMutation(DeleteSceneDocument, options);

export const useUpdateScene = (
  options?: useMutation.Options<
    UpdateSceneMutation,
    UpdateSceneMutationVariables
  >,
) => useMutation(UpdateSceneDocument, options);

export const useAddStudio = (
  options?: useMutation.Options<AddStudioMutation, AddStudioMutationVariables>,
) => useMutation(AddStudioDocument, options);

export const useDeleteStudio = (
  options?: useMutation.Options<
    DeleteStudioMutation,
    DeleteStudioMutationVariables
  >,
) => useMutation(DeleteStudioDocument, options);

export const useUpdateStudio = (
  options?: useMutation.Options<
    UpdateStudioMutation,
    UpdateStudioMutationVariables
  >,
) => useMutation(UpdateStudioDocument, options);

export const useTagEdit = (
  options?: useMutation.Options<TagEditMutation, TagEditMutationVariables>,
) => useMutation(TagEditDocument, options);

export const useTagEditUpdate = (
  options?: useMutation.Options<
    TagEditUpdateMutation,
    TagEditUpdateMutationVariables
  >,
) => useMutation(TagEditUpdateDocument, options);

export const useStudioEdit = (
  options?: useMutation.Options<
    StudioEditMutation,
    StudioEditMutationVariables
  >,
) => useMutation(StudioEditDocument, options);

export const useStudioEditUpdate = (
  options?: useMutation.Options<
    StudioEditUpdateMutation,
    StudioEditUpdateMutationVariables
  >,
) => useMutation(StudioEditUpdateDocument, options);

export const useSceneEdit = (
  options?: useMutation.Options<SceneEditMutation, SceneEditMutationVariables>,
) => useMutation(SceneEditDocument, options);

export const useSceneEditUpdate = (
  options?: useMutation.Options<
    SceneEditUpdateMutation,
    SceneEditUpdateMutationVariables
  >,
) => useMutation(SceneEditUpdateDocument, options);

export const useApproveEdit = (
  options?: useMutation.Options<
    ApproveEditMutation,
    ApproveEditMutationVariables
  >,
) => useMutation(ApproveEditDocument, options);

export const useCancelEdit = (
  options?: useMutation.Options<
    CancelEditMutation,
    CancelEditMutationVariables
  >,
) => useMutation(CancelEditDocument, options);

export const useDeleteEdit = (
  options?: MutationHookOptions<
    DeleteEditMutation,
    DeleteEditMutationVariables
  >,
) => useMutation(DeleteEditDocument, options);

export const useAmendEdit = (
  options?: MutationHookOptions<AmendEditMutation, AmendEditMutationVariables>,
) => useMutation(AmendEditDocument, options);

export const useChangePassword = (
  options?: useMutation.Options<
    ChangePasswordMutation,
    ChangePasswordMutationVariables
  >,
) => useMutation(ChangePasswordDocument, options);

export const useResetPassword = (
  options?: useMutation.Options<
    ResetPasswordMutation,
    ResetPasswordMutationVariables
  >,
) => useMutation(ResetPasswordDocument, options);

export const useRegenerateAPIKey = (
  options?: useMutation.Options<
    RegenerateApiKeyMutation,
    RegenerateApiKeyMutationVariables
  >,
) => useMutation(RegenerateApiKeyDocument, options);

export const useGenerateInviteCodes = (
  options?: useMutation.Options<
    GenerateInviteCodesMutation,
    GenerateInviteCodesMutationVariables
  >,
) => useMutation(GenerateInviteCodesDocument, options);

export const useGrantInvite = (
  options?: useMutation.Options<
    GrantInviteMutation,
    GrantInviteMutationVariables
  >,
) => useMutation(GrantInviteDocument, options);

export const useRescindInviteCode = (
  options?: useMutation.Options<
    RescindInviteCodeMutation,
    RescindInviteCodeMutationVariables
  >,
) => useMutation(RescindInviteCodeDocument, options);

export const useRevokeInvite = (
  options?: useMutation.Options<
    RevokeInviteMutation,
    RevokeInviteMutationVariables
  >,
) => useMutation(RevokeInviteDocument, options);

export const useEditComment = (
  options?: useMutation.Options<
    EditCommentMutation,
    EditCommentMutationVariables
  >,
) => useMutation(EditCommentDocument, options);

export const useVote = (
  options?: useMutation.Options<VoteMutation, VoteMutationVariables>,
) => useMutation(VoteDocument, options);

export const useAddSite = (
  options?: useMutation.Options<AddSiteMutation, AddSiteMutationVariables>,
) => useMutation(AddSiteDocument, options);

export const useDeleteSite = (
  options?: useMutation.Options<
    DeleteSiteMutation,
    DeleteSiteMutationVariables
  >,
) => useMutation(DeleteSiteDocument, options);

export const useUpdateSite = (
  options?: useMutation.Options<
    UpdateSiteMutation,
    UpdateSiteMutationVariables
  >,
) => useMutation(UpdateSiteDocument, options);

export const useSetFavorite = <T extends "performer" | "studio">(
  type: T,
  id: string,
) =>
  useMutation<
    T extends "performer" ? FavoritePerformerMutation : FavoriteStudioMutation,
    T extends "performer"
      ? FavoritePerformerMutationVariables
      : FavoriteStudioMutationVariables
  >(type === "performer" ? FavoritePerformerDocument : FavoriteStudioDocument, {
    update: (cache, { errors }) => {
      if (errors === undefined) {
        const identity = cache.identify({
          __typename: type === "performer" ? "Performer" : "Studio",
          id,
        });
        cache.modify({
          id: identity,
          fields: {
            is_favorite: (prevState) => !prevState,
          },
        });
      }
    },
  });

export const useDeleteDraft = (
  options?: useMutation.Options<
    DeleteDraftMutation,
    DeleteDraftMutationVariables
  >,
) => useMutation(DeleteDraftDocument, options);

export const useUnmatchFingerprint = (
  options?: useMutation.Options<
    UnmatchFingerprintMutation,
    UnmatchFingerprintMutationVariables
  >,
) =>
  useMutation(UnmatchFingerprintDocument, {
    update(cache, { data }, { variables }) {
      if (data?.unmatchFingerprint)
        cache.evict({
          id: cache.identify({ __typename: "Scene", id: variables?.scene_id }),
          fieldName: "fingerprints",
        });
    },
    ...options,
  });

export const useMoveFingerprintSubmissions = (
  options?: useMutation.Options<
    MoveFingerprintSubmissionsMutation,
    MoveFingerprintSubmissionsMutationVariables
  >,
) =>
  useMutation(MoveFingerprintSubmissionsDocument, {
    update(cache, { data }, { variables }) {
      if (data?.sceneMoveFingerprintSubmissions) {
        // Evict fingerprints from both source and target scenes
        cache.evict({
          id: cache.identify({
            __typename: "Scene",
            id: variables?.input.source_scene_id,
          }),
          fieldName: "fingerprints",
        });
        cache.evict({
          id: cache.identify({
            __typename: "Scene",
            id: variables?.input.target_scene_id,
          }),
          fieldName: "fingerprints",
        });
      }
    },
    ...options,
  });

export const useDeleteFingerprintSubmissions = (
  options?: useMutation.Options<
    DeleteFingerprintSubmissionsMutation,
    DeleteFingerprintSubmissionsMutationVariables
  >,
) =>
  useMutation(DeleteFingerprintSubmissionsDocument, {
    update(cache, { data }, { variables }) {
      if (data?.sceneDeleteFingerprintSubmissions) {
        cache.evict({
          id: cache.identify({
            __typename: "Scene",
            id: variables?.input.scene_id,
          }),
          fieldName: "fingerprints",
        });
      }
    },
    ...options,
  });

export const useValidateChangeEmail = (
  options?: useMutation.Options<
    ValidateChangeEmailMutation,
    ValidateChangeEmailMutationVariables
  >,
) => useMutation(ValidateChangeEmailDocument, options);

export const useConfirmChangeEmail = (
  options?: useMutation.Options<
    ConfirmChangeEmailMutation,
    ConfirmChangeEmailMutationVariables
  >,
) => useMutation(ConfirmChangeEmailDocument, options);

export const useRequestChangeEmail = (
  options?: useMutation.Options<
    RequestChangeEmailMutation,
    RequestChangeEmailMutationVariables
  >,
) => useMutation(RequestChangeEmailDocument, options);

export const useUpdateNotificationSubscriptions = (
  options?: useMutation.Options<
    UpdateNotificationSubscriptionsMutation,
    UpdateNotificationSubscriptionsMutationVariables
  >,
) =>
  useMutation(UpdateNotificationSubscriptionsDocument, {
    update(cache, { data }) {
      if (data?.updateNotificationSubscriptions) {
        const user = cache.read<MeQuery>({ query: MeGql, optimistic: false });

        cache.evict({
          id: cache.identify({ __typename: "User", id: user?.me?.id }),
          fieldName: "notification_subscriptions",
        });
      }
    },
    ...options,
  });

type CachedNotification = {
  read: boolean;
  data: {
    __typename: string;
    comment?: { __ref: string };
    edit?: { __ref: string };
    scene?: { __ref: string };
  };
};

type CachedQueryNotifications = {
  count: number;
  notifications: CachedNotification[];
};

const notificationTypenameFromEnum = (type: string) =>
  type
    .toLowerCase()
    .replace(/(?:^|_)([a-z])/g, (_, c: string) => c.toUpperCase());

export const useMarkNotificationsRead = () =>
  useMutation(MarkNotificationsReadDocument, {
    update(cache, { data }) {
      if (!data?.markNotificationsRead) return;
      cache.modify({
        fields: {
          queryNotifications(
            existing: CachedQueryNotifications | Reference | undefined,
          ) {
            if (!existing || isReference(existing) || !existing.notifications)
              return existing;
            return {
              ...existing,
              notifications: existing.notifications.map((n) =>
                n.read ? n : { ...n, read: true },
              ),
            };
          },
          getUnreadNotificationCount() {
            return 0;
          },
        },
      });
    },
  });

export const useMarkNotificationRead = (
  variables: MarkNotificationReadMutationVariables,
) =>
  useMutation(MarkNotificationReadDocument, {
    variables,
    update(cache, { data }) {
      if (!data?.markNotificationsRead) return;
      const { type, id } = variables.notification;
      const targetTypename = notificationTypenameFromEnum(type);
      cache.modify({
        fields: {
          queryNotifications(
            existing: CachedQueryNotifications | Reference | undefined,
          ) {
            if (!existing || isReference(existing) || !existing.notifications)
              return existing;
            return {
              ...existing,
              notifications: existing.notifications.map((n) => {
                if (n.read || n.data?.__typename !== targetTypename) return n;
                const innerRef =
                  n.data.comment?.__ref ??
                  n.data.edit?.__ref ??
                  n.data.scene?.__ref;
                if (innerRef?.endsWith(`:${id}`)) {
                  return { ...n, read: true };
                }
                return n;
              }),
            };
          },
          getUnreadNotificationCount(existing: number | undefined) {
            return Math.max(0, (existing ?? 0) - 1);
          },
        },
      });
    },
  });
