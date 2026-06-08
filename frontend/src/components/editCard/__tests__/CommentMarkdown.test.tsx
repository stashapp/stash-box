import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import CommentMarkdown from "../CommentMarkdown";

const id = "550e8400-e29b-41d4-a716-446655440000";
const id2 = "11111111-2222-3333-4444-555555555555";

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("CommentMarkdown @mention rendering", () => {
  it("renders @<uuid> as a link to the user when resolved", () => {
    wrap(
      <CommentMarkdown
        text={`hey @${id} welcome`}
        mentions={[{ id, name: "Alice" }]}
      />,
    );
    const link = screen.getByRole("link", { name: "@Alice" });
    expect(link).toHaveAttribute("href", "/users/Alice");
  });

  it("falls back to the raw uuid when the mention isn't resolved", () => {
    wrap(<CommentMarkdown text={`hey @${id}`} mentions={[]} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText(`hey @${id}`)).toBeInTheDocument();
  });

  it("renders multiple mentions in one paragraph", () => {
    wrap(
      <CommentMarkdown
        text={`@${id} met @${id2} today`}
        mentions={[
          { id, name: "Alice" },
          { id: id2, name: "Bob" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "@Alice" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "@Bob" })).toBeInTheDocument();
  });

  it("leaves mentions inside an inline code span untouched", () => {
    wrap(
      <CommentMarkdown
        text={`code: \`@${id}\``}
        mentions={[{ id, name: "Alice" }]}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    const code = screen.getByText(`@${id}`);
    expect(code.tagName).toBe("CODE");
  });

  it("renders mentions inside emphasis", () => {
    const { container } = wrap(
      <CommentMarkdown
        text={`*hey @${id}*`}
        mentions={[{ id, name: "Alice" }]}
      />,
    );
    const em = container.querySelector("em");
    expect(em).not.toBeNull();
    expect(
      within(em as HTMLElement).getByRole("link", { name: "@Alice" }),
    ).toBeInTheDocument();
  });
});
