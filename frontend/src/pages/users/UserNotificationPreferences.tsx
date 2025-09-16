import type { FC } from "react";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ROUTE_NOTIFICATIONS } from "src/constants/route";
import {
    NotificationEnum, useUpdateFavoriteNotificationSubscriptions,
    useUpdateNotificationSubscriptions,
} from "src/graphql";
import {ensureEnum, AdminNotificationType, FavoriteNotificationType} from "src/utils";

interface Props {
  user: {
    id: string;
    notification_subscriptions: NotificationEnum[];
  };
}

export const UserNotificationPreferences: FC<Props> = ({ user }) => {
  const [updateAdminSubscriptions, { loading: submittingAdmin }] =
    useUpdateNotificationSubscriptions();
  const [updateFavoriteSubscriptions, { loading: submittingFavorite }] =
      useUpdateFavoriteNotificationSubscriptions();
  const activeNotifications: string[] = user.notification_subscriptions.map(
    (e) => e,
  );

  const handleAdminSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subscriptions = data
      .getAll("adminSubscriptions")
      .map((sub) => ensureEnum(NotificationEnum, sub.toString()));

    updateAdminSubscriptions({ variables: { subscriptions } });
  };

  const handleFavoriteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subscriptions = data
      .getAll("favoriteSubscriptions")
      .map((sub) => ensureEnum(NotificationEnum, sub.toString()));

    updateFavoriteSubscriptions({ variables: { subscriptions } });
  };

  return (
    <>
      <Link to={ROUTE_NOTIFICATIONS}>
        <h6 className="mb-4">&larr; Notifications</h6>
      </Link>
      <h4>Active notification subscriptions</h4>
      <hr />

      <h3>Admin Subscriptions</h3>
      <Form onSubmit={handleAdminSubmit}>
        {Object.entries(AdminNotificationType).map(([key, value]) => (
          <Form.Check
            value={key}
            defaultChecked={activeNotifications.includes(key)}
            id={key}
            label={value}
            key={key}
            name="adminSubscriptions"
          />
        ))}
        <div className="mt-4">
          <Button type="reset" className="me-2">
            Reset
          </Button>
          <Button type="submit" disabled={submittingAdmin}>
            Save
          </Button>
        </div>
      </Form>

      <h3 className="mt-4">Favorite Subscriptions</h3>
      <Form onSubmit={handleFavoriteSubmit}>
        {Object.entries(FavoriteNotificationType).map(([key, value]) => (
            <Form.Check
                value={key}
                defaultChecked={activeNotifications.includes(key)}
                id={key}
                label={value}
                key={key}
                name="favoriteSubscriptions"
            />
        ))}
        <div className="mt-4">
          <Button type="reset" className="me-2">
            Reset
          </Button>
          <Button type="submit" disabled={submittingFavorite}>
            Save
          </Button>
        </div>
      </Form>
    </>
  );
};
