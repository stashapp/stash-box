import type { FC } from "react";
import { Card } from "react-bootstrap";
import { ClusterCanvas } from "./ClusterCanvas";
import { ClusterList } from "./ClusterList";
import { useClusterPage } from "./ClusterPageContext";

export const ClusterPickerCard: FC = () => {
  const { activeCluster, switchTo, selection } = useClusterPage();
  return (
    <Card bg="dark" text="light" className="mb-3">
      <Card.Body>
        <div className="d-flex gap-3" style={{ minHeight: 520 }}>
          <div
            style={{
              width: 320,
              flexShrink: 0,
              maxHeight: 620,
              overflowY: "auto",
            }}
          >
            <ClusterList
              onSelect={(index) => {
                if (switchTo(index)) selection.clear();
              }}
            />
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            {activeCluster ? (
              <ClusterCanvas />
            ) : (
              <div className="text-muted py-4 text-center">
                Select a cluster from the list to inspect it.
              </div>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
