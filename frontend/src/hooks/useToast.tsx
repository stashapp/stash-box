import React, { useEffect, useState, useContext, createContext } from "react";
import { Toast } from "react-bootstrap";

interface Message {
  id: number;
  content: React.ReactNode | string;
  variant?: "success" | "danger" | "warning";
}

const DISPLAY_TIME = 5000;
const ANIMATION_TIME = 1000;

const ToastContext = createContext<(item: Omit<Message, "id">) => void>(
  () => {}
);

const ToastMessage: React.FC<Message> = ({ id, content, variant }) => {
  const [show, setShow] = useState(true);

  return (
    <Toast
      autohide
      key={id}
      show={show}
      onClose={() => setShow(false)}
      className={`bg-${variant ?? "success"}`}
      delay={DISPLAY_TIME}
    >
      <Toast.Header />
      <Toast.Body>{content}</Toast.Body>
    </Toast>
  );
};

interface ToastsProps {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
}

const Toasts: React.FC<ToastsProps> = ({ messages, setMessages }) => {
  const timer = React.useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (messages.length)
      timer.current = setTimeout(
        () => setMessages?.([]),
        DISPLAY_TIME + ANIMATION_TIME
      );
  }, [messages, setMessages]);

  const toasts = messages.map((toast) => (
    <ToastMessage key={toast.id} {...toast} />
  ));

  return <div className="ToastContainer">{toasts}</div>;
};

interface Props {
  children?: React.ReactNode;
}

export const ToastProvider: React.FC<Props> = ({ children }) => {
  const id = React.useRef(0);
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (message: Omit<Message, "id">) => {
    console.log(messages);
    setMessages([...messages, { ...message, id: id.current++ }]);
  };

  return (
    <ToastContext.Provider value={addMessage}>
      {children}
      <Toasts messages={messages} setMessages={setMessages} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const addToast = useContext(ToastContext);
  return addToast;
};
