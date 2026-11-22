import type { ReactNode } from "react";
import { Col, Row } from "react-bootstrap";
import { LoadingIndicator } from "src/components/fragments";
import Pagination from "src/components/pagination";
import PerformerCard from "src/components/performerCard";

interface Props<T extends { id: string }> {
  partner: React.ComponentProps<typeof PerformerCard>["performer"];
  count: number;
  items: T[];
  loading: boolean;
  page: number;
  perPage: number;
  setPage: (page: number) => void;
  noun: string;
  pluralNoun?: string;
  renderItem: (item: T) => ReactNode;
}

export const PairingRowLayout = <T extends { id: string }>({
  partner,
  count,
  items,
  loading,
  page,
  perPage,
  setPage,
  noun,
  pluralNoun = `${noun}s`,
  renderItem,
}: Props<T>) => (
  <Row>
    <Col xs={3}>
      <PerformerCard performer={partner} />
    </Col>
    <Col xs={9}>
      <div className="d-flex align-items-start">
        <b className="mt-2">
          {new Intl.NumberFormat().format(count)}{" "}
          {count === 1 ? noun : pluralNoun} together
        </b>
        {count > perPage && (
          <Pagination
            onClick={setPage}
            count={count}
            perPage={perPage}
            active={page}
          />
        )}
      </div>
      {loading ? (
        <LoadingIndicator message={`Loading ${pluralNoun}...`} />
      ) : (
        <Row>
          {items.map((item) => (
            <Col xs={4} key={item.id}>
              {renderItem(item)}
            </Col>
          ))}
        </Row>
      )}
    </Col>
  </Row>
);
