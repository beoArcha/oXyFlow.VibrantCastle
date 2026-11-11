import { GameBaseError } from "../../src/lib/errors";
import { run } from "./cli";

if (import.meta.main) {
  try {
    process.exitCode = await run(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof GameBaseError ? error.message : error);
    process.exitCode = 1;
  }
}
