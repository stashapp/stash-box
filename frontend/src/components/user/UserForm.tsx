import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import Select, { ValueType, OptionTypeBase } from "react-select";
import * as yup from "yup";
import { RoleEnum, UserUpdateInput } from "src/definitions/globalTypes";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers";
import cx from "classnames";

const schema = yup.object().shape({
  id: yup.string(),
  name: yup.string().required("Username is required"),
  email: yup.string().email().required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .test(
      "uniqueness",
      "Password must have at least 5 unique characters",
      (value) =>
        value
          .split("")
          .filter(
            (item: string, i: number, ar: string[]) => ar.indexOf(item) === i
          )
          .join("").length >= 5
    )
    .required("Password is required"),
  roles: yup.array().of(yup.string()),
});
type UserFormData = yup.InferType<typeof schema>;

export type UserData = {
  id: string;
  name: string;
  email: string;
  password: string;
  roles: RoleEnum[];
};

interface UserProps {
  user: UserUpdateInput;
  error?: string;
  callback: (data: UserData) => void;
}

interface IOptionType extends OptionTypeBase {
  value: string;
  label: string;
}

const roles = Object.keys(RoleEnum).map((role) => ({
  label: role,
  value: role,
}));

const UserForm: React.FC<UserProps> = ({ user, callback, error }) => {
  const [userRoles, setUserRoles] = useState(
    (user?.roles ?? []).map((role: string) => ({
      value: role,
      label: role,
    }))
  );
  const { register, handleSubmit, setValue, errors } = useForm<UserFormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    register({ name: "roles" });
    setValue("roles", []);
  }, [register, setValue]);

  const onSubmit = (formData: UserFormData) => {
    const userData = {
      ...formData,
      id: formData.id,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      roles: formData.roles as RoleEnum[],
    };
    callback(userData);
  };

  const onRoleChange = (selectedRoles: ValueType<IOptionType>) => {
    if (!selectedRoles) return;
    const val = selectedRoles as IOptionType[];
    setUserRoles(val);
    setValue(
      "roles",
      val.map((role) => role.value)
    );
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Row>
        <h5 className="col-2">Add User</h5>
        <Form.Group controlId="username" className="col-2">
          <Form.Control type="hidden" value={user.id} />
          <Form.Control
            className={cx({ "is-invalid": errors.name })}
            name="name"
            placeholder="Username"
            ref={register}
            defaultValue={user.name ?? ""}
          />
          <div className="invalid-feedback">{errors?.name?.message}</div>
        </Form.Group>
        <Form.Group controlId="email" className="col-2">
          <Form.Control
            className={cx({ "is-invalid": errors.email })}
            name="email"
            type="email"
            placeholder="Email"
            ref={register}
            defaultValue={user.email ?? ""}
          />
          <div className="invalid-feedback">{errors?.email?.message}</div>
        </Form.Group>
        <Form.Group controlId="password" className="col-2">
          <Form.Control
            className={cx({ "is-invalid": errors.password })}
            name="password"
            type="password"
            placeholder="Password"
            ref={register}
            defaultValue={user.password ?? ""}
          />
          <div className="invalid-feedback">{errors?.password?.message}</div>
        </Form.Group>
        <Form.Group className="col-4">
          <Select
            classNamePrefix="react-select"
            name="roles"
            options={roles}
            placeholder="User roles"
            onChange={onRoleChange}
            value={userRoles}
            isMulti
          />
        </Form.Group>
      </Form.Row>
      <Form.Row>
        <div className="offset-2">
          <Button type="submit">Add</Button>
          <div className="invalid-feedback d-block">{error}</div>
        </div>
      </Form.Row>
    </Form>
  );
};

export default UserForm;
