import React, { createRef, act } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabItem,
  LanguageSelector,
} from "@ui";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";

describe("UI Navigation Components (Tabs, LanguageSelector)", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("Tabs Component - Legacy Items Array Mode", () => {
    const mockItems: TabItem[] = [
      { id: "stats", label: "Stats", badge: 5 },
      { id: "inventory", label: "Inventory" },
      { id: "skills", label: "Skills", icon: <span data-testid="skill-icon">⚡</span> },
    ];

    it("renders tabs from items array with labels, badges, and icons", async () => {
      const handleChange = mock((_id: string) => {});
      const { container } = await renderIntoDom(
        <Tabs items={mockItems} activeId="stats" onChange={handleChange} />
      );

      expect(container.textContent).toContain("Stats");
      expect(container.textContent).toContain("5");
      expect(container.textContent).toContain("Inventory");
      expect(container.textContent).toContain("Skills");
      expect(container.querySelector("[data-testid='skill-icon']")).not.toBeNull();

      const tabs = container.querySelectorAll("[role='tab']");
      expect(tabs.length).toBe(3);
      expect(tabs[0].getAttribute("aria-selected")).toBe("true");
      expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    });

    it("triggers onChange with tab id when a tab is clicked", async () => {
      const handleChange = mock((_id: string) => {});
      const { container, click } = await renderIntoDom(
        <Tabs items={mockItems} activeId="stats" onChange={handleChange} />
      );

      const skillsTab = container.querySelectorAll("[role='tab']")[2];
      await click(skillsTab);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith("skills");
    });

    it("forwards ref to the legacy tablist container", async () => {
      const tabsRef = createRef<HTMLDivElement>();
      await renderIntoDom(
        <Tabs ref={tabsRef} items={mockItems} activeId="stats" onChange={() => {}} />
      );

      expect(tabsRef.current).not.toBeNull();
      expect(tabsRef.current?.getAttribute("role")).toBe("tablist");
    });
  });

  describe("Tabs Component - Compound Mode", () => {
    it("renders compound tabs and shows the active panel based on defaultValue", async () => {
      const { container } = await renderIntoDom(
        <Tabs defaultValue="audio">
          <Tabs.List>
            <Tabs.Trigger value="video">Video</Tabs.Trigger>
            <Tabs.Trigger value="audio">Audio</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="video">
            <p>Video Settings Panel</p>
          </Tabs.Content>
          <Tabs.Content value="audio">
            <p>Audio Settings Panel</p>
          </Tabs.Content>
        </Tabs>
      );

      expect(container.textContent).toContain("Audio Settings Panel");
      expect(container.textContent).not.toContain("Video Settings Panel");

      const triggers = container.querySelectorAll("[role='tab']");
      expect(triggers[0].getAttribute("aria-selected")).toBe("false");
      expect(triggers[1].getAttribute("aria-selected")).toBe("true");
    });

    it("switches tab content on trigger click in uncontrolled mode", async () => {
      const { container, click } = await renderIntoDom(
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Trigger value="tab1">First</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Second</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">
            <p>Content 1</p>
          </Tabs.Content>
          <Tabs.Content value="tab2">
            <p>Content 2</p>
          </Tabs.Content>
        </Tabs>
      );

      expect(container.textContent).toContain("Content 1");
      expect(container.textContent).not.toContain("Content 2");

      const secondTrigger = container.querySelectorAll("[role='tab']")[1];
      await click(secondTrigger);

      expect(container.textContent).not.toContain("Content 1");
      expect(container.textContent).toContain("Content 2");
    });

    it("supports controlled mode with value and onValueChange", async () => {
      const handleValueChange = mock((_val: string) => {});
      const { container, click } = await renderIntoDom(
        <Tabs value="active-val" onValueChange={handleValueChange}>
          <Tabs.List>
            <Tabs.Trigger value="first">First</Tabs.Trigger>
            <Tabs.Trigger value="active-val">Active</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="first">
            <p>First Content</p>
          </Tabs.Content>
          <Tabs.Content value="active-val">
            <p>Active Content</p>
          </Tabs.Content>
        </Tabs>
      );

      expect(container.textContent).toContain("Active Content");

      const firstTrigger = container.querySelectorAll("[role='tab']")[0];
      await click(firstTrigger);

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange).toHaveBeenCalledWith("first");
    });

    it("keeps content in DOM when forceMount is enabled", async () => {
      const { container } = await renderIntoDom(
        <Tabs defaultValue="tabA">
          <Tabs.List>
            <Tabs.Trigger value="tabA">A</Tabs.Trigger>
            <Tabs.Trigger value="tabB">B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tabA">Panel A</Tabs.Content>
          <Tabs.Content value="tabB" forceMount>
            <span data-testid="mounted-hidden">Panel B Forced</span>
          </Tabs.Content>
        </Tabs>
      );

      const forcedElement = container.querySelector("[data-testid='mounted-hidden']");
      expect(forcedElement).not.toBeNull();
      expect(forcedElement?.parentElement?.getAttribute("hidden")).toBe("");
    });

    it("forwards refs to Tabs, TabsList, TabsTrigger, and TabsContent", async () => {
      const rootRef = createRef<HTMLDivElement>();
      const listRef = createRef<HTMLDivElement>();
      const triggerRef = createRef<HTMLButtonElement>();
      const contentRef = createRef<HTMLDivElement>();

      await renderIntoDom(
        <Tabs ref={rootRef} defaultValue="hero">
          <Tabs.List ref={listRef}>
            <Tabs.Trigger ref={triggerRef} value="hero">
              Hero
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content ref={contentRef} value="hero">
            Hero Panel
          </Tabs.Content>
        </Tabs>
      );

      expect(rootRef.current).not.toBeNull();
      expect(listRef.current?.getAttribute("role")).toBe("tablist");
      expect(triggerRef.current?.getAttribute("role")).toBe("tab");
      expect(contentRef.current?.getAttribute("role")).toBe("tabpanel");
    });

    it("supports standalone named exports (TabsList, TabsTrigger, TabsContent)", async () => {
      const { container } = await renderIntoDom(
        <Tabs defaultValue="alpha">
          <TabsList>
            <TabsTrigger value="alpha">Alpha</TabsTrigger>
          </TabsList>
          <TabsContent value="alpha">Alpha Content</TabsContent>
        </Tabs>
      );

      expect(container.textContent).toContain("Alpha Content");
    });

    it("handles keyboard navigation (ArrowRight, ArrowLeft, Home, End) in TabsList", async () => {
      const { container } = await renderIntoDom(
        <Tabs defaultValue="t1">
          <Tabs.List>
            <Tabs.Trigger value="t1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="t2">Tab 2</Tabs.Trigger>
            <Tabs.Trigger value="t3">Tab 3</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="t1">P1</Tabs.Content>
          <Tabs.Content value="t2">P2</Tabs.Content>
          <Tabs.Content value="t3">P3</Tabs.Content>
        </Tabs>
      );

      const triggers = container.querySelectorAll<HTMLButtonElement>("[role='tab']");
      const list = container.querySelector("[role='tablist']") as HTMLElement;

      // Trigger ArrowRight on list
      await act(async () => {
        list.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      });
      expect(triggers[1].getAttribute("aria-selected")).toBe("true");
      expect(container.textContent).toContain("P2");

      // Trigger End key on list
      await act(async () => {
        list.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
      });
      expect(triggers[2].getAttribute("aria-selected")).toBe("true");
      expect(container.textContent).toContain("P3");

      // Trigger Home key on list
      await act(async () => {
        list.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
      });
      expect(triggers[0].getAttribute("aria-selected")).toBe("true");
      expect(container.textContent).toContain("P1");
    });
  });

  describe("LanguageSelector Component", () => {
    it("renders default pills variant with PL and EN buttons", async () => {
      const { container } = await renderIntoDom(<LanguageSelector />);

      const group = container.querySelector("[role='group']");
      expect(group).not.toBeNull();
      expect(group?.getAttribute("aria-label")).toBe("Language selection");

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent?.trim()).toBe("PL");
      expect(buttons[1].textContent?.trim()).toBe("EN");
    });

    it("forwards ref to the outer container element", async () => {
      const containerRef = createRef<HTMLDivElement>();
      await renderIntoDom(<LanguageSelector ref={containerRef} />);

      expect(containerRef.current).not.toBeNull();
      expect(containerRef.current?.tagName.toLowerCase()).toBe("div");
    });

    it("triggers setLanguage and onChange when pill is clicked", async () => {
      const handleChange = mock((_lang: string) => {});
      const { container, click } = await renderIntoDom(
        <LanguageSelector onChange={handleChange} />
      );

      const buttons = container.querySelectorAll("button");
      // Click English
      await click(buttons[1]);

      expect(handleChange).toHaveBeenCalledWith("en");
      expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
    });

    it("renders select dropdown variant when variant='select' is specified", async () => {
      const handleChange = mock((_lang: string) => {});
      const { container, changeSelect } = await renderIntoDom(
        <LanguageSelector variant="select" onChange={handleChange} />
      );

      const select = container.querySelector("select") as HTMLSelectElement;
      expect(select).not.toBeNull();
      expect(select.options.length).toBe(2);
      expect(select.options[0].value).toBe("pl");
      expect(select.options[1].value).toBe("en");

      await changeSelect(select, "en");
      expect(handleChange).toHaveBeenCalledWith("en");
    });

    it("respects showIcon=false", async () => {
      const { container } = await renderIntoDom(<LanguageSelector showIcon={false} />);
      const icon = container.querySelector("svg");
      expect(icon).toBeNull();
    });
  });
});
