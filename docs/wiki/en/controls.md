# Controls & Interface

These are the shipped defaults, taken from the game's control data. Every binding can be changed in the game menu. Keyboard and gamepad work at the same time.

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
- The menu opens with <kbd>Start</kbd>, or by holding <kbd>LB</kbd> + <kbd>RB</kbd> together for 0.5 s on pads without Start.

**Planned (phase 5):** in gameplay the bumpers will also become selectors, so that the shipped defaults above (which use <kbd>LB</kbd>, <kbd>RB</kbd> and the triggers for potions and spells) move to selector semantics.

---

## 4. Keyboard hotkeys

- <kbd>M</kbd>: the game menu.
- <kbd>Esc</kbd>: closes the open window, or opens the menu when none is open.
- <kbd>P</kbd>: pause and resume.
- <kbd>I</kbd>: inventory.
- <kbd>K</kbd>: skill tree.
- <kbd>H</kbd>, <kbd>?</kbd> or <kbd>F1</kbd>: help and controls.
- <kbd>Q</kbd> / <kbd>E</kbd>: previous / next top-level tab. <kbd>[</kbd> / <kbd>]</kbd>: previous / next second-level tab.
- <kbd>C</kbd>: the developer dialog. It exists only in development builds.

---

## 5. Using the game on the web page

- Click the game, or press **Launch Game**, so that it receives keyboard focus.
- The game does not trap the keyboard. Press <kbd>Tab</kbd> to leave it and return to the page.
- <kbd>F11</kbd> or the fullscreen button enlarges the game. <kbd>Esc</kbd> leaves fullscreen.
