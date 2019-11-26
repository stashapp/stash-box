/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: LoginUser
// ====================================================

export interface LoginUser_loginUser_user {
  email: string;
  username: string;
  role: number;
}

export interface LoginUser_loginUser {
  bearer: string | null;
  user: LoginUser_loginUser_user;
}

export interface LoginUser {
  loginUser: LoginUser_loginUser;
}

export interface LoginUserVariables {
  email: string;
  password: string;
}
