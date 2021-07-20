import { useMutation, MutationHookOptions } from "@apollo/client";
import { loader } from "graphql.macro";

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
import { TagEdit, TagEditVariables } from "../definitions/TagEdit";
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
import { AnalyzeData, AnalyzeDataVariables } from "../definitions/AnalyzeData";
import { ImportData, ImportDataVariables } from "../definitions/ImportData";

const ActivateUserMutation = loader("./ActivateNewUser.gql");
const AddUserMutation = loader("./AddUser.gql");
const NewUserMutation = loader("./NewUser.gql");
const UpdateUserMutation = loader("./UpdateUser.gql");
const DeleteUserMutation = loader("./DeleteUser.gql");
const AddTagCategoryMutation = loader("./AddTagCategory.gql");
const DeleteTagCategoryMutation = loader("./DeleteTagCategory.gql");
const UpdateTagCategoryMutation = loader("./UpdateTagCategory.gql");
const AddImageMutation = loader("./AddImage.gql");
const PerformerEditMutation = loader("./PerformerEdit.gql");
const TagEditMutation = loader("./TagEdit.gql");
const AddSceneMutation = loader("./AddScene.gql");
const DeleteSceneMutation = loader("./DeleteScene.gql");
const UpdateSceneMutation = loader("./UpdateScene.gql");
const AddStudioMutation = loader("./AddStudio.gql");
const DeleteStudioMutation = loader("./DeleteStudio.gql");
const UpdateStudioMutation = loader("./UpdateStudio.gql");
const ApplyEditMutation = loader("./ApplyEdit.gql");
const CancelEditMutation = loader("./CancelEdit.gql");
const ChangePasswordMutation = loader("./ChangePassword.gql");
const ResetPasswordMutation = loader("./ResetPassword.gql");
const GenerateInviteCodeMutation = loader("./GenerateInviteCode.gql");
const GrantInviteMutation = loader("./GrantInvite.gql");
const RescindInviteCodeMutation = loader("./RescindInviteCode.gql");
const RevokeInviteMutation = loader("./RevokeInvite.gql");
const EditCommentMutation = loader("./EditComment.gql");
const AnalyzeDataMutation = loader("./AnalyzeData.gql");
const ImportDataMutation = loader("./ImportData.gql");

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

export const useAnalyzeData = (
  options?: MutationHookOptions<AnalyzeData, AnalyzeDataVariables>
) => useMutation(AnalyzeDataMutation, options);

export const useImportData = (
  options?: MutationHookOptions<ImportData, ImportDataVariables>
) => useMutation(ImportDataMutation, options);
