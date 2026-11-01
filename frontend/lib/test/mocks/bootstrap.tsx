import type { ComponentProps } from "react";
import type { Modal as BootstrapModal } from "react-bootstrap";

export const withoutModalAnimation = (Modal: typeof BootstrapModal) =>
  Object.assign(
    (props: ComponentProps<typeof Modal>) => (
      <Modal {...props} animation={false} />
    ),
    Modal,
  );
