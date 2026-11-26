import React from "react";
import { Layers, Database, FlaskConical, Bug, ScrollText } from "lucide-react";
import { AtlasSlicerSubtab } from "@developer/subtabs/atlas/AtlasSlicerSubtab";
import { DataStudioSubtab } from "@developer/subtabs/datastudio/DataStudioSubtab";
import { TestingSubtab } from "@developer/subtabs/testing/TestingSubtab";
import { DebugSubtab } from "@developer/subtabs/debug/DebugSubtab";
import { LogsSubtab } from "@developer/subtabs/logs/LogsSubtab";

export enum DevToolId {
  AtlasSlicer = "atlas-slicer",
  DataStudio = "data-studio",
  Testing = "testing",
  Debug = "debug",
  Logs = "logs",
}

export interface DevToolRenderContext {
  readonly navigateToTool: (toolId: DevToolId) => void;
}

export interface DevToolDefinition {
  readonly id: DevToolId;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly render: (ctx: DevToolRenderContext) => React.ReactNode;
}

/**
 * Open/Closed Registry of all Creation & Developer Studio subtabs.
 * Adding a new studio tool requires only registering a new entry here.
 */
export const DEV_TOOL_REGISTRY: readonly DevToolDefinition[] = [
  {
    id: DevToolId.AtlasSlicer,
    label: "Atlas i meta.json",
    icon: <Layers size={14} className="text-emerald-400 shrink-0" />,
    render: ({ navigateToTool }) => (
      <AtlasSlicerSubtab onOpenLogs={() => navigateToTool(DevToolId.Logs)} />
    ),
  },
  {
    id: DevToolId.DataStudio,
    label: "Studio Danych",
    icon: <Database size={14} className="text-amber-400 shrink-0" />,
    render: () => <DataStudioSubtab />,
  },
  {
    id: DevToolId.Testing,
    label: "Tester i Cheaty",
    icon: <FlaskConical size={14} className="text-purple-400 shrink-0" />,
    render: () => <TestingSubtab />,
  },
  {
    id: DevToolId.Debug,
    label: "Debug Silnika",
    icon: <Bug size={14} className="text-cyan-400 shrink-0" />,
    render: () => <DebugSubtab />,
  },
  {
    id: DevToolId.Logs,
    label: "Strumień Logów",
    icon: <ScrollText size={14} className="text-rose-400 shrink-0" />,
    render: () => <LogsSubtab />,
  },
];

export function getDevToolDefinition(id: DevToolId): DevToolDefinition {
  return (
    DEV_TOOL_REGISTRY.find((entry) => entry.id === id) ?? DEV_TOOL_REGISTRY[0]
  );
}
