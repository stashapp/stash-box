import type { FC } from "react";
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

const URLChanges: FC<{ urls: URL[] }> = ({ urls }) => (
  <div className={CLASSNAME}>
    <ul className="ps-0">
      {urls.map((url) => (
        <li key={url.url} className="d-flex align-items-start">
          <SiteLink site={url.site} />
          <a
            href={url.url}
            target="_blank"
            rel="noopener noreferrer"
            className="d-inline-block w-50 flex-grow-1 text-break"
          >
            {url.url}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

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
              <URLChanges urls={oldURLs ?? []} />
            </>
          )}
        </Col>
      )}
      <Col xs={showDiff ? 5 : 10}>
        {(newURLs ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <URLChanges urls={newURLs ?? []} />
          </>
        )}
      </Col>
    </Row>
  ) : null;

export default URLChangeRow;
