import React from "react";
import { InventoryPanel } from "@game-menu/inventory";

/**
 * Ekwipunek tab view rendered inside the shared GameMenuDialog body.
 */
export const InventoryModalView: React.FC = () => <InventoryPanel />;

InventoryModalView.displayName = "InventoryModalView";
export default InventoryModalView;
