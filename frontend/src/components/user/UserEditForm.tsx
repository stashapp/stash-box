import React, { useState, useContext, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import Select from "react-select";
import * as yup from "yup";
import useForm from "react-hook-form";
import cx from "classnames";

import { RoleEnum, UserUpdateInput } from "src/definitions/globalTypes";

import AuthContext from "src/AuthContext";

const schema = yup.object().shape({
  id: yup.string(),
  email: yup.string().email().required("Email is required"),
  roles: yup.array().of(yup.string()),
});
type UserFormData = yup.InferType<typeof schema>;

export type UserEditData = {
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
  const [userRoles, setUserRoles] = useState(
    (user?.roles ?? []).map((role: string) => ({
      value: role,
      label: role,
    }))
  );
  const { register, handleSubmit, setValue, errors } = useForm({
    validationSchema: schema,
  });

  useEffect(() => {
    register({ name: "roles" });
    setValue("roles", []);
  }, [register]);

  const onSubmit = (formData: UserFormData) => {
    const userData = {
      ...formData,
      id: formData.id,
      email: formData.email,
      roles: formData.roles as RoleEnum[],
    };
    callback(userData);
  };

  const onRoleChange = (selectedRoles: { label: string; value: string }[]) => {
    setUserRoles(selectedRoles);
    setValue(
      "roles",
      selectedRoles.map((role) => role.value)
    );
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Form.Row>
        <Form.Control type="hidden" name="id" ref={register} value={user.id} />
        <Form.Group controlId="email" className="col-2">
          <Form.Control
            className={cx({ "is-invalid": errors.email })}
            name="email"
            type="email"
            placeholder="Email"
            ref={register}
            defaultValue={user.email}
          />
          <div className="invalid-feedback">{errors?.email?.message}</div>
        </Form.Group>
        {(Auth.user?.roles ?? []).includes("ADMIN") && (
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
        )}
      </Form.Row>
      <Form.Row>
        <div className="offset-2">
          <Button variant="primary" type="submit">
            Save
          </Button>
          <LinkContainer to={`/users/${username}`}>
            <Button variant="secondary">Cancel</Button>
          </LinkContainer>
          <div className="invalid-feedback d-block">{error}</div>
        </div>
      </Form.Row>
    </Form>
  );
};

export default UserForm;
