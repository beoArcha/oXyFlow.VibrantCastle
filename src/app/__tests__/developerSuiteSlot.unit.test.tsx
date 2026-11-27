import { describe, it, expect, mock, afterEach } from "bun:test";
import React from "react";
import { act } from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { DeveloperSuiteSlot, type DeveloperSuiteLoader } from "../developerSuiteSlot";

const StubSuite: React.FC = () => <div data-testid="dev-suite-real">suite</div>;

const flushSuspense = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("DeveloperSuiteSlot", () => {
  afterEach(async () => {
    await cleanupDom();
  });

  it("renders the suite once the lazy loader resolves when the flag is on", async () => {
    const loader = mock(async () => ({ default: StubSuite }));
    const { container, unmount } = await renderIntoDom(
      <DeveloperSuiteSlot enabled loader={loader as DeveloperSuiteLoader} />
    );

    await flushSuspense();

    expect(loader).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="dev-suite-real"]')).not.toBeNull();
    await unmount();
  });

  it("never calls the loader and renders nothing when the flag is off", async () => {
    const loader = mock(async () => ({ default: StubSuite }));
    const { container, unmount } = await renderIntoDom(
      <DeveloperSuiteSlot enabled={false} loader={loader as DeveloperSuiteLoader} />
    );

    await flushSuspense();

    expect(loader).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="dev-suite-real"]')).toBeNull();
    await unmount();
  });

  it("renders nothing when no dev-build loader is available, even with the flag on", async () => {
    const { container, unmount } = await renderIntoDom(
      <DeveloperSuiteSlot enabled loader={undefined} />
    );

    await flushSuspense();

    expect(container.querySelector('[data-testid="dev-suite-real"]')).toBeNull();
    await unmount();
  });
});
