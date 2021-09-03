import React from "react";
import { Row } from "react-bootstrap";

const CLASSNAME = "URLChangeRow";

interface URL {
  url: string;
  type: string;
}

interface URLChangeRowProps {
  newURLs?: URL[] | null;
  oldURLs?: URL[] | null;
  showDiff?: boolean;
}

const URLChangeRow: React.FC<URLChangeRowProps> = ({
  newURLs,
  oldURLs,
  showDiff,
}) =>
  (newURLs ?? []).length > 0 || (oldURLs ?? []).length > 0 ? (
    <Row className={CLASSNAME}>
      <b className="col-2 text-right">URLs</b>
      {showDiff && (
        <div className="col-5">
          {(oldURLs ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <ul>
                  {(oldURLs ?? []).map((u) => (
                    <li key={u.url}>{u.url}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
      <span className="col-5">
        {(newURLs ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <ul>
                {(newURLs ?? []).map((u) => (
                  <li key={u.url}>{u.url}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </span>
    </Row>
  ) : (
    <></>
  );

export default URLChangeRow;
