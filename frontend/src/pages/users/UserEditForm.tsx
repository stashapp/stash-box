import React, { useContext } from "react";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import Select from "react-select";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";

import { RoleEnum, UserUpdateInput } from "src/graphql";
import { isAdmin, userHref } from "src/utils";
import AuthContext from "src/AuthContext";

const schema = yup.object({
  name: yup.string().optional(),
  id: yup.string().required(),
  email: yup.string().email().required("Email is required"),
  roles: yup.array().of(yup.string()),
});
type UserFormData = yup.Asserts<typeof schema>;

export type UserEditData = {
  name?: string;
  id: string;
  email: string;
  roles: RoleEnum[];
};

interface UserProps {
  user: UserUpdateInput;
  username: string;
  error?: string;
  callback: (data: UserEditData) => void;
}

const roles = Object.keys(RoleEnum).map((role) => ({
  label: role,
  value: role,
}));

const UserForm: React.FC<UserProps> = ({ user, username, callback, error }) => {
  const Auth = useContext(AuthContext);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (formData: UserFormData) => {
    const userData = {
      ...formData,
      id: formData.id,
      email: formData.email,
      roles: formData.roles as RoleEnum[],
    };
    callback(userData);
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Row>
        {isAdmin(Auth.user) && (
          <Form.Group controlId="name" className="col-6">
            <Form.Label>Username</Form.Label>
            <Form.Control
              className={cx({ "is-invalid": errors.name })}
              type="text"
              placeholder="Username"
              defaultValue={user.name ?? ""}
              {...register("name")}
            />
            <div className="invalid-feedback">{errors?.name?.message}</div>
          </Form.Group>
        )}
      </Form.Row>
      <Form.Row>
        <Form.Control type="hidden" value={user.id} {...register("id")} />
        <Form.Group controlId="email" className="col-6">
          <Form.Label>Email</Form.Label>
          <Form.Control
            className={cx({ "is-invalid": errors.email })}
            type="email"
            placeholder="Email"
            defaultValue={user.email ?? ""}
            {...register("email")}
          />
          <div className="invalid-feedback">{errors?.email?.message}</div>
        </Form.Group>
      </Form.Row>
      {isAdmin(Auth.user) && (
        <Form.Row>
          <Form.Group className="col-6">
            <Form.Label>Roles</Form.Label>
            <Controller
              name="roles"
              control={control}
              defaultValue={user.roles ?? []}
              render={({ field: { onChange } }) => (
                <Select
                  classNamePrefix="react-select"
                  name="roles"
                  options={roles}
                  placeholder="User roles"
                  onChange={(vals) => onChange(vals.map((v) => v.value) ?? [])}
                  defaultValue={roles.filter((r) =>
                    (user.roles ?? []).includes(r.value as RoleEnum)
                  )}
                  isMulti
                />
              )}
            />
          </Form.Group>
        </Form.Row>
      )}
      <Form.Row>
        <div className="col-6">
          <Button variant="primary" type="submit">
            Save
          </Button>
          <Link to={userHref({ name: username })} className="ml-2">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <div className="invalid-feedback d-block">{error}</div>
        </div>
      </Form.Row>
    </Form>
  );
};

export default UserForm;
