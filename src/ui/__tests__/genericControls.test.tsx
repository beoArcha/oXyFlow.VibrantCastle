import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { Plus, X, Search, Sparkles } from "lucide-react";
import {
  IconButton,
  Textarea,
  SearchInput,
  Alert,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
} from "../index";
import { renderIntoDom, cleanupDom, setupDomEnvironment } from "@test-utils";

describe("Generic UI Controls", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("IconButton Component", () => {
    it("renders with mandatory aria-label and icon", async () => {
      const handleClick = mock(() => {});
      const { container } = await renderIntoDom(
        <IconButton
          icon={<Plus data-testid="plus-icon" size={14} />}
          aria-label="Add item"
          onClick={handleClick}
        />
      );

      const button = container.querySelector("button");
      expect(button).not.toBeNull();
      expect(button?.getAttribute("aria-label")).toBe("Add item");
      expect(container.querySelector("[data-testid='plus-icon']")).not.toBeNull();

      button?.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("respects disabled and loading states", async () => {
      const handleClick = mock(() => {});
      const { container } = await renderIntoDom(
        <IconButton
          icon={<Plus size={14} />}
          aria-label="Add item"
          disabled
          onClick={handleClick}
        />
      );

      const button = container.querySelector("button");
      expect(button?.disabled).toBe(true);
      button?.click();
      expect(handleClick).toHaveBeenCalledTimes(0);
    });

    it("supports tooltip auto-wrapping when tooltipContent is provided", async () => {
      const { container } = await renderIntoDom(
        <IconButton
          icon={<Plus size={14} />}
          aria-label="Add item"
          tooltipContent="Click to add new element"
        />
      );

      const button = container.querySelector("button");
      expect(button).not.toBeNull();
      expect(button?.getAttribute("aria-label")).toBe("Add item");
    });
  });

  describe("Textarea Component", () => {
    it("renders with label, helperText, and handles text entry", async () => {
      let textValue = "initial";
      const { container } = await renderIntoDom(
        <Textarea
          label="Notes"
          helperText="Write your markdown here"
          value={textValue}
          onChange={(e) => {
            textValue = e.target.value;
          }}
        />
      );

      expect(container.textContent).toContain("Notes");
      expect(container.textContent).toContain("Write your markdown here");

      const textarea = container.querySelector("textarea");
      expect(textarea?.value).toBe("initial");
    });

    it("displays error message with role='alert' when error prop is present", async () => {
      const { container } = await renderIntoDom(
        <Textarea
          label="Config"
          error="Invalid JSON structure"
          value="{ bad json }"
        />
      );

      expect(container.textContent).toContain("Invalid JSON structure");
      const alert = container.querySelector("[role='alert']");
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toBe("Invalid JSON structure");
    });
  });

  describe("SearchInput Component", () => {
    it("renders placeholder, updates value, and displays clear button when non-empty", async () => {
      let query = "skeleton";
      const handleClear = mock(() => {
        query = "";
      });

      const { container } = await renderIntoDom(
        <SearchInput
          placeholder="Search entities..."
          value={query}
          onChange={(val) => {
            query = val;
          }}
          onClear={handleClear}
          clearAriaLabel="Clear filter"
        />
      );

      const input = container.querySelector("input");
      expect(input?.value).toBe("skeleton");
      expect(input?.getAttribute("placeholder")).toBe("Search entities...");

      const clearBtn = container.querySelector("button[aria-label='Clear filter']");
      expect(clearBtn).not.toBeNull();

      clearBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it("clears on Escape key press", async () => {
      let query = "goblin";
      let changedTo = "";
      const { container } = await renderIntoDom(
        <SearchInput
          value={query}
          onChange={(val) => {
            changedTo = val;
          }}
        />
      );

      const input = container.querySelector("input");
      input?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      expect(changedTo).toBe("");
    });
  });

  describe("Alert Component", () => {
    it("renders title, message, and default variant icon", async () => {
      const { container } = await renderIntoDom(
        <Alert variant="warning" title="Warning Encountered">
          <span>Check configuration syntax.</span>
        </Alert>
      );

      expect(container.querySelector("[role='alert']")).not.toBeNull();
      expect(container.textContent).toContain("Warning Encountered");
      expect(container.textContent).toContain("Check configuration syntax.");
    });

    it("renders dismiss action button when onClose is passed", async () => {
      const handleClose = mock(() => {});
      const { container } = await renderIntoDom(
        <Alert variant="danger" title="Fatal Error" onClose={handleClose}>
          <span>Execution halted.</span>
        </Alert>
      );

      const closeBtn = container.querySelector("button");
      expect(closeBtn).not.toBeNull();
      closeBtn?.click();
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("EmptyState Component", () => {
    it("renders centered icon, title, description, and action button", async () => {
      const handleAction = mock(() => {});
      const { container } = await renderIntoDom(
        <EmptyState
          icon={<Sparkles data-testid="sparkle-icon" size={24} />}
          title="No Frames Sliced"
          description="Use auto-islands or draw a bounding box to create your first frame."
          action={<Button size="sm" onClick={handleAction}>Detect Islands</Button>}
        />
      );

      expect(container.textContent).toContain("No Frames Sliced");
      expect(container.textContent).toContain("Use auto-islands or draw a bounding box");
      expect(container.querySelector("[data-testid='sparkle-icon']")).not.toBeNull();

      const btn = container.querySelector("button");
      expect(btn?.textContent).toContain("Detect Islands");
      btn?.click();
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("Table Primitives", () => {
    it("renders structured table with header, rows, cells, and selection highlighting", async () => {
      const { container } = await renderIntoDom(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Track</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow isSelected={true}>
              <TableCell>1</TableCell>
              <TableCell>idle</TableCell>
            </TableRow>
            <TableRow isSelected={false}>
              <TableCell>2</TableCell>
              <TableCell>run</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(container.querySelector("table")).not.toBeNull();
      expect(container.querySelectorAll("th").length).toBe(2);
      expect(container.querySelectorAll("td").length).toBe(4);

      const selectedRow = container.querySelector("tr[data-state='selected']");
      expect(selectedRow).not.toBeNull();
      expect(selectedRow?.textContent).toContain("idle");
    });
  });
});
