import { describe, it, expect, mock, afterEach } from "bun:test";
import { act } from "react";
import { useModalCoordinator } from "../useModalCoordinator";
import { ModalId } from "@game-menu/modal/modalRegistry";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";

async function renderCoordinator() {
  const setPaused = mock((_paused: boolean) => {});
  const togglePause = mock(() => {});
  const rendered = await renderCustomHook(() =>
    useModalCoordinator({ setPaused, togglePause })
  );
  return { ...rendered, setup: { setPaused, togglePause } };
}

describe("useModalCoordinator pause semantics", () => {
  afterEach(async () => {
    await cleanupDom();
  });

  it("pauses the engine when a pausing modal opens", async () => {
    const { result, unmount, setup } = await renderCoordinator();

    await act(async () => {
      result.current.openModal(ModalId.Menu);
    });

    expect(setup.setPaused).toHaveBeenLastCalledWith(true);
    expect(result.current.modalManager.activeModal).toBe(ModalId.Menu);

    await unmount();
  });

  it("keeps the game running when a non-pausing modal (Inventory) opens", async () => {
    const { result, unmount, setup } = await renderCoordinator();

    await act(async () => {
      result.current.openModal(ModalId.Inventory);
    });

    expect(setup.setPaused).not.toHaveBeenCalled();
    expect(result.current.modalManager.activeModal).toBe(ModalId.Inventory);

    await unmount();
  });

  it("resumes the engine when switching from a pausing modal to a non-pausing one", async () => {
    const { result, unmount, setup } = await renderCoordinator();

    await act(async () => {
      result.current.openModal(ModalId.Menu);
    });
    await act(async () => {
      result.current.openModal(ModalId.Inventory);
    });

    expect(setup.setPaused).toHaveBeenLastCalledWith(false);

    await unmount();
  });

  it("resumes the engine when a pausing modal closes", async () => {
    const { result, unmount, setup } = await renderCoordinator();

    await act(async () => {
      result.current.openModal(ModalId.Help);
    });
    await act(async () => {
      result.current.closeModal();
    });

    expect(setup.setPaused).toHaveBeenLastCalledWith(false);
    expect(result.current.modalManager.activeModal).toBe(ModalId.None);

    await unmount();
  });

  it("delegates togglePause to the engine when no modal is open", async () => {
    const { result, unmount, setup } = await renderCoordinator();

    await act(async () => {
      result.current.togglePause();
    });

    expect(setup.togglePause).toHaveBeenCalledTimes(1);
    expect(setup.setPaused).not.toHaveBeenCalled();

    await unmount();
  });

  it("resumes the game (instead of toggling the engine) when togglePause runs with a modal open", async () => {
    const { result, unmount, setup } = await renderCoordinator();

    await act(async () => {
      result.current.openModal(ModalId.Menu);
    });
    await act(async () => {
      result.current.togglePause();
    });

    expect(setup.togglePause).not.toHaveBeenCalled();
    expect(setup.setPaused).toHaveBeenLastCalledWith(false);
    expect(result.current.modalManager.activeModal).toBe(ModalId.None);

    await unmount();
  });

  it("closes the modal when toggling the already-open modal", async () => {
    const { result, unmount, setup } = await renderCoordinator();

    await act(async () => {
      result.current.toggleModal(ModalId.Menu);
    });
    expect(result.current.modalManager.activeModal).toBe(ModalId.Menu);
    expect(setup.setPaused).toHaveBeenLastCalledWith(true);

    await act(async () => {
      result.current.toggleModal(ModalId.Menu);
    });
    expect(result.current.modalManager.activeModal).toBe(ModalId.None);
    expect(setup.setPaused).toHaveBeenLastCalledWith(false);

    await unmount();
  });
});
