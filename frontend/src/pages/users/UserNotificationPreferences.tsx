import type { FC } from "react";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ROUTE_NOTIFICATIONS } from "src/constants/route";
import {
  NotificationEnum,
  useUpdateNotificationSubscriptions,
} from "src/graphql";
import {
  AlwaysOnEditingNotificationType,
  EditingNotificationType,
  ensureEnum,
  GeneralNotificationType,
  VotingNotificationType,
} from "src/utils";
import { useCurrentUser } from "../../hooks";

interface Props {
  user: {
    id: string;
    notification_subscriptions: NotificationEnum[];
  };
}

export const UserNotificationPreferences: FC<Props> = ({ user }) => {
  const { isEditor, isVoter } = useCurrentUser();

  const [updateSubscriptions, { loading: submitting }] =
    useUpdateNotificationSubscriptions();
  const activeNotifications: string[] = user.notification_subscriptions.map(
    (e) => e,
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subscriptions = data
      .getAll("subscriptions")
      .map((sub) => ensureEnum(NotificationEnum, sub.toString()));

    updateSubscriptions({ variables: { subscriptions } });
  };

  const renderSection = (
    title: string,
    entries: Record<string, string>,
    enabled: boolean,
    alwaysOn?: Record<string, string>,
  ) => (
    <>
      <h5 className="mt-4">{title}</h5>
      {Object.entries(entries).map(([key, value]) => (
        <Form.Check
          value={key}
          defaultChecked={enabled && activeNotifications.includes(key)}
          disabled={!enabled}
          id={key}
          label={value}
          key={key}
          name="subscriptions"
        />
      ))}
      {alwaysOn &&
        Object.entries(alwaysOn).map(([key, value]) => (
          <Form.Check
            checked
            disabled
            id={key}
            label={value}
            key={key}
            readOnly
            // No `name` so it stays out of the submitted FormData.
          />
        ))}
    </>
  );

  return (
    <>
      <Link to={ROUTE_NOTIFICATIONS}>
        <h6 className="mb-4">&larr; Notifications</h6>
      </Link>
      <h4>Active notification subscriptions</h4>
      <hr />

      <Form onSubmit={handleSubmit}>
        {renderSection("General", GeneralNotificationType, true)}
        {renderSection("Voting", VotingNotificationType, isVoter)}
        {renderSection(
          "Editing",
          EditingNotificationType,
          isEditor,
          isEditor ? AlwaysOnEditingNotificationType : undefined,
        )}
        <div className="mt-4">
          <Button type="reset" className="me-2">
            Reset
          </Button>
          <Button type="submit" disabled={submitting}>
            Save
          </Button>
        </div>
      </Form>
    </>
  );
};
