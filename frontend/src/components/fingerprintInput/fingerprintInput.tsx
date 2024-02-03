import { FC, useRef, useState } from "react";
import { FingerprintAlgorithm, useSites } from "src/graphql";
import {
  Control,
  FieldError,
  FieldErrorsImpl,
  Merge,
  useFieldArray,
} from "react-hook-form";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Icon } from "../fragments";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

const CLASSNAME = "FingerprintInput";

type Fingerprint = {
  algorithm: FingerprintAlgorithm;
  hash: string;
  duration: number;
};

type ControlType =
  | Control<{ fingerprints?: Fingerprint[] | undefined }, "fingerprints">
  | undefined;
type ErrorsType = Merge<
  FieldError,
  (Merge<FieldError, FieldErrorsImpl<Fingerprint>> | undefined)[]
>;

interface FingerprintInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  errors?: ErrorsType;
}

const FingerprintInput: FC<FingerprintInputProps> = ({ control, errors }) => {
  const {
    fields: fingerprints,
    append,
    remove,
  } = useFieldArray({
    control: control as ControlType,
    name: "fingerprints",
    keyName: "key",
  });

  const [newHash, setNewHash] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<NonNullable<FingerprintAlgorithm>>();
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const inputHashRef = useRef<HTMLInputElement | null>(null);
  const inputDurationRef = useRef<HTMLInputElement | null>(null);
  const { loading } = useSites();

  if (loading) return <></>;
  const algorithms: string[] = [];
  for (const a in FingerprintAlgorithm) {
    algorithms.push(a);
  }

  const cleanDuration = (durationStr: string): number | undefined => {
    if (!durationStr) return;

    const match = /^[0-9]+$/.test(durationStr);
    if (match) {
      return parseInt(durationStr);
    }
    return;
  };

  const handleAdd = () => {
    if (!newHash || !selectedAlgorithm || !newDuration) return;
    const duration = cleanDuration(newDuration);
    if (!duration) return;

    if (!fingerprints.some((u) => u.hash === newHash))
      append({
        hash: newHash,
        algorithm: selectedAlgorithm,
        duration: duration,
      });

    if (selectRef.current) selectRef.current.value = "";
    if (inputHashRef.current) inputHashRef.current.value = "";
    if (inputDurationRef.current) inputDurationRef.current.value = "";
    setSelectedAlgorithm(undefined);
    setNewDuration("");
    setNewHash("");
  };

  const handleHashInput = (hash: string) => {
    if (!inputHashRef.current || !selectRef.current) return;

    if (hash) {
      inputHashRef.current.value = hash;
      setNewHash(hash);
      return true;
    }
    return false;
  };

  const handleDurationInput = (durationStr: string) => {
    if (!inputDurationRef.current || !selectRef.current) return;

    if (durationStr) {
      inputDurationRef.current.value = durationStr;
      setNewDuration(durationStr);
      return true;
    }
    return false;
  };

  const handleHashPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const match = handleHashInput(e.clipboardData.getData("text/plain"));
    if (match) {
      e.preventDefault();
      setNewHash(e.currentTarget.value);
    }
  };

  const handleDurationPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const match = handleDurationInput(e.clipboardData.getData("text/plain"));
    if (match) {
      e.preventDefault();
      setNewDuration(e.currentTarget.value);
    }
  };

  const handleAlgoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const algo =
      FingerprintAlgorithm[
        e.currentTarget.value as keyof typeof FingerprintAlgorithm
      ];
    if (algo) setSelectedAlgorithm(algo);
  };

  return (
    <div className={CLASSNAME}>
      <ul>
        {fingerprints.map((u, i) => (
          <li key={u.hash}>
            <InputGroup>
              <Button variant="danger" onClick={() => remove(i)}>
                Remove
              </Button>
              <InputGroup.Text>
                <b>{u.algorithm}</b>
              </InputGroup.Text>
              <InputGroup.Text className="overflow-hidden">
                {u.hash}
              </InputGroup.Text>
              <Button variant="primary" href={u.hash} target="_blank">
                <Icon icon={faExternalLinkAlt} />
              </Button>
            </InputGroup>
            {errors?.[i]?.hash && (
              <div className="text-danger">{errors?.[i]?.hash?.message}</div>
            )}
          </li>
        ))}
      </ul>
      <InputGroup>
        <InputGroup.Text>Add new hash</InputGroup.Text>
        <Form.Control
          as="select"
          ref={selectRef}
          onChange={handleAlgoSelect}
          defaultValue=""
        >
          <option disabled value="">
            Select algorithm
          </option>
          {algorithms.length === 0 ? (
            <option>No valid algorithms</option>
          ) : (
            algorithms.map((s) => (
              <option value={s} key={s}>
                {s}
              </option>
            ))
          )}
        </Form.Control>
        <Form.Control
          ref={inputDurationRef}
          onBlur={(e) => handleDurationInput(e.currentTarget.value)}
          placeholder="Duration (seconds)"
          onChange={(e) => setNewDuration(e.currentTarget.value)}
          onPaste={handleDurationPaste}
          className="w-20"
        />
        <Form.Control
          ref={inputHashRef}
          onBlur={(e) => handleHashInput(e.currentTarget.value)}
          placeholder="Hash"
          onChange={(e) => setNewHash(e.currentTarget.value)}
          onPaste={handleHashPaste}
          className="w-20"
        />
        <Button
          onClick={handleAdd}
          disabled={!newHash || !selectedAlgorithm || !newDuration}
        >
          Add
        </Button>
      </InputGroup>
    </div>
  );
};

export default FingerprintInput;
