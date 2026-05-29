import type { FC } from "react";
import { Card, Form } from "react-bootstrap";
import { LoadingIndicator } from "src/components/fragments";
import { SLIDER_MIN, SLIDER_STEP } from "./hooks/useClusterDistance";

interface Props {
  distance: number;
  max: number;
  loading: boolean;
  onChange: (n: number) => void;
}

export const ClusterDistanceCard: FC<Props> = ({
  distance,
  max,
  loading,
  onChange,
}) => (
  <Card bg="dark" text="light" className="mb-3">
    <Card.Body>
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <Form.Label className="mb-0">Distance: {distance}</Form.Label>
        <Form.Range
          className="ClusterDistanceSlider"
          min={SLIDER_MIN}
          max={max}
          step={SLIDER_STEP}
          value={distance}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {loading && <LoadingIndicator message="Computing clusters..." />}
      </div>
    </Card.Body>
  </Card>
);
