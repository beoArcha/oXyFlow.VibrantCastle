# Controls & Interface

These are the shipped defaults, taken from the game's control data. Every binding can be changed in **Settings > Controls**. Keyboard and gamepad work at the same time.

---

## 1. Keyboard: player 1 (Valen)

| Action | Keys |
| :--- | :--- |
| Move left / right | <kbd>A</kbd> / <kbd>D</kbd> |
| Look up / down | <kbd>W</kbd> / <kbd>S</kbd> |
| Jump | <kbd>Space</kbd> |
| Rapier strike | <kbd>J</kbd> |
| Slide / dash | <kbd>L</kbd> (forward is a slide, back is a backstep) |
| Spell 1 / spell 2 | <kbd>U</kbd> / <kbd>O</kbd> |
| Potions 1 / 2 / 3 | <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> |

## 2. Keyboard: player 2 (Aurelia)

| Action | Keys |
| :--- | :--- |
| Move left / right | <kbd>←</kbd> / <kbd>→</kbd> |
| Look up / down | <kbd>↑</kbd> / <kbd>↓</kbd> |
| Jump | <kbd>Num 0</kbd> or <kbd>Enter</kbd> |
| Strike | <kbd>Num 1</kbd> |
| Slide / dash | <kbd>Num 3</kbd> |
| Spell 1 / spell 2 | <kbd>Num 4</kbd> / <kbd>Num 5</kbd> |
| Potions 1 / 2 / 3 | <kbd>Num 7</kbd> / <kbd>Num 8</kbd> / <kbd>Num 9</kbd> |

---

## 3. Gamepad

Player 1 uses the first connected pad, player 2 the second. Standard button numbers are in brackets.

| Action | Button |
| :--- | :--- |
| Move | Left stick or D-pad |
| Jump | <kbd>A</kbd> (0) |
| Strike | <kbd>X</kbd> (2) |
| Slide / dash | <kbd>B</kbd> (1) |
| Spell 1 | <kbd>Y</kbd> (3) |
| Spell 2 | <kbd>RB</kbd> (5) |
| Potions 1 / 2 / 3 | <kbd>LB</kbd> (4) / <kbd>LT</kbd> (6) / <kbd>RT</kbd> (7) |

The stick dead zone is 0.25.

### Restricted pad layout

The pad has 4 face buttons, 2 triggers and 2 bumpers. In the menu the bumpers and triggers are tab selectors:

- <kbd>LB</kbd> / <kbd>RB</kbd> switch the top-level tabs.
- <kbd>LT</kbd> / <kbd>RT</kbd> switch the second-level tabs.
- <kbd>Start</kbd> opens the menu. Holding <kbd>LB</kbd> + <kbd>RB</kbd> together for 0.5 s also opens it, so a pad without Start can open the menu too.

**Planned (phase 5):** in gameplay the bumpers will also become selectors, so that the shipped defaults above (which use <kbd>LB</kbd>, <kbd>RB</kbd> and the triggers for potions and spells) move to selector semantics.

---

## 4. Game menu tabs

The game menu is one dialog with two levels of tabs. Top tabs switch with <kbd>Q</kbd> / <kbd>E</kbd> or <kbd>LB</kbd> / <kbd>RB</kbd>. Second-level tabs switch with <kbd>[</kbd> / <kbd>]</kbd> or <kbd>LT</kbd> / <kbd>RT</kbd>.

| Top tab | Key | What it holds |
| :--- | :--- | :--- |
| Game | <kbd>M</kbd> | Saving, loading and restarting the current location |
| Map | | Location selection |
| Character | | Stats of the current hero |
| Inventory | <kbd>I</kbd> | Items and equipment |
| Magic | <kbd>K</kbd> | Skill tree |
| Settings | | Four second-level tabs: Display, Audio, Controls and Interface |
| Help | <kbd>H</kbd>, <kbd>?</kbd> or <kbd>F1</kbd> | Help and controls |

## 5. Gamepad in the menu

| Button | Action |
| :--- | :--- |
| <kbd>A</kbd> | Activate the focused control |
| <kbd>B</kbd> | Back: cancels a rebind, closes the window on top, or closes the menu |
| <kbd>Start</kbd> | Opens the menu. Inside the menu it works like <kbd>B</kbd>. |
| <kbd>X</kbd> | Context action on the focused control |
| <kbd>Y</kbd> | Shows or hides the button legend |
| D-pad or left stick | Moves the focus |
| <kbd>LB</kbd> / <kbd>RB</kbd>, <kbd>LT</kbd> / <kbd>RT</kbd> | Top and second-level tabs |

---

## 6. Keyboard hotkeys

- <kbd>M</kbd>: opens or closes the game menu.
- <kbd>Esc</kbd>: closes the open window, or opens the menu when none is open.
- <kbd>P</kbd>: pause and resume.
- <kbd>I</kbd>: inventory.
- <kbd>K</kbd>: skill tree.
- <kbd>H</kbd>, <kbd>?</kbd> or <kbd>F1</kbd>: help and controls.
- <kbd>Q</kbd> / <kbd>E</kbd>: previous / next top-level tab, while a game window is open.
- <kbd>[</kbd> / <kbd>]</kbd>: previous / next second-level tab, while a game window is open.
- <kbd>C</kbd>: the developer dialog ("Tworzenie"). It exists only in development builds.

Hotkeys are ignored while you type in a text field, and the game does not use <kbd>Ctrl</kbd>, <kbd>Alt</kbd> or <kbd>Meta</kbd> combinations.

---

## 7. Changing a binding

1. Open **Settings > Controls** in the menu.
2. Pick the action and press the new key or pad button.
3. Press <kbd>Esc</kbd> to cancel the change.

Keyboard bindings take any key except the reserved system keys: <kbd>Tab</kbd>, <kbd>Caps Lock</kbd>, the <kbd>Win</kbd> / <kbd>Cmd</kbd> keys, the context-menu key and <kbd>F1</kbd> to <kbd>F12</kbd>. On the pad, only the restricted layout can be bound: <kbd>A</kbd> / <kbd>B</kbd> / <kbd>X</kbd> / <kbd>Y</kbd>, <kbd>LB</kbd> / <kbd>RB</kbd> and <kbd>LT</kbd> / <kbd>RT</kbd>. Other buttons are refused with a message.

## 8. Confirmations

The game asks before any action that cannot be undone or that overwrites your progress or settings:

- restarting the current location;
- loading a save, which replaces the current state;
- importing settings, which replaces the current configuration;
- restoring all settings to their defaults;
- restoring the default controls, for one player or for all players;
- resetting the session statistics;
- discarding an item from the inventory.

---

## 9. Using the game on the web page

- Click the game, or press **Launch Game**, so that it receives keyboard focus.
- The game does not trap the keyboard. Press <kbd>Tab</kbd> to leave it and return to the page.
- <kbd>F11</kbd> or the fullscreen button enlarges the game. <kbd>Esc</kbd> leaves fullscreen.
