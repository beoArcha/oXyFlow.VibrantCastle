import { getLogger, ILogger } from "../../lib/logger";

/**
 * Domain-specific loggers for Game Engine subsystems.
 * Enables granular level filtering, modular inspection, and DIP.
 */
export const engineLogger: ILogger = getLogger("game:engine");
export const physicsLogger: ILogger = getLogger("game:physics");
export const collisionLogger: ILogger = getLogger("game:collisions");
export const audioLogger: ILogger = getLogger("game:audio");
export const rendererLogger: ILogger = getLogger("game:renderer");
export const assetsLogger: ILogger = getLogger("game:assets");
export const saveLogger: ILogger = getLogger("game:save");
export const statsLogger: ILogger = getLogger("game:stats");
export const debugLogger: ILogger = getLogger("game:debug");
