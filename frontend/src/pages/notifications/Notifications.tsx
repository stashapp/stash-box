import { FC } from "react";
import {Button} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useNotifications } from "src/graphql";
import { usePagination } from "src/hooks";
import { ROUTE_NOTIFICATION_SUBSCRIPTIONS } from "src/constants/route";
import { userHref } from "src/utils";
import { useCurrentUser } from "src/hooks";
import { ErrorMessage } from "src/components/fragments";
import { List } from "src/components/list";
import { Notification } from "./Notification";

const PER_PAGE = 20;

const Notifications: FC = () => {
  const { user } = useCurrentUser();
  const { page, setPage } = usePagination();
  const { loading, data } = useNotifications({
    input: { page, per_page: PER_PAGE },
  });

  if (loading) return null;

  if (!loading && !data) return <ErrorMessage error="No notifications" />;

  return (
    <List
      page={page}
      setPage={setPage}
      perPage={PER_PAGE}
      listCount={data?.queryNotifications.count}
      filters={
        <>
          <span className="me-2">Notification type</span>
          <span className="me-auto">unread only checkbox</span>
          { user && (
            <Link to={userHref(user, ROUTE_NOTIFICATION_SUBSCRIPTIONS)}>
              <Button>Edit Subscriptions</Button>
            </Link>
          )}
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
  );
};

export default Notifications;
