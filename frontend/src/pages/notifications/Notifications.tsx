import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { getRouteApi, Link } from "@tanstack/react-router";
import type { FC } from "react";
import { Button, Form } from "react-bootstrap";
import { ErrorMessage, Icon, LoadingIndicator } from "src/components/fragments";
import { List } from "src/components/list";
import { ROUTE_NOTIFICATION_SUBSCRIPTIONS } from "src/constants/route";
import {
  NotificationEnum,
  useMarkNotificationsRead,
  useNotifications,
  useUnreadNotificationsCount,
} from "src/graphql";
import { useCurrentUser, usePagination } from "src/hooks";
import { useUpdateSearch } from "src/hooks/useUpdateSearch";
import { searchEnum } from "src/routing/search";
import { NotificationType } from "src/utils";
import { Notification } from "./Notification";

const routeApi = getRouteApi("/narrow/notifications");

const PER_PAGE = 20;

const Notifications: FC = () => {
  const { user } = useCurrentUser();
  const { page, setPage } = usePagination();
  const params = routeApi.useSearch();
  const updateSearch = useUpdateSearch();
  const notification = params.notification;
  const unread = params.unread === true;

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
              to={ROUTE_NOTIFICATION_SUBSCRIPTIONS}
              params={user}
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
                !unreadNotificationsCount?.getUnreadNotificationCount.total
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
                  updateSearch({
                    notification: searchEnum(
                      NotificationEnum,
                      e.currentTarget.value,
                    ),
                  })
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
                  updateSearch({ unread: e.currentTarget.checked })
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
