import React from "react";
import { Card } from "react-bootstrap";
import { sortBy } from "lodash-es";
import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { LoadingIndicator, Tooltip } from "src/components/fragments";

import { useDrafts } from "src/graphql";

const DraftList: React.FC = () => {
  const { loading, data } = useDrafts();

  return (
    <>
      <h3 className="me-4">Drafts</h3>
      <Card>
        <Card.Body className="p-4">
          {loading && <LoadingIndicator message="Loading drafts..." />}
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
