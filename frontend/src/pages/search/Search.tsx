import { type FC, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge, Form, Nav } from "react-bootstrap";
import { debounce } from "lodash-es";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

import { Icon, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";
import { createHref } from "src/utils";
import { ROUTE_SEARCH } from "src/constants/route";
import { useSearchAll } from "src/graphql";

import { SearchAll } from "./SearchAll";
import { SearchPerformersTab } from "./SearchPerformersTab";
import { SearchScenesTab } from "./SearchScenesTab";

const CLASSNAME = "SearchPage";
const CLASSNAME_INPUT = `${CLASSNAME}-input`;

const getTabPath = (tab: string, searchTerm: string) => {
  if (!searchTerm) {
    return tab === "all" ? "/search" : `/search/${tab}`;
  }
  return tab === "all"
    ? createHref(ROUTE_SEARCH, { "*": searchTerm })
    : `/search/${tab}/${searchTerm}`;
};

export const Search: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract current tab and term from the path
  // Routes are: /search/{term}, /search/performers/{term}, /search/scenes/{term}
  let currentTab = "all";
  let term = "";

  const pathAfterSearch = location.pathname.replace(/^\/search\/?/, "");

  if (pathAfterSearch) {
    if (pathAfterSearch.startsWith("performers/")) {
      currentTab = "performers";
      term = decodeURIComponent(pathAfterSearch.slice("performers/".length));
    } else if (pathAfterSearch.startsWith("scenes/")) {
      currentTab = "scenes";
      term = decodeURIComponent(pathAfterSearch.slice("scenes/".length));
    } else if (
      pathAfterSearch === "performers" ||
      pathAfterSearch === "scenes"
    ) {
      currentTab = pathAfterSearch;
      term = "";
    } else {
      term = decodeURIComponent(pathAfterSearch);
    }
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string, tab: string) => {
        const path = getTabPath(tab, searchTerm);
        navigate(path, { replace: true });
      }, 200),
    [navigate],
  );

  const handleSearch = useCallback(
    (searchTerm: string) => {
      debouncedSearch(searchTerm, currentTab);
    },
    [debouncedSearch, currentTab],
  );

  const handleTabChange = (tab: string) => {
    const path = getTabPath(tab, term);
    navigate(path);
  };

  const { data: searchData, loading: searchLoading } = useSearchAll(
    { term: term ?? "", limit: 10 },
    !term,
  );

  const performerCount = searchData?.searchPerformer.count;
  const sceneCount = searchData?.searchScene.count;

  const renderContent = () => {
    if (!term) return null;

    switch (currentTab) {
      case "performers":
        return <SearchPerformersTab term={term} key={term} />;
      case "scenes":
        return <SearchScenesTab term={term} key={term} />;
      default:
        if (searchLoading) {
          return <LoadingIndicator message="Searching..." />;
        }
        return <SearchAll data={searchData} key={term} />;
    }
  };

  return (
    <div className={CLASSNAME}>
      <Title page={term || "Search"} />
      <Form.Group className={cx(CLASSNAME_INPUT, "mb-3")}>
        <Icon icon={faMagnifyingGlass} />
        <Form.Control
          key={term}
          defaultValue={term}
          onChange={(e) => handleSearch(e.currentTarget.value)}
          placeholder="Search for performer or scene"
          autoFocus
        />
      </Form.Group>

      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link
            as="button"
            active={currentTab === "all"}
            onClick={() => handleTabChange("all")}
          >
            All
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            as="button"
            active={currentTab === "performers"}
            onClick={() => handleTabChange("performers")}
          >
            Performers
            {performerCount !== undefined && (
              <Badge bg="secondary" className="ms-2">
                {performerCount}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            as="button"
            active={currentTab === "scenes"}
            onClick={() => handleTabChange("scenes")}
          >
            Scenes
            {sceneCount !== undefined && (
              <Badge bg="secondary" className="ms-2">
                {sceneCount}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {renderContent()}
    </div>
  );
};

