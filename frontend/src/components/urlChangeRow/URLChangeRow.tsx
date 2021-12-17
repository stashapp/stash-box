import { FC } from "react";
import { Col, Row } from "react-bootstrap";
import { SiteLink } from "src/components/fragments";

const CLASSNAME = "URLChangeRow";

export interface URL {
  url: string;
  site: {
    id: string;
    name: string;
    icon: string;
  };
}

interface URLChangeRowProps {
  newURLs?: URL[] | null;
  oldURLs?: URL[] | null;
  showDiff?: boolean;
}

const URLChangeRow: FC<URLChangeRowProps> = ({ newURLs, oldURLs, showDiff }) =>
  (newURLs ?? []).length > 0 || (oldURLs ?? []).length > 0 ? (
    <Row className={CLASSNAME}>
      <b className="col-2 text-end">Links</b>
      {showDiff && (
        <Col xs={5}>
          {(oldURLs ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <ul>
                  {(oldURLs ?? []).map((u) => (
                    <li key={u.url}>
                      <SiteLink site={u.site} />
                      <span>: {u.url}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Col>
      )}
      <Col xs={5}>
        {(newURLs ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <ul>
                {(newURLs ?? []).map((u) => (
                  <li key={u.url}>
                    <SiteLink site={u.site} />
                    <span>: {u.url}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </Col>
    </Row>
  ) : (
    <></>
  );

export default URLChangeRow;
