# Phase 1: engine core (0.0.x, done)

Part of the [task folder](./README.md). A summary of past work; this phase had no task cards.

## About this phase

**Goal:** a working engine and the tools to build the game with: the game loop, physics, rendering, state, input, i18n and a developer suite. **Period:** 2026-09-23 (initial commit) to 2026-10-06. All work went straight to `main`, without PRs.

## What was built

- **Engine loop.** A deterministic fixed-step loop with dependency injection, the level lifecycle manager, the player command controller and an FPS manager (d64c921, 0e189ad, 6c22551, 1ee2d40).
- **Physics.** AABB collisions against the environment (a57add8).
- **Rendering.** A modular 2D renderer with a multi-layer parallax background, the sprite atlas renderer and atmospheric effects; zero allocations in the render loop and gradient caching (22c35cc, 910eab0, 876c35b, ced6e68).
- **Assets.** The asset loader, the location parser with JSON blueprints, a metadata parsing engine and the atlas slicing engine with auto-island strategies (1ab491d, 931ae17, 16c6ebd).
- **Errors and logging.** The `GameBaseError` hierarchy, a `Result` type, a ring-buffer logger and domain logging (168c8b5, 8b6d33e).
- **State.** React context providers for game state, session, inventory, skills, settings and persistence; the save subsystem and stats management (28b0943, 5d5ed03, fb2510d, 12d99fa).
- **Input.** Keyboard and gamepad input normalised into actions, key rebinding and control mappers (5da3890, cce272e, d0cb6db).
- **UI primitives.** Dialog, ConfirmDialog, Toast, Tabs, Slider, ProgressBar and the error boundary, with tests (79212f6, 96d64eb, 06e8e21).
- **Developer suite.** Atlas Studio (slicing, texture viewer, animation preview), Tester, Logs, Debug and Data Studio with editors and a visual novel preview (9936ef4, b076799, 4b1036e, 21a027b).
- **i18n.** A centralised PL/EN i18n system with parity tests (fd073bf, 99803e9).
- **Architecture tests.** AST boundary tests, circular-dependency detection, location blueprint contracts and asset integrity (52917c4, 2d71978, 20e1518, 6a4af8c).

## What was learned

- Many commits were large "add X components and tests" batches. That made history hard to bisect, which is why later phases moved to small PRs.
- Architecture tests paid off early: boundary and cycle checks kept the module layout clean while the code grew fast.
- The developer suite grew big quickly (Atlas Studio especially). Its size became a refactor target later (VC-071).
