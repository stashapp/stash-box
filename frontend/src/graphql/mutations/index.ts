import { useMutation, MutationHookOptions } from "@apollo/client";

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
} from "../types";

import ActivateUserGQL from "./ActivateNewUser.gql";
import AddUserGQL from "./AddUser.gql";
import NewUserGQL from "./NewUser.gql";
import UpdateUserGQL from "./UpdateUser.gql";
import DeleteUserGQL from "./DeleteUser.gql";
import AddTagCategoryGQL from "./AddTagCategory.gql";
import DeleteTagCategoryGQL from "./DeleteTagCategory.gql";
import UpdateTagCategoryGQL from "./UpdateTagCategory.gql";
import AddImageGQL from "./AddImage.gql";
import PerformerEditGQL from "./PerformerEdit.gql";
import TagEditGQL from "./TagEdit.gql";
import StudioEditGQL from "./StudioEdit.gql";
import SceneEditGQL from "./SceneEdit.gql";
import PerformerEditUpdateGQL from "./PerformerEditUpdate.gql";
import TagEditUpdateGQL from "./TagEditUpdate.gql";
import StudioEditUpdateGQL from "./StudioEditUpdate.gql";
import SceneEditUpdateGQL from "./SceneEditUpdate.gql";
import AddSceneGQL from "./AddScene.gql";
import DeleteSceneGQL from "./DeleteScene.gql";
import UpdateSceneGQL from "./UpdateScene.gql";
import AddStudioGQL from "./AddStudio.gql";
import DeleteStudioGQL from "./DeleteStudio.gql";
import UpdateStudioGQL from "./UpdateStudio.gql";
import ApplyEditGQL from "./ApplyEdit.gql";
import CancelEditGQL from "./CancelEdit.gql";
import ChangePasswordGQL from "./ChangePassword.gql";
import ResetPasswordGQL from "./ResetPassword.gql";
import RegenerateAPIKeyGQL from "./RegenerateAPIKey.gql";
import GenerateInviteCodesGQL from "./GenerateInviteCode.gql";
import GrantInviteGQL from "./GrantInvite.gql";
import RescindInviteCodeGQL from "./RescindInviteCode.gql";
import RevokeInviteGQL from "./RevokeInvite.gql";
import EditCommentGQL from "./EditComment.gql";
import VoteGQL from "./Vote.gql";
import AddSiteGQL from "./AddSite.gql";
import DeleteSiteGQL from "./DeleteSite.gql";
import UpdateSiteGQL from "./UpdateSite.gql";
import FavoriteStudioGQL from "./FavoriteStudio.gql";
import FavoritePerformerGQL from "./FavoritePerformer.gql";
import DeleteDraftGQL from "./DeleteDraft.gql";
import UnmatchFingerprintGQL from "./UnmatchFingerprint.gql";
import ValidateChangeEmailGQL from "./ValidateChangeEmail.gql";
import ConfirmChangeEmailGQL from "./ConfirmChangeEmail.gql";
import RequestChangeEmailGQL from "./RequestChangeEmail.gql";

export const useActivateUser = (
  options?: MutationHookOptions<
    ActivateNewUserMutation,
    ActivateNewUserMutationVariables
  >
) => useMutation(ActivateUserGQL, options);

export const useAddUser = (
  options?: MutationHookOptions<AddUserMutation, AddUserMutationVariables>
) => useMutation(AddUserGQL, options);

export const useNewUser = (
  options?: MutationHookOptions<NewUserMutation, NewUserMutationVariables>
) => useMutation(NewUserGQL, options);

export const useUpdateUser = (
  options?: MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>
) => useMutation(UpdateUserGQL, options);

export const useDeleteUser = (
  options?: MutationHookOptions<DeleteUserMutation, DeleteUserMutationVariables>
) => useMutation(DeleteUserGQL, options);

export const useAddCategory = (
  options?: MutationHookOptions<
    AddTagCategoryMutation,
    AddTagCategoryMutationVariables
  >
) => useMutation(AddTagCategoryGQL, options);

export const useDeleteCategory = (
  options?: MutationHookOptions<
    DeleteTagCategoryMutation,
    DeleteTagCategoryMutationVariables
  >
) => useMutation(DeleteTagCategoryGQL, options);

export const useUpdateCategory = (
  options?: MutationHookOptions<
    UpdateTagCategoryMutation,
    UpdateTagCategoryMutationVariables
  >
) => useMutation(UpdateTagCategoryGQL, options);

export const useAddImage = (
  options?: MutationHookOptions<AddImageMutation, AddImageMutationVariables>
) => useMutation(AddImageGQL, options);

export const usePerformerEdit = (
  options?: MutationHookOptions<
    PerformerEditMutation,
    PerformerEditMutationVariables
  >
) => useMutation(PerformerEditGQL, options);

export const usePerformerEditUpdate = (
  options?: MutationHookOptions<
    PerformerEditUpdateMutation,
    PerformerEditUpdateMutationVariables
  >
) => useMutation(PerformerEditUpdateGQL, options);

export const useAddScene = (
  options?: MutationHookOptions<AddSceneMutation, AddSceneMutationVariables>
) => useMutation(AddSceneGQL, options);

export const useDeleteScene = (
  options?: MutationHookOptions<
    DeleteSceneMutation,
    DeleteSceneMutationVariables
  >
) => useMutation(DeleteSceneGQL, options);

export const useUpdateScene = (
  options?: MutationHookOptions<
    UpdateSceneMutation,
    UpdateSceneMutationVariables
  >
) => useMutation(UpdateSceneGQL, options);

export const useAddStudio = (
  options?: MutationHookOptions<AddStudioMutation, AddStudioMutationVariables>
) => useMutation(AddStudioGQL, options);

export const useDeleteStudio = (
  options?: MutationHookOptions<
    DeleteStudioMutation,
    DeleteStudioMutationVariables
  >
) => useMutation(DeleteStudioGQL, options);

export const useUpdateStudio = (
  options?: MutationHookOptions<
    UpdateStudioMutation,
    UpdateStudioMutationVariables
  >
) => useMutation(UpdateStudioGQL, options);

export const useTagEdit = (
  options?: MutationHookOptions<TagEditMutation, TagEditMutationVariables>
) => useMutation(TagEditGQL, options);

export const useTagEditUpdate = (
  options?: MutationHookOptions<
    TagEditUpdateMutation,
    TagEditUpdateMutationVariables
  >
) => useMutation(TagEditUpdateGQL, options);

export const useStudioEdit = (
  options?: MutationHookOptions<StudioEditMutation, StudioEditMutationVariables>
) => useMutation(StudioEditGQL, options);

export const useStudioEditUpdate = (
  options?: MutationHookOptions<
    StudioEditUpdateMutation,
    StudioEditUpdateMutationVariables
  >
) => useMutation(StudioEditUpdateGQL, options);

export const useSceneEdit = (
  options?: MutationHookOptions<SceneEditMutation, SceneEditMutationVariables>
) => useMutation(SceneEditGQL, options);

export const useSceneEditUpdate = (
  options?: MutationHookOptions<
    SceneEditUpdateMutation,
    SceneEditUpdateMutationVariables
  >
) => useMutation(SceneEditUpdateGQL, options);

export const useApplyEdit = (
  options?: MutationHookOptions<ApplyEditMutation, ApplyEditMutationVariables>
) => useMutation(ApplyEditGQL, options);

export const useCancelEdit = (
  options?: MutationHookOptions<CancelEditMutation, CancelEditMutationVariables>
) => useMutation(CancelEditGQL, options);

export const useChangePassword = (
  options?: MutationHookOptions<
    ChangePasswordMutation,
    ChangePasswordMutationVariables
  >
) => useMutation(ChangePasswordGQL, options);

export const useResetPassword = (
  options?: MutationHookOptions<
    ResetPasswordMutation,
    ResetPasswordMutationVariables
  >
) => useMutation(ResetPasswordGQL, options);

export const useRegenerateAPIKey = (
  options?: MutationHookOptions<
    RegenerateApiKeyMutation,
    RegenerateApiKeyMutationVariables
  >
) => useMutation(RegenerateAPIKeyGQL, options);

export const useGenerateInviteCodes = (
  options?: MutationHookOptions<GenerateInviteCodesMutation>
) => useMutation(GenerateInviteCodesGQL, options);

export const useGrantInvite = (
  options?: MutationHookOptions<
    GrantInviteMutation,
    GrantInviteMutationVariables
  >
) => useMutation(GrantInviteGQL, options);

export const useRescindInviteCode = (
  options?: MutationHookOptions<
    RescindInviteCodeMutation,
    RescindInviteCodeMutationVariables
  >
) => useMutation(RescindInviteCodeGQL, options);

export const useRevokeInvite = (
  options?: MutationHookOptions<
    RevokeInviteMutation,
    RevokeInviteMutationVariables
  >
) => useMutation(RevokeInviteGQL, options);

export const useEditComment = (
  options?: MutationHookOptions<
    EditCommentMutation,
    EditCommentMutationVariables
  >
) => useMutation(EditCommentGQL, options);

export const useVote = (
  options?: MutationHookOptions<VoteMutation, VoteMutationVariables>
) => useMutation(VoteGQL, options);

export const useAddSite = (
  options?: MutationHookOptions<AddSiteMutation, AddSiteMutationVariables>
) => useMutation(AddSiteGQL, options);

export const useDeleteSite = (
  options?: MutationHookOptions<DeleteSiteMutation, DeleteSiteMutationVariables>
) => useMutation(DeleteSiteGQL, options);

export const useUpdateSite = (
  options?: MutationHookOptions<UpdateSiteMutation, UpdateSiteMutationVariables>
) => useMutation(UpdateSiteGQL, options);

export const useSetFavorite = <T extends "performer" | "studio">(
  type: T,
  id: string
) =>
  useMutation<
    T extends "performer" ? FavoritePerformerMutation : FavoriteStudioMutation,
    T extends "performer"
      ? FavoritePerformerMutationVariables
      : FavoriteStudioMutationVariables
  >(type === "performer" ? FavoritePerformerGQL : FavoriteStudioGQL, {
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
  >
) => useMutation(DeleteDraftGQL, options);

export const useUnmatchFingerprint = (
  options?: MutationHookOptions<
    UnmatchFingerprintMutation,
    UnmatchFingerprintMutationVariables
  >
) =>
  useMutation(UnmatchFingerprintGQL, {
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
  >
) => useMutation(ValidateChangeEmailGQL, options);

export const useConfirmChangeEmail = (
  options?: MutationHookOptions<
    ConfirmChangeEmailMutation,
    ConfirmChangeEmailMutationVariables
  >
) => useMutation(ConfirmChangeEmailGQL, options);

export const useRequestChangeEmail = (
  options?: MutationHookOptions<RequestChangeEmailMutation>
) => useMutation(RequestChangeEmailGQL, options);
