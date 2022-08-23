import { useMutation, MutationHookOptions } from "@apollo/client";

import {
  ActivateNewUser,
  ActivateNewUserVariables,
} from "../definitions/ActivateNewUser";
import { AddUser, AddUserVariables } from "../definitions/AddUser";
import { NewUser, NewUserVariables } from "../definitions/NewUser";
import { UpdateUser, UpdateUserVariables } from "../definitions/UpdateUser";
import { DeleteUser, DeleteUserVariables } from "../definitions/DeleteUser";
import {
  AddTagCategory,
  AddTagCategoryVariables,
} from "../definitions/AddTagCategory";
import {
  DeleteTagCategory,
  DeleteTagCategoryVariables,
} from "../definitions/DeleteTagCategory";
import {
  UpdateTagCategory,
  UpdateTagCategoryVariables,
} from "../definitions/UpdateTagCategory";
import { AddImage, AddImageVariables } from "../definitions/AddImage";
import {
  PerformerEdit,
  PerformerEditVariables,
} from "../definitions/PerformerEdit";
import {
  PerformerEditUpdate,
  PerformerEditUpdateVariables,
} from "../definitions/PerformerEditUpdate";
import { TagEdit, TagEditVariables } from "../definitions/TagEdit";
import {
  TagEditUpdate,
  TagEditUpdateVariables,
} from "../definitions/TagEditUpdate";
import { AddScene, AddSceneVariables } from "../definitions/AddScene";
import { DeleteScene, DeleteSceneVariables } from "../definitions/DeleteScene";
import { UpdateScene, UpdateSceneVariables } from "../definitions/UpdateScene";
import { AddStudio, AddStudioVariables } from "../definitions/AddStudio";
import {
  DeleteStudio,
  DeleteStudioVariables,
} from "../definitions/DeleteStudio";
import {
  UpdateStudio,
  UpdateStudioVariables,
} from "../definitions/UpdateStudio";
import { ApplyEdit, ApplyEditVariables } from "../definitions/ApplyEdit";
import { CancelEdit, CancelEditVariables } from "../definitions/CancelEdit";
import {
  ChangePassword,
  ChangePasswordVariables,
} from "../definitions/ChangePassword";
import {
  ResetPassword,
  ResetPasswordVariables,
} from "../definitions/ResetPassword";
import {
  RegenerateAPIKey,
  RegenerateAPIKeyVariables,
} from "../definitions/RegenerateAPIKey";
import { GenerateInviteCode } from "../definitions/GenerateInviteCode";
import { GrantInvite, GrantInviteVariables } from "../definitions/GrantInvite";
import {
  RescindInviteCode,
  RescindInviteCodeVariables,
} from "../definitions/RescindInviteCode";
import {
  RevokeInvite,
  RevokeInviteVariables,
} from "../definitions/RevokeInvite";
import { EditComment, EditCommentVariables } from "../definitions/EditComment";
import { StudioEdit, StudioEditVariables } from "../definitions/StudioEdit";
import {
  StudioEditUpdate,
  StudioEditUpdateVariables,
} from "../definitions/StudioEditUpdate";
import { SceneEdit, SceneEditVariables } from "../definitions/SceneEdit";
import {
  SceneEditUpdate,
  SceneEditUpdateVariables,
} from "../definitions/SceneEditUpdate";
import { Vote, VoteVariables } from "../definitions/Vote";
import { AddSite, AddSiteVariables } from "../definitions/AddSite";
import { DeleteSite, DeleteSiteVariables } from "../definitions/DeleteSite";
import { UpdateSite, UpdateSiteVariables } from "../definitions/UpdateSite";
import {
  FavoriteStudio,
  FavoriteStudioVariables,
} from "../definitions/FavoriteStudio";
import {
  FavoritePerformer,
  FavoritePerformerVariables,
} from "../definitions/FavoritePerformer";
import { DeleteDraft, DeleteDraftVariables } from "../definitions/DeleteDraft";
import { SubmitFingerprint, SubmitFingerprintVariables } from "../definitions/SubmitFingerprint";

import ActivateUserMutation from "./ActivateNewUser.gql";
import AddUserMutation from "./AddUser.gql";
import NewUserMutation from "./NewUser.gql";
import UpdateUserMutation from "./UpdateUser.gql";
import DeleteUserMutation from "./DeleteUser.gql";
import AddTagCategoryMutation from "./AddTagCategory.gql";
import DeleteTagCategoryMutation from "./DeleteTagCategory.gql";
import UpdateTagCategoryMutation from "./UpdateTagCategory.gql";
import AddImageMutation from "./AddImage.gql";
import PerformerEditMutation from "./PerformerEdit.gql";
import TagEditMutation from "./TagEdit.gql";
import StudioEditMutation from "./StudioEdit.gql";
import SceneEditMutation from "./SceneEdit.gql";
import PerformerEditUpdateMutation from "./PerformerEditUpdate.gql";
import TagEditUpdateMutation from "./TagEditUpdate.gql";
import StudioEditUpdateMutation from "./StudioEditUpdate.gql";
import SceneEditUpdateMutation from "./SceneEditUpdate.gql";
import AddSceneMutation from "./AddScene.gql";
import DeleteSceneMutation from "./DeleteScene.gql";
import UpdateSceneMutation from "./UpdateScene.gql";
import AddStudioMutation from "./AddStudio.gql";
import DeleteStudioMutation from "./DeleteStudio.gql";
import UpdateStudioMutation from "./UpdateStudio.gql";
import ApplyEditMutation from "./ApplyEdit.gql";
import CancelEditMutation from "./CancelEdit.gql";
import ChangePasswordMutation from "./ChangePassword.gql";
import ResetPasswordMutation from "./ResetPassword.gql";
import RegenerateAPIKeyMutation from "./RegenerateAPIKey.gql";
import GenerateInviteCodeMutation from "./GenerateInviteCode.gql";
import GrantInviteMutation from "./GrantInvite.gql";
import RescindInviteCodeMutation from "./RescindInviteCode.gql";
import RevokeInviteMutation from "./RevokeInvite.gql";
import EditCommentMutation from "./EditComment.gql";
import VoteMutation from "./Vote.gql";
import AddSiteMutation from "./AddSite.gql";
import DeleteSiteMutation from "./DeleteSite.gql";
import UpdateSiteMutation from "./UpdateSite.gql";
import FavoriteStudioMutation from "./FavoriteStudio.gql";
import FavoritePerformerMutation from "./FavoritePerformer.gql";
import DeleteDraftMutation from "./DeleteDraft.gql";
import SubmitFingerprintMutation from "./SubmitFingerprint.gql";

export const useActivateUser = (
  options?: MutationHookOptions<ActivateNewUser, ActivateNewUserVariables>
) => useMutation(ActivateUserMutation, options);

export const useAddUser = (
  options?: MutationHookOptions<AddUser, AddUserVariables>
) => useMutation(AddUserMutation, options);

export const useNewUser = (
  options?: MutationHookOptions<NewUser, NewUserVariables>
) => useMutation(NewUserMutation, options);

export const useUpdateUser = (
  options?: MutationHookOptions<UpdateUser, UpdateUserVariables>
) => useMutation(UpdateUserMutation, options);

export const useDeleteUser = (
  options?: MutationHookOptions<DeleteUser, DeleteUserVariables>
) => useMutation(DeleteUserMutation, options);

export const useAddCategory = (
  options?: MutationHookOptions<AddTagCategory, AddTagCategoryVariables>
) => useMutation(AddTagCategoryMutation, options);

export const useDeleteCategory = (
  options?: MutationHookOptions<DeleteTagCategory, DeleteTagCategoryVariables>
) => useMutation(DeleteTagCategoryMutation, options);

export const useUpdateCategory = (
  options?: MutationHookOptions<UpdateTagCategory, UpdateTagCategoryVariables>
) => useMutation(UpdateTagCategoryMutation, options);

export const useAddImage = (
  options?: MutationHookOptions<AddImage, AddImageVariables>
) => useMutation(AddImageMutation, options);

export const usePerformerEdit = (
  options?: MutationHookOptions<PerformerEdit, PerformerEditVariables>
) => useMutation(PerformerEditMutation, options);

export const usePerformerEditUpdate = (
  options?: MutationHookOptions<
    PerformerEditUpdate,
    PerformerEditUpdateVariables
  >
) => useMutation(PerformerEditUpdateMutation, options);

export const useAddScene = (
  options?: MutationHookOptions<AddScene, AddSceneVariables>
) => useMutation(AddSceneMutation, options);

export const useDeleteScene = (
  options?: MutationHookOptions<DeleteScene, DeleteSceneVariables>
) => useMutation(DeleteSceneMutation, options);

export const useUpdateScene = (
  options?: MutationHookOptions<UpdateScene, UpdateSceneVariables>
) => useMutation(UpdateSceneMutation, options);

export const useAddStudio = (
  options?: MutationHookOptions<AddStudio, AddStudioVariables>
) => useMutation(AddStudioMutation, options);

export const useDeleteStudio = (
  options?: MutationHookOptions<DeleteStudio, DeleteStudioVariables>
) => useMutation(DeleteStudioMutation, options);

export const useUpdateStudio = (
  options?: MutationHookOptions<UpdateStudio, UpdateStudioVariables>
) => useMutation(UpdateStudioMutation, options);

export const useTagEdit = (
  options?: MutationHookOptions<TagEdit, TagEditVariables>
) => useMutation(TagEditMutation, options);

export const useTagEditUpdate = (
  options?: MutationHookOptions<TagEditUpdate, TagEditUpdateVariables>
) => useMutation(TagEditUpdateMutation, options);

export const useStudioEdit = (
  options?: MutationHookOptions<StudioEdit, StudioEditVariables>
) => useMutation(StudioEditMutation, options);

export const useStudioEditUpdate = (
  options?: MutationHookOptions<StudioEditUpdate, StudioEditUpdateVariables>
) => useMutation(StudioEditUpdateMutation, options);

export const useSceneEdit = (
  options?: MutationHookOptions<SceneEdit, SceneEditVariables>
) => useMutation(SceneEditMutation, options);

export const useSceneEditUpdate = (
  options?: MutationHookOptions<SceneEditUpdate, SceneEditUpdateVariables>
) => useMutation(SceneEditUpdateMutation, options);

export const useApplyEdit = (
  options?: MutationHookOptions<ApplyEdit, ApplyEditVariables>
) => useMutation(ApplyEditMutation, options);

export const useCancelEdit = (
  options?: MutationHookOptions<CancelEdit, CancelEditVariables>
) => useMutation(CancelEditMutation, options);

export const useChangePassword = (
  options?: MutationHookOptions<ChangePassword, ChangePasswordVariables>
) => useMutation(ChangePasswordMutation, options);

export const useResetPassword = (
  options?: MutationHookOptions<ResetPassword, ResetPasswordVariables>
) => useMutation(ResetPasswordMutation, options);

export const useRegenerateAPIKey = (
  options?: MutationHookOptions<RegenerateAPIKey, RegenerateAPIKeyVariables>
) => useMutation(RegenerateAPIKeyMutation, options);

export const useGenerateInviteCode = (
  options?: MutationHookOptions<GenerateInviteCode>
) => useMutation(GenerateInviteCodeMutation, options);

export const useGrantInvite = (
  options?: MutationHookOptions<GrantInvite, GrantInviteVariables>
) => useMutation(GrantInviteMutation, options);

export const useRescindInviteCode = (
  options?: MutationHookOptions<RescindInviteCode, RescindInviteCodeVariables>
) => useMutation(RescindInviteCodeMutation, options);

export const useRevokeInvite = (
  options?: MutationHookOptions<RevokeInvite, RevokeInviteVariables>
) => useMutation(RevokeInviteMutation, options);

export const useEditComment = (
  options?: MutationHookOptions<EditComment, EditCommentVariables>
) => useMutation(EditCommentMutation, options);

export const useVote = (options?: MutationHookOptions<Vote, VoteVariables>) =>
  useMutation(VoteMutation, options);

export const useAddSite = (
  options?: MutationHookOptions<AddSite, AddSiteVariables>
) => useMutation(AddSiteMutation, options);

export const useDeleteSite = (
  options?: MutationHookOptions<DeleteSite, DeleteSiteVariables>
) => useMutation(DeleteSiteMutation, options);

export const useUpdateSite = (
  options?: MutationHookOptions<UpdateSite, UpdateSiteVariables>
) => useMutation(UpdateSiteMutation, options);

export const useSetFavorite = <T extends "performer" | "studio">(
  type: T,
  id: string
) =>
  useMutation<
    T extends "performer" ? FavoritePerformer : FavoriteStudio,
    T extends "performer" ? FavoritePerformerVariables : FavoriteStudioVariables
  >(type === "performer" ? FavoritePerformerMutation : FavoriteStudioMutation, {
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
  options?: MutationHookOptions<DeleteDraft, DeleteDraftVariables>
) => useMutation(DeleteDraftMutation, options);


export const useSubmitFingerPrint = (
  options?: MutationHookOptions<SubmitFingerprint, SubmitFingerprintVariables>
) => useMutation(SubmitFingerprintMutation,options);