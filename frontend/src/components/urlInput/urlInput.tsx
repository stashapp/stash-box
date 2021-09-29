import React, { useRef, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Control, useFieldArray } from "react-hook-form";

import { useSites, ValidSiteTypeEnum } from "src/graphql";

const CLASSNAME = "URLInput";

interface URLInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  type: ValidSiteTypeEnum;
}

const URLInput: React.FC<URLInputProps> = ({ control, type }) => {
  const {
    fields: urls,
    append,
    remove,
  } = useFieldArray<
    { urls: Array<{ url: string; site: { id: string; name: string } }> },
    "urls",
    "key"
  >({
    control,
    name: "urls",
    keyName: "key",
  });
  const [newURL, setNewURL] = useState("");
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { data, loading } = useSites();

  if (loading) return <></>;
  const sites = (data?.querySites.sites ?? []).filter((s) =>
    s.valid_types.includes(type)
  );

  const cleanURL = (
    regexStr: string | undefined | null,
    url: string
  ): string | undefined => {
    if (!regexStr) return;

    const regex = new RegExp(regexStr);
    const match = regex.exec(url);

    return match?.[1];
  };

  const handleAdd = () => {
    if (!inputRef.current) return;
    const selectedSiteID = selectRef.current?.value;
    const selectedSite = sites.find((s) => s.id === selectedSiteID);
    const cleanedURL = cleanURL(selectedSite?.regex, inputRef.current.value);

    if (selectedSite)
      append({
        url: cleanedURL ?? inputRef.current.value,
        site: selectedSite,
      });
  };

  const handleBlur = () => {
    if (!inputRef.current) return;

    const url = inputRef.current.value;
    let selectedSiteID = selectRef.current?.value;
    if (selectedSiteID == "") {
      const matchedSite = sites.find(
        (s) => s.regex && new RegExp(s.regex).test(url)
      );
      if (matchedSite) {
        selectedSiteID = matchedSite.id;
        if (selectRef.current) selectRef.current.value = matchedSite.id;
      }
    }

    const selectedSite = sites.find((s) => s.id === selectedSiteID);
    if (selectedSite && selectedSite.regex && url) {
      const updatedURL = cleanURL(selectedSite.regex, url);
      if (updatedURL) inputRef.current.value = updatedURL;
    }
  };

  const handleRemove = (url: string) => {
    const index = urls.findIndex((u) => u.url === url);
    if (index !== -1) remove(index);
  };

  return (
    <div className={CLASSNAME}>
      <ul>
        {urls.map((u) => (
          <li key={u.url}>
            <InputGroup>
              <Button variant="danger" onClick={() => handleRemove(u.url)}>
                Remove
              </Button>
              <InputGroup.Text>
                <b>{u.site.name}</b>
              </InputGroup.Text>
              <InputGroup.Text className="overflow-hidden">
                {u.url}
              </InputGroup.Text>
            </InputGroup>
          </li>
        ))}
      </ul>
      <InputGroup>
        <InputGroup.Text>Add new link</InputGroup.Text>
        <Form.Control as="select" disabled={sites.length === 0} ref={selectRef}>
          <option disabled selected value="">
            Select site
          </option>
          {sites.length === 0 ? (
            <option>No valid sites</option>
          ) : (
            sites.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))
          )}
        </Form.Control>
        <Form.Control
          ref={inputRef}
          onBlur={handleBlur}
          placeholder="URL"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewURL(e.currentTarget.value)
          }
          className="w-50"
        />
        <Button
          onClick={handleAdd}
          disabled={!newURL && !!selectRef.current?.value}
        >
          Add
        </Button>
      </InputGroup>
    </div>
  );
};

export default URLInput;
