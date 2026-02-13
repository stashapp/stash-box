import { useMutation } from "@apollo/client/react";

import MeGql from "../queries/Me.gql";
import {
  type ActivateNewUserMutation,
  type ActivateNewUserMutationVariables,
  type AddUserMutation,
  type AddUserMutationVariables,
  type NewUserMutation,
  type NewUserMutationVariables,
  type UpdateUserMutation,
  type UpdateUserMutationVariables,
  type DeleteUserMutation,
  type DeleteUserMutationVariables,
  type AddTagCategoryMutation,
  type AddTagCategoryMutationVariables,
  type DeleteTagCategoryMutation,
  type DeleteTagCategoryMutationVariables,
  type UpdateTagCategoryMutation,
  type UpdateTagCategoryMutationVariables,
  type AddImageMutation,
  type AddImageMutationVariables,
  type PerformerEditMutation,
  type PerformerEditMutationVariables,
  type PerformerEditUpdateMutation,
  type PerformerEditUpdateMutationVariables,
  type TagEditMutation,
  type TagEditMutationVariables,
  type TagEditUpdateMutation,
  type TagEditUpdateMutationVariables,
  type AddSceneMutation,
  type AddSceneMutationVariables,
  type DeleteSceneMutation,
  type DeleteSceneMutationVariables,
  type UpdateSceneMutation,
  type UpdateSceneMutationVariables,
  type AddStudioMutation,
  type AddStudioMutationVariables,
  type DeleteStudioMutation,
  type DeleteStudioMutationVariables,
  type UpdateStudioMutation,
  type UpdateStudioMutationVariables,
  type ApplyEditMutation,
  type ApplyEditMutationVariables,
  type CancelEditMutation,
  type CancelEditMutationVariables,
  type DeleteEditMutation,
  type DeleteEditMutationVariables,
  type ChangePasswordMutation,
  type ChangePasswordMutationVariables,
  type ResetPasswordMutation,
  type ResetPasswordMutationVariables,
  type RegenerateApiKeyMutation,
  type RegenerateApiKeyMutationVariables,
  type GenerateInviteCodesMutation,
  type GenerateInviteCodesMutationVariables,
  type GrantInviteMutation,
  type GrantInviteMutationVariables,
  type RescindInviteCodeMutation,
  type RescindInviteCodeMutationVariables,
  type RevokeInviteMutation,
  type RevokeInviteMutationVariables,
  type EditCommentMutation,
  type EditCommentMutationVariables,
  type StudioEditMutation,
  type StudioEditMutationVariables,
  type StudioEditUpdateMutation,
  type StudioEditUpdateMutationVariables,
  type SceneEditMutation,
  type SceneEditMutationVariables,
  type SceneEditUpdateMutation,
  type SceneEditUpdateMutationVariables,
  type VoteMutation,
  type VoteMutationVariables,
  type AddSiteMutation,
  type AddSiteMutationVariables,
  type DeleteSiteMutation,
  type DeleteSiteMutationVariables,
  type UpdateSiteMutation,
  type UpdateSiteMutationVariables,
  type FavoriteStudioMutation,
  type FavoriteStudioMutationVariables,
  type FavoritePerformerMutation,
  type FavoritePerformerMutationVariables,
  type DeleteDraftMutation,
  type DeleteDraftMutationVariables,
  type UnmatchFingerprintMutation,
  type UnmatchFingerprintMutationVariables,
  type MoveFingerprintSubmissionsMutation,
  type MoveFingerprintSubmissionsMutationVariables,
  type DeleteFingerprintSubmissionsMutation,
  type DeleteFingerprintSubmissionsMutationVariables,
  type ValidateChangeEmailMutation,
  type ValidateChangeEmailMutationVariables,
  type ConfirmChangeEmailMutation,
  type ConfirmChangeEmailMutationVariables,
  type RequestChangeEmailMutation,
  ActivateNewUserDocument,
  AddUserDocument,
  NewUserDocument,
  UpdateUserDocument,
  DeleteUserDocument,
  AddTagCategoryDocument,
  DeleteTagCategoryDocument,
  UpdateTagCategoryDocument,
  AddImageDocument,
  PerformerEditDocument,
  TagEditDocument,
  StudioEditDocument,
  SceneEditDocument,
  PerformerEditUpdateDocument,
  TagEditUpdateDocument,
  StudioEditUpdateDocument,
  SceneEditUpdateDocument,
  AddSceneDocument,
  DeleteSceneDocument,
  UpdateSceneDocument,
  AddStudioDocument,
  DeleteStudioDocument,
  UpdateStudioDocument,
  ApplyEditDocument,
  CancelEditDocument,
  DeleteEditDocument,
  ChangePasswordDocument,
  ResetPasswordDocument,
  RegenerateApiKeyDocument,
  GenerateInviteCodesDocument,
  GrantInviteDocument,
  RescindInviteCodeDocument,
  RevokeInviteDocument,
  EditCommentDocument,
  VoteDocument,
  AddSiteDocument,
  DeleteSiteDocument,
  UpdateSiteDocument,
  FavoritePerformerDocument,
  FavoriteStudioDocument,
  DeleteDraftDocument,
  UnmatchFingerprintDocument,
  MoveFingerprintSubmissionsDocument,
  DeleteFingerprintSubmissionsDocument,
  ValidateChangeEmailDocument,
  ConfirmChangeEmailDocument,
  RequestChangeEmailDocument,
  type RequestChangeEmailMutationVariables,
  UpdateNotificationSubscriptionsDocument,
  type UpdateNotificationSubscriptionsMutation,
  type UpdateNotificationSubscriptionsMutationVariables,
  MarkNotificationsReadDocument,
  MarkNotificationReadDocument,
  type MarkNotificationReadMutationVariables,
  type MeQuery,
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

export const useApplyEdit = (
  options?: useMutation.Options<ApplyEditMutation, ApplyEditMutationVariables>,
) => useMutation(ApplyEditDocument, options);

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

export const useMarkNotificationsRead = () =>
  useMutation(MarkNotificationsReadDocument, {
    update(cache, { data }) {
      if (data?.markNotificationsRead) {
        cache.evict({ fieldName: "queryNotifications" });
        cache.evict({ fieldName: "getUnreadNotificationCount" });
      }
    },
  });

export const useMarkNotificationRead = (
  variables: MarkNotificationReadMutationVariables,
) =>
  useMutation(MarkNotificationReadDocument, {
    variables,
    update(cache, { data }) {
      if (data?.markNotificationsRead) {
        cache.evict({ fieldName: "queryNotifications" });
        cache.evict({ fieldName: "getUnreadNotificationCount" });
      }
    },
  });
