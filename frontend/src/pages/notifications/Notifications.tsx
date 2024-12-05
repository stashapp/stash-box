import { FC } from "react";
import { useNotifications } from "src/graphql";
import { usePagination } from "src/hooks";
import { ErrorMessage } from "src/components/fragments";
import { List } from "src/components/list";
import { Notification } from "./Notification";

const PER_PAGE = 20;

const Notifications: FC = () => {
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
