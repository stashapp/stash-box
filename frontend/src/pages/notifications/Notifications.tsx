import { FC } from "react";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import {
  useNotifications,
  useMarkNotificationsRead,
  NotificationEnum,
  useUnreadNotificationsCount,
} from "src/graphql";
import { useCurrentUser, useQueryParams, usePagination } from "src/hooks";
import { ROUTE_NOTIFICATION_SUBSCRIPTIONS } from "src/constants/route";
import { userHref, resolveEnum, NotificationType } from "src/utils";
import { ErrorMessage, Icon, LoadingIndicator } from "src/components/fragments";
import { List } from "src/components/list";
import { Notification } from "./Notification";

const PER_PAGE = 20;

const Notifications: FC = () => {
  const { user } = useCurrentUser();
  const { page, setPage } = usePagination();
  const [params, setParams] = useQueryParams({
    notification: { name: "notification", type: "string", default: "all" },
    unread: { name: "unread", type: "string", default: "false" },
  });
  const notification = resolveEnum(
    NotificationEnum,
    params.notification,
    undefined,
  );
  const unread = params.unread === "true";

  const { data: unreadNotificationsCount } = useUnreadNotificationsCount();
  const [markNotificationsRead, { loading: markingRead }] =
    useMarkNotificationsRead();
  const { loading, data } = useNotifications({
    input: {
      page,
      per_page: PER_PAGE,
      unread_only: unread,
      type: notification,
    },
  });

  if (loading) return <LoadingIndicator message="Loading notifications..." />;

  if (!loading && !data) return <ErrorMessage error="No notifications" />;

  const enumToOptions = (e: Record<string, string>) =>
    Object.keys(e).map((key) => (
      <option key={key} value={key}>
        {e[key]}
      </option>
    ));

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Notifications</h3>
        {user && (
          <>
            <Link
              to={userHref(user, ROUTE_NOTIFICATION_SUBSCRIPTIONS)}
              className="ms-auto"
            >
              <Button variant="link">
                <Icon icon={faEdit} className="me-2" />
                Edit Subscriptions
              </Button>
            </Link>
            <Button
              className="ms-2"
              onClick={() => markNotificationsRead()}
              disabled={
                markingRead ||
                !unreadNotificationsCount?.getUnreadNotificationCount
              }
            >
              Mark all as read
            </Button>
          </>
        )}
      </div>
      <List
        page={page}
        setPage={setPage}
        perPage={PER_PAGE}
        listCount={data?.queryNotifications.count}
        filters={
          <>
            <Form.Group className="mx-2 mb-3 d-flex flex-column">
              <Form.Label>Notification Type</Form.Label>
              <Form.Select
                onChange={(e) =>
                  setParams("notification", e.currentTarget.value)
                }
                value={notification}
                style={{ maxWidth: 250 }}
              >
                <option value="all" key="all-types">
                  All
                </option>
                {enumToOptions(NotificationType)}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="unread" className="text-center">
              <Form.Label>Unread Only</Form.Label>
              <Form.Check
                className="mt-2"
                type="switch"
                defaultChecked={unread}
                onChange={(e) =>
                  setParams("unread", e.currentTarget.checked.toString())
                }
              />
            </Form.Group>
          </>
        }
        loading={loading}
        entityName="notifications"
      >
        {data?.queryNotifications?.notifications?.map((n) => (
          <Notification
            key={`${n.created}-${n.data.__typename}`}
            notification={n}
          />
        ))}
      </List>
    </>
  );
};

export default Notifications;
