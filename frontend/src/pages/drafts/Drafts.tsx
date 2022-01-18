import React from "react";
import { Button, Card } from "react-bootstrap";
import { sortBy } from "lodash-es";
import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { Icon, LoadingIndicator, Tooltip } from "src/components/fragments";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import { useDrafts, useDeleteDraft } from "src/graphql";

const DraftList: React.FC = () => {
  const { loading, data, refetch } = useDrafts();
  const [deleteDraft, { loading: destroying }] = useDeleteDraft();

  const handleDelete = (id: string) => {
    deleteDraft({ variables: { id } }).then(() => refetch());
  };

  return (
    <>
      <h3 className="me-4">Drafts</h3>
      <Card>
        <Card.Body className="p-4">
          {loading && <LoadingIndicator message="Loading drafts..." />}
          {!loading && data !== undefined && !data?.findDrafts.length && (
            <>
              <h6>No drafts saved.</h6>
              <p>Scene and performer drafts can be submitted from Stash.</p>
            </>
          )}
          <ul className="ps-0">
            {sortBy(data?.findDrafts ?? [], "expires").map((draft) => {
              const expirationDate = new Date(draft.expires as string);
              const expiration =
                expirationDate > new Date()
                  ? formatDistance(expirationDate, new Date())
                  : " a moment";
              return (
                <li key={draft.id} className="d-block">
                  {draft.data.__typename === "PerformerDraft" ? (
                    <Link to={`/drafts/${draft.id}`}>
                      Performer: <b>{draft.data.name}</b>
                    </Link>
                  ) : (
                    <Link to={`/drafts/${draft.id}`}>
                      Scene: <b>{draft.data.title}</b>
                    </Link>
                  )}
                  <span className="ms-2">
                    &bull;
                    <Tooltip delay={200} text={expirationDate.toLocaleString()}>
                      <small className="ms-2">Expires in {expiration}</small>
                    </Tooltip>
                  </span>
                  <Button
                    onClick={() => handleDelete(draft.id)}
                    disabled={destroying}
                    title="Delete draft"
                    variant="minimal"
                  >
                    <Icon icon={faTrash} color="red" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card.Body>
      </Card>
    </>
  );
};

export default DraftList;
