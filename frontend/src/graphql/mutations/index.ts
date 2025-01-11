import { useMutation, MutationHookOptions } from "@apollo/client";

import MeGql from "../queries/Me.gql";
import {
  ActivateNewUserMutation,
  ActivateNewUserMutationVariables,
  AddUserMutation,
  AddUserMutationVariables,
  NewUserMutation,
  NewUserMutationVariables,
  UpdateUserMutation,
  UpdateUserMutationVariables,
  DeleteUserMutation,
  DeleteUserMutationVariables,
  AddTagCategoryMutation,
  AddTagCategoryMutationVariables,
  DeleteTagCategoryMutation,
  DeleteTagCategoryMutationVariables,
  UpdateTagCategoryMutation,
  UpdateTagCategoryMutationVariables,
  AddImageMutation,
  AddImageMutationVariables,
  PerformerEditMutation,
  PerformerEditMutationVariables,
  PerformerEditUpdateMutation,
  PerformerEditUpdateMutationVariables,
  TagEditMutation,
  TagEditMutationVariables,
  TagEditUpdateMutation,
  TagEditUpdateMutationVariables,
  AddSceneMutation,
  AddSceneMutationVariables,
  DeleteSceneMutation,
  DeleteSceneMutationVariables,
  UpdateSceneMutation,
  UpdateSceneMutationVariables,
  AddStudioMutation,
  AddStudioMutationVariables,
  DeleteStudioMutation,
  DeleteStudioMutationVariables,
  UpdateStudioMutation,
  UpdateStudioMutationVariables,
  ApplyEditMutation,
  ApplyEditMutationVariables,
  CancelEditMutation,
  CancelEditMutationVariables,
  ChangePasswordMutation,
  ChangePasswordMutationVariables,
  ResetPasswordMutation,
  ResetPasswordMutationVariables,
  RegenerateApiKeyMutation,
  RegenerateApiKeyMutationVariables,
  GenerateInviteCodesMutation,
  GrantInviteMutation,
  GrantInviteMutationVariables,
  RescindInviteCodeMutation,
  RescindInviteCodeMutationVariables,
  RevokeInviteMutation,
  RevokeInviteMutationVariables,
  EditCommentMutation,
  EditCommentMutationVariables,
  StudioEditMutation,
  StudioEditMutationVariables,
  StudioEditUpdateMutation,
  StudioEditUpdateMutationVariables,
  SceneEditMutation,
  SceneEditMutationVariables,
  SceneEditUpdateMutation,
  SceneEditUpdateMutationVariables,
  VoteMutation,
  VoteMutationVariables,
  AddSiteMutation,
  AddSiteMutationVariables,
  DeleteSiteMutation,
  DeleteSiteMutationVariables,
  UpdateSiteMutation,
  UpdateSiteMutationVariables,
  FavoriteStudioMutation,
  FavoriteStudioMutationVariables,
  FavoritePerformerMutation,
  FavoritePerformerMutationVariables,
  DeleteDraftMutation,
  DeleteDraftMutationVariables,
  UnmatchFingerprintMutation,
  UnmatchFingerprintMutationVariables,
  ValidateChangeEmailMutation,
  ValidateChangeEmailMutationVariables,
  ConfirmChangeEmailMutation,
  ConfirmChangeEmailMutationVariables,
  RequestChangeEmailMutation,
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
  ValidateChangeEmailDocument,
  ConfirmChangeEmailDocument,
  RequestChangeEmailDocument,
  RequestChangeEmailMutationVariables,
  UpdateNotificationSubscriptionsDocument,
  UpdateNotificationSubscriptionsMutation,
  UpdateNotificationSubscriptionsMutationVariables,
  MarkNotificationsReadDocument,
  MarkNotificationReadDocument,
  MarkNotificationReadMutationVariables,
  MeQuery,
} from "../types";

export const useActivateUser = (
  options?: MutationHookOptions<
    ActivateNewUserMutation,
    ActivateNewUserMutationVariables
  >,
) => useMutation(ActivateNewUserDocument, options);

export const useAddUser = (
  options?: MutationHookOptions<AddUserMutation, AddUserMutationVariables>,
) => useMutation(AddUserDocument, options);

export const useNewUser = (
  options?: MutationHookOptions<NewUserMutation, NewUserMutationVariables>,
) => useMutation(NewUserDocument, options);

export const useUpdateUser = (
  options?: MutationHookOptions<
    UpdateUserMutation,
    UpdateUserMutationVariables
  >,
) => useMutation(UpdateUserDocument, options);

export const useDeleteUser = (
  options?: MutationHookOptions<
    DeleteUserMutation,
    DeleteUserMutationVariables
  >,
) => useMutation(DeleteUserDocument, options);

export const useAddCategory = (
  options?: MutationHookOptions<
    AddTagCategoryMutation,
    AddTagCategoryMutationVariables
  >,
) => useMutation(AddTagCategoryDocument, options);

export const useDeleteCategory = (
  options?: MutationHookOptions<
    DeleteTagCategoryMutation,
    DeleteTagCategoryMutationVariables
  >,
) => useMutation(DeleteTagCategoryDocument, options);

export const useUpdateCategory = (
  options?: MutationHookOptions<
    UpdateTagCategoryMutation,
    UpdateTagCategoryMutationVariables
  >,
) => useMutation(UpdateTagCategoryDocument, options);

export const useAddImage = (
  options?: MutationHookOptions<AddImageMutation, AddImageMutationVariables>,
) => useMutation(AddImageDocument, options);

export const usePerformerEdit = (
  options?: MutationHookOptions<
    PerformerEditMutation,
    PerformerEditMutationVariables
  >,
) => useMutation(PerformerEditDocument, options);

export const usePerformerEditUpdate = (
  options?: MutationHookOptions<
    PerformerEditUpdateMutation,
    PerformerEditUpdateMutationVariables
  >,
) => useMutation(PerformerEditUpdateDocument, options);

export const useAddScene = (
  options?: MutationHookOptions<AddSceneMutation, AddSceneMutationVariables>,
) => useMutation(AddSceneDocument, options);

export const useDeleteScene = (
  options?: MutationHookOptions<
    DeleteSceneMutation,
    DeleteSceneMutationVariables
  >,
) => useMutation(DeleteSceneDocument, options);

export const useUpdateScene = (
  options?: MutationHookOptions<
    UpdateSceneMutation,
    UpdateSceneMutationVariables
  >,
) => useMutation(UpdateSceneDocument, options);

export const useAddStudio = (
  options?: MutationHookOptions<AddStudioMutation, AddStudioMutationVariables>,
) => useMutation(AddStudioDocument, options);

export const useDeleteStudio = (
  options?: MutationHookOptions<
    DeleteStudioMutation,
    DeleteStudioMutationVariables
  >,
) => useMutation(DeleteStudioDocument, options);

export const useUpdateStudio = (
  options?: MutationHookOptions<
    UpdateStudioMutation,
    UpdateStudioMutationVariables
  >,
) => useMutation(UpdateStudioDocument, options);

export const useTagEdit = (
  options?: MutationHookOptions<TagEditMutation, TagEditMutationVariables>,
) => useMutation(TagEditDocument, options);

export const useTagEditUpdate = (
  options?: MutationHookOptions<
    TagEditUpdateMutation,
    TagEditUpdateMutationVariables
  >,
) => useMutation(TagEditUpdateDocument, options);

export const useStudioEdit = (
  options?: MutationHookOptions<
    StudioEditMutation,
    StudioEditMutationVariables
  >,
) => useMutation(StudioEditDocument, options);

export const useStudioEditUpdate = (
  options?: MutationHookOptions<
    StudioEditUpdateMutation,
    StudioEditUpdateMutationVariables
  >,
) => useMutation(StudioEditUpdateDocument, options);

export const useSceneEdit = (
  options?: MutationHookOptions<SceneEditMutation, SceneEditMutationVariables>,
) => useMutation(SceneEditDocument, options);

export const useSceneEditUpdate = (
  options?: MutationHookOptions<
    SceneEditUpdateMutation,
    SceneEditUpdateMutationVariables
  >,
) => useMutation(SceneEditUpdateDocument, options);

export const useApplyEdit = (
  options?: MutationHookOptions<ApplyEditMutation, ApplyEditMutationVariables>,
) => useMutation(ApplyEditDocument, options);

export const useCancelEdit = (
  options?: MutationHookOptions<
    CancelEditMutation,
    CancelEditMutationVariables
  >,
) => useMutation(CancelEditDocument, options);

export const useChangePassword = (
  options?: MutationHookOptions<
    ChangePasswordMutation,
    ChangePasswordMutationVariables
  >,
) => useMutation(ChangePasswordDocument, options);

export const useResetPassword = (
  options?: MutationHookOptions<
    ResetPasswordMutation,
    ResetPasswordMutationVariables
  >,
) => useMutation(ResetPasswordDocument, options);

export const useRegenerateAPIKey = (
  options?: MutationHookOptions<
    RegenerateApiKeyMutation,
    RegenerateApiKeyMutationVariables
  >,
) => useMutation(RegenerateApiKeyDocument, options);

export const useGenerateInviteCodes = (
  options?: MutationHookOptions<GenerateInviteCodesMutation>,
) => useMutation(GenerateInviteCodesDocument, options);

export const useGrantInvite = (
  options?: MutationHookOptions<
    GrantInviteMutation,
    GrantInviteMutationVariables
  >,
) => useMutation(GrantInviteDocument, options);

export const useRescindInviteCode = (
  options?: MutationHookOptions<
    RescindInviteCodeMutation,
    RescindInviteCodeMutationVariables
  >,
) => useMutation(RescindInviteCodeDocument, options);

export const useRevokeInvite = (
  options?: MutationHookOptions<
    RevokeInviteMutation,
    RevokeInviteMutationVariables
  >,
) => useMutation(RevokeInviteDocument, options);

export const useEditComment = (
  options?: MutationHookOptions<
    EditCommentMutation,
    EditCommentMutationVariables
  >,
) => useMutation(EditCommentDocument, options);

export const useVote = (
  options?: MutationHookOptions<VoteMutation, VoteMutationVariables>,
) => useMutation(VoteDocument, options);

export const useAddSite = (
  options?: MutationHookOptions<AddSiteMutation, AddSiteMutationVariables>,
) => useMutation(AddSiteDocument, options);

export const useDeleteSite = (
  options?: MutationHookOptions<
    DeleteSiteMutation,
    DeleteSiteMutationVariables
  >,
) => useMutation(DeleteSiteDocument, options);

export const useUpdateSite = (
  options?: MutationHookOptions<
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
  options?: MutationHookOptions<
    DeleteDraftMutation,
    DeleteDraftMutationVariables
  >,
) => useMutation(DeleteDraftDocument, options);

export const useUnmatchFingerprint = (
  options?: MutationHookOptions<
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

export const useValidateChangeEmail = (
  options?: MutationHookOptions<
    ValidateChangeEmailMutation,
    ValidateChangeEmailMutationVariables
  >,
) => useMutation(ValidateChangeEmailDocument, options);

export const useConfirmChangeEmail = (
  options?: MutationHookOptions<
    ConfirmChangeEmailMutation,
    ConfirmChangeEmailMutationVariables
  >,
) => useMutation(ConfirmChangeEmailDocument, options);

export const useRequestChangeEmail = (
  options?: MutationHookOptions<
    RequestChangeEmailMutation,
    RequestChangeEmailMutationVariables
  >,
) => useMutation(RequestChangeEmailDocument, options);

export const useUpdateNotificationSubscriptions = (
  options?: MutationHookOptions<
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
