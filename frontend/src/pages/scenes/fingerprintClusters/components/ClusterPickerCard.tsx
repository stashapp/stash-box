import type { FC } from "react";
import { Card } from "react-bootstrap";
import { useClusterPage } from "../ClusterPageContext";
import { ClusterCanvas } from "./ClusterCanvas";
import { ClusterList } from "./ClusterList";

export const ClusterPickerCard: FC = () => {
  const { activeCluster, switchTo, selection } = useClusterPage();
  return (
    <Card bg="dark" text="light" className="mb-3">
      <Card.Body>
        <div className="ClusterPicker">
          <div className="ClusterPicker-list">
            <ClusterList
              onSelect={(index) => {
                if (switchTo(index)) selection.clear();
              }}
            />
          </div>
          <div className="ClusterPicker-canvas">
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
