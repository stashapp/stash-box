import type { FC } from "react";
import { Table } from "react-bootstrap";

import { useModAudits } from "src/graphql";
import { usePagination } from "src/hooks";
import { ErrorMessage } from "src/components/fragments";
import { List } from "src/components/list";
import Title from "src/components/title";
import AuditRow from "./AuditRow";

const PER_PAGE = 25;

const AuditsComponent: FC = () => {
  const { page, setPage } = usePagination();
  const { loading, data } = useModAudits({
    input: {
      page,
      per_page: PER_PAGE,
    },
  });

  if (!loading && !data)
    return <ErrorMessage error="Failed to load audit logs." />;

  const audits = data?.queryModAudits.audits.map((audit) => (
    <AuditRow key={audit.id} audit={audit} />
  ));

  return (
    <>
      <Title page="Audit Logs" />
      <h3>Moderator Audit Logs</h3>
      <List
        entityName="audits"
        page={page}
        setPage={setPage}
        perPage={PER_PAGE}
        loading={loading}
        listCount={data?.queryModAudits.count}
      >
        <Table striped className="audits-table" variant="dark">
          <thead>
            <tr>
              <th style={{ width: "40px" }}></th>
              <th>Date</th>
              <th>Action</th>
              <th>User</th>
              <th>Target</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>{audits}</tbody>
        </Table>
      </List>
    </>
  );
};

export default AuditsComponent;
