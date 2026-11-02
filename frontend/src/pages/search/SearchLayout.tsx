import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { Link, Outlet, useNavigate, useSearch } from "@tanstack/react-router";
import cx from "classnames";
import { type FC, useCallback, useEffect, useRef } from "react";
import { Badge, Form, Nav } from "react-bootstrap";

import { Icon } from "src/components/fragments";
import Title from "src/components/title";
import { useSearchAll } from "src/graphql";
import { useDebouncedCallback } from "src/hooks";

const CLASSNAME = "SearchPage";
const CLASSNAME_INPUT = `${CLASSNAME}-input`;

export const SearchLayout: FC = () => {
  const navigate = useNavigate({ from: "/search" });
  const searchParams = useSearch({ from: "/narrow/search" });
  const term = searchParams.q ?? "";

  const inputRef = useRef<HTMLInputElement>(null);
  const inputValueRef = useRef(term);

  useEffect(() => {
    if (inputRef.current && term !== inputValueRef.current) {
      inputRef.current.value = term;
      inputValueRef.current = term;
    }
  }, [term]);

  const debouncedSearch = useDebouncedCallback((searchTerm: string) => {
    navigate({
      to: ".",
      search: (previous) => ({ ...previous, q: searchTerm || undefined }),
      replace: true,
    });
  }, 200);

  const handleSearch = useCallback(
    (searchTerm: string) => {
      inputValueRef.current = searchTerm;
      debouncedSearch(searchTerm);
    },
    [debouncedSearch],
  );

  const { data: searchData } = useSearchAll({ term, limit: 10 }, !term);

  const performerCount = searchData?.searchPerformers.count;
  const sceneCount = searchData?.searchScenes.count;

  return (
    <div className={CLASSNAME}>
      <Title page={term || "Search"} />
      <Form.Group className={cx(CLASSNAME_INPUT, "mb-3")}>
        <Icon icon={faMagnifyingGlass} />
        <Form.Control
          ref={inputRef}
          defaultValue={term}
          onChange={(e) => handleSearch(e.currentTarget.value)}
          placeholder="Search for performer or scene"
          autoFocus
        />
      </Form.Group>

      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Link
            className="nav-link"
            to="/search"
            search={{ q: term || undefined }}
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: true, includeSearch: false }}
          >
            All
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Link
            className="nav-link"
            to="/search/performers"
            search={{ q: term || undefined }}
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: false, includeSearch: false }}
          >
            Performers
            {performerCount !== undefined && (
              <Badge bg="secondary" className="ms-2">
                {performerCount}
              </Badge>
            )}
          </Link>
        </Nav.Item>
        <Nav.Item>
          <Link
            className="nav-link"
            to="/search/scenes"
            search={{ q: term || undefined }}
            activeProps={{ className: "active", "aria-current": "page" }}
            activeOptions={{ exact: false, includeSearch: false }}
          >
            Scenes
            {sceneCount !== undefined && (
              <Badge bg="secondary" className="ms-2">
                {sceneCount}
              </Badge>
            )}
          </Link>
        </Nav.Item>
      </Nav>

      <Outlet />
    </div>
  );
};
