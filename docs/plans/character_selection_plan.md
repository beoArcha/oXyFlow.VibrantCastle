# Plan Naprawczy PR #2: Kompleksowa Spójność Wyboru Postaci i Utrwalania Tożsamości

**Dokument**: `docs/plans/character_selection_plan.md`  
**Status**: Wersja 2.0 (Plan Remediacyjny do uwag Code Review w PR #2)  
**Autor**: Antigravity (T3 Code / Vibrant Castle Core Team)  
**Cel nadrzędny**: Rozwiązanie wszystkich 7 uwag zgłoszonych w Code Review PR #2 (`https://github.com/beoArcha/oXyFlow.VibrantCastle/pull/2#issuecomment-6471078540`) z zachowaniem 100% spójności kontraktów między `SettingsContext`, stanem `GameEngine`, trybem Co-Op, stanem zapisu (`SaveState`) i systemem czarów/umiejętności.

---

## 1. Goal & Scope (Cel i Zakres)

### 1.1. Cel (Goal)
Doprowadzenie mechaniki wyboru postaci Gracza 1 i Gracza 2 do produkcyjnej dojrzałości architektonicznej poprzez:
1. Ścisłą synchronizację preferencji użytkownika (`SettingsContext`) z tożsamością w silniku (`GameEngine`) i eliminację cichych desynchronizacji.
2. Zachowanie postępów gracza (unlocked skills, points, inventory, gold) przy zmianie lub zamianie postaci — koniec z destrukcyjnym resetowaniem do wartości domyślnych.
3. Rekonstrukcję właściwej liczby graczy (1P vs 2P) przy wczytywaniu stanu gry (`SaveState`), z poprawnym odtworzeniem martwego gracza (`p2Health = 0`).
4. Wyeliminowanie sztucznych aliasów czarów w `magic.ts` na rzecz kanonicznych identyfikatorów z modelu danych (`spells.json`).
5. Przeliczanie statystyk pochodnych (`derivedStats`) i weryfikację uprawnień klasowych przy odblokowywaniu umiejętności.
6. Usunięcie fikcyjnego Gracza 2 w widokach ekwipunku i drzewka magii w trybie jednoosobowym (1P).
7. Zapewnienie pełnego dowodu weryfikacji manualnej w przeglądarce za pomocą Chrome MCP (`preview_*`).

### 1.2. W zakresie (In Scope)
- `src/game/loop/engine.ts`: Ujednolicenie kontraktu preferencji domyślnej postaci (`defaultPrimaryCharacter`) oraz synchronizacja z `resetLevel` i `restart`.
- `src/game/controllers/playerCommandController.ts`: Niedestrukcyjna zmiana i zamiana postaci, precyzyjne adresowanie gracza po `playerIndex`, przeliczanie `derivedStats`.
- `src/game/logic/save/`: Rozbudowa `SaveState` o jawne pole `playerCount: 1 | 2`, rekonstrukcja topologii sesji przed aplikacją danych graczy, odtwarzanie tożsamości P2 niezależnie od `health > 0`.
- `src/game/logic/magic.ts` & `src/game/logic/skills.ts`: Usunięcie syntetycznych aliasów (`arcane_missiles`, `ice_barrier`, `aegis_ward`), przejście na kanoniczne `aether_bolt`, `aether_barrier`, `solar_flare`, `prismatic_shield`, walidacja przynależności umiejętności do klasy gracza.
- `src/game-menu/inventory/` & `src/game-menu/skills/`: Renderowanie zakładek P2 wyłącznie wtedy, gdy P2 realnie istnieje w sesji.
- `src/tests/integration/`: Rozszerzenie testów integracyjnych o rzucanie czarów, pełny round-trip 1P->2P i 2P->1P, testy martwego P2.

### 1.3. Poza zakresem (Out of Scope)
- Dodawanie nowych postaci spoza duetu Valen / Aurelia.
- Modyfikacja mechaniki fizyki platformowej czy kolizji kafelkowych.
- Refaktoryzacja niespokrewnionych systemów audio czy edytorów w `src/developer/`.

---

## 2. Baseline Findings Summary (Podsumowanie Uwag z Review PR #2)

1. **[P1] Desynchronizacja preferencji ustawień i stanu silnika**:
   - `setPlayerCharacter(0, charId)` może zwrócić `false`, ale UI ignoruje ten wynik.
   - Restart lub `resetLevel` w silniku nie pamięta wybranej postaci P1.
   - Import lub reset ustawień w `SettingsContext` nie synchronizuje działającego silnika.
2. **[P1] Destrukcyjne niszczenie postępów gracza**:
   - Zmiana postaci resetuje umiejętności i czary do startowych (`resetPlayerSkillsToDefaults`).
   - W trybie 2P metoda `setPlayerCharacter` bezwarunkowo wywołuje `swapPlayerCharacters()`, ignorując `playerIndex` i aktualną postać gracza.
3. **[P1] Brak rekonstrukcji sesji przy wczytywaniu zapisu (SaveState)**:
   - `SaveApplicator` zakłada, że P2 już istnieje w obiekcie silnika.
   - Warunek `state.p2Health > 0` powoduje, że zapis martwego P2 traci tożsamość, czary i ekwipunek.
   - Wczytanie zapisu 2P w silnik 1P nie tworzy P2, a zapisu 1P w silnik 2P nie usuwa P2.
4. **[P1] Sztuczne aliasy czarów zamiast kanonicznych ID**:
   - `magic.ts` mapowało `arcane_missiles -> aether_bolt`, `ice_barrier -> aether_barrier`, `aegis_ward -> prismatic_shield`.
   - Wprowadzało to podwójne tożsamości i rozbieżności z `spells.json` oraz `skills.json`.
5. **[P2] Brak przeliczania statystyk pochodnych i brak walidacji klasy w drzewku magii**:
   - Po zmianie postaci nie wywoływano `calculatePlayerDerivedStats`.
   - `checkSkillUnlockConditions` nie blokowało odblokowania węzła przypisanego do innej postaci (`node.character !== player.characterId`).
6. **[P2] Fikcyjny Gracz 2 w UI w trybie jednoosobowym**:
   - `SkillPlayerTabs.tsx` i `InventoryPanel.tsx` syntezowały etykiety/zakładki dla P2, sugerując dostępność nieistniejącego gracza.
7. **[P2] Spójność planu i dowodów weryfikacji manualnej**:
   - Testy integracyjne nie sprawdzały rzucania czarów i round-tripu zapisu 2P.
   - Weryfikacja manualna wymaga udokumentowanych dowodów z Chrome MCP.

---

## 3. Target State (Docelowy Stan Architektury)

```mermaid
graph TD
    subgraph Settings ["Warstwa Preferencji (SettingsContext)"]
        SC["SettingsState.primaryCharacter ('valen' | 'aurelia')"]
    end

    subgraph Engine ["Warstwa Silnika (GameEngine)"]
        GE["GameEngine.defaultPrimaryCharacter"]
        PCC["PlayerCommandController"]
        LLM["LevelLifecycleManager"]
        SA["SaveApplicator"]
    end

    subgraph Data ["Warstwa Danych i Zasad"]
        SR["SPELL_REGISTRY (Canonical IDs Only)"]
        ST["SkillTree (Strict Character Validation)"]
    end

    subgraph UI ["Warstwa Prezentacji (Passive UI)"]
        GMS["GameModeSection (Handled Result)"]
        SPT["SkillPlayerTabs (P2 iff activePlayer2 exists)"]
        IPT["InventoryPlayerTabs (P2 iff activePlayer2 exists)"]
    end

    SC <-->|Synchronizacja dwukierunkowa| GE
    GMS -->|dispatch| PCC
    PCC -->|recalculateDerivedStats| GE
    LLM -->|uses defaultPrimaryCharacter| GE
    SA -->|reconstructs session shape (1P/2P)| GE
    PCC --> ST
    PCC --> SR
    GE --> SPT
    GE --> IPT
```

### Kluczowe Kontrakty:
- **Tożsamość Domyślna**: `SettingsContext.primaryCharacter` to trwały wybór preferowanej postaci P1. `GameEngine.defaultPrimaryCharacter` jest z nim zsynchronizowany i zasila `resetLevel`, `restart` oraz nowy bieg.
- **Bezpieczeństwo Postępu**: Zmiana postaci nie usuwa ekwipunku, złota ani punktów. W trybie Co-Op zmiana postaci slotu jest zwalidowana: jeśli slot już ma tę postać — no-op (`true`); jeśli ma inną — zamiana slotów bez niszczenia postępów.
- **Topologia Zapisu**: `SaveState` posiada `playerCount: 1 | 2`. Przy restore silnik najpierw ustawia `isTwoPlayerMode(playerCount === 2)`, a następnie aplikuje stan obu graczy (nawet jeśli `health === 0`).
- **Kanoniczność Czarów**: Usunięcie wszystkich aliasów z `magic.ts`. Zestawy startowe: Valen (`solar_flare`, `prismatic_shield`), Aurelia (`aether_bolt`, `aether_barrier`).

---

## 4. Architectural Decisions (Decyzje Architektoniczne)

| Decyzja | Uzasadnienie | Alternatywy odrzucone |
| :--- | :--- | :--- |
| **AD-1: Rozdzielenie preferencji startowej od tożsamości aktywnej sesji** | Preferencja w Settings określa domyślną postać przy starcie runu/restartu, natomiast aktywny gracz w `players[0]` odzwierciedla stan w czasie gry. Zmiana w menu natychmiast aplikuje postać w silniku; jeśli silnik zaakceptuje zmianę, zostaje ona utrwalona. | Bezpośrednie powiązanie stanu Reacta z silnikiem bez obsługi błędów (odrzucone ze względu na wycieki i desynchronizację). |
| **AD-2: Bezwzględne usunięcie runtime aliases w `magic.ts`** | Spells.json jest jedynym źródłem prawdy (SSOT). Aliasy rozmywały tożsamość zaklęć w drzewkach talentów, restrykcjach i mapperach HUD. | Utrzymanie aliasów w celach wstecznej kompatybilności (odrzucone na polecenie Reviewera). |
| **AD-3: Jawne pole `playerCount` w `SaveState` i rekonstrukcja topologii** | Wczytanie stanu gry musi gwarantować, że silnik ma dokładnie tylu graczy, ile zapisano. Sprawdzanie `p2Health > 0` było błędne, bo wykluczało martwych graczy. | Wnioskowanie obecności gracza wyłącznie na podstawie niepustego `p2CharacterId` (mniej odporne na starsze zapisy). |
| **AD-4: Walidacja klasy postaci w `checkSkillUnlockConditions`** | Każdy węzeł drzewka magii posiada pole `character?: "valen" | "aurelia"`. Silnik musi uniemożliwiać odblokowanie talentu obcej klasy. | Poleganie wyłącznie na filtrowaniu węzłów w warstwie UI (odrzucone jako podatne na błędy silnika). |
| **AD-5: Warunkowe renderowanie P2 w UI** | W trybie 1P zakładki Gracza 2 w ekwipunku i drzewku umiejętności nie mogą być syntezowane ani widoczne. | Wyświetlanie zablokowanej/wyszarzonej zakładki P2 w 1P (odrzucone; tryb jednoosobowy skupia się wyłącznie na P1). |

---

## 5. Implementation Phases (Fazy Implementacji)

### Faza 1: Kanoniczne ID Czarów, Walidacja Klasowa i Przeliczanie Statystyk
- Usunięcie aliasów w `magic.ts`.
- Aktualizacja konfiguracji startowych w `levels.ts`, `skills.ts` i testach jednostkowych do `solar_flare`, `prismatic_shield`, `aether_bolt`, `aether_barrier`.
- Dodanie walidacji klasy (`characterKey`) w `checkSkillUnlockConditions`.
- Przeliczanie statystyk pochodnych (`calculatePlayerDerivedStats`) przy każdej zmianie tożsamości.
- *Gate*: `bun test:unit`, `bun test:arch`, typecheck.

### Faza 2: Rekonstrukcja Topologii Zapisu i Odporność Martwego Gracza
- Rozszerzenie `SaveState` o `playerCount: 1 | 2`.
- Aktualizacja `SaveCompiler` o zapisywanie `playerCount`.
- Aktualizacja `SaveApplicator`: najpierw wyrównanie liczby graczy w silniku (`setTwoPlayerMode`), potem pełna aplikacja P1 i P2 niezależnie od `health > 0`.
- Obsługa wstecznej kompatybilności dla starszych zapisów.
- *Gate*: Testy jednostkowe i integracyjne zapisu/odczytu 1P i 2P (w tym `p2Health = 0`).

### Faza 3: Bezpieczne Zarządzanie Postacią w Silniku i Synchronizacja Preferencji
- `GameEngine`: dodanie `defaultPrimaryCharacter`, zasilenie nim `resetLevel` i `restart`.
- `PlayerCommandController`:
  - `setPlayerCharacter(playerIndex, characterId)`: obsługa no-op przy tej samej postaci, poprawna obsługa w 2P (zamiana bez niszczenia postępów), brak kasowania inventory/gold/skills.
  - Zwracanie jawnego statusu sukcesu.
- `SettingsContext`: synchronizacja z silnikiem przy imporcie pliku i resecie do domyślnych; aktualizacja preferencji tylko wtedy, gdy polecenie silnika powiodło się.
- *Gate*: Testy kontrolera gracza, testy integracji z kontekstem ustawień.

### Faza 4: Czystość UI — Eliminacja Fikcyjnego Gracza 2
- `SkillPlayerTabs.tsx`: renderowanie zakładki P2 tylko jeśli `isTwoPlayer && p2`. W trybie 1P wyłącznie pojedyncza zakładka/badge P1.
- `InventoryPanel.tsx`: `p2Name` przekazywane jako pusty ciąg / brakujący gdy `p2` nie istnieje.
- `GameModeSection.tsx` & `GameplayTab.tsx`: obsługa informacji zwrotnej z silnika, zabezpieczenie przed desynchronizacją.
- *Gate*: Testy komponentów UI (`InventoryPlayerTabs`, `SkillPlayerTabs`, `GameModeSection`).

### Faza 5: Kompleksowa Weryfikacja (Unified Gate) & Testy Przeglądarkowe Chrome MCP
- Rozszerzenie `characterSelection.integration.test.ts` o rzucanie zaklęć (`aether_bolt`, `solar_flare`), pełny cykl 1P->2P->1P, round-trip martwego P2.
- `bun run typecheck`, `bun test:arch`, `bun test`.
- Pełny manualny scenariusz w przeglądarce via Chrome MCP (`preview_*`):
  - Uruchomienie Vite (`bun dev`),
  - Zmiana postaci w ustawieniach, weryfikacja braku błędów w konsoli,
  - Weryfikacja 1P vs 2P w ekwipunku i drzewku magii,
  - Przetestowanie restartu i zapisu,
  - Zapisanie snapshotu jako dowodu weryfikacji.

---

## 6. Task Register (Rejestr Zadań)

| ID | Zadanie | Pliki | Opis rozwiązania | Kryteria Akceptacji |
| :--- | :--- | :--- | :--- | :--- |
| **T-1.1** | Usunięcie aliasów w `magic.ts` | `src/game/logic/magic.ts` | Usunąć syntetyczne wpisy `arcane_missiles`, `ice_barrier`, `aegis_ward`. | Tylko oryginalne wpisy z `spells.json` w `SPELL_REGISTRY`. |
| **T-1.2** | Kanoniczne czary startowe | `src/game/logic/skills.ts`, `src/game/locations/levels.ts` | Ustawić czary: Valen (`solar_flare`, `prismatic_shield`), Aurelia (`aether_bolt`, `aether_barrier`). | Wszystkie czary startowe istnieją w `spells.json`. |
| **T-1.3** | Walidacja klasy w drzewku magii | `src/game/logic/skills.ts` | W `checkSkillUnlockConditions` zablokować zakup umiejętności przypisanej do innej postaci. | Zwrot `canUnlock: false`, `reasonKey: "wrongCharacter"`. |
| **T-2.1** | Dodanie `playerCount` do SaveState | `src/game/types/settings.ts`, `src/game/logic/save/saveCompiler.ts` | Zapisywać jawne `playerCount: 1 \| 2`. | `SaveState` zawiera liczbę graczy. |
| **T-2.2** | Rekonstrukcja sesji i obsługa martwego P2 | `src/game/logic/save/saveApplicator.ts` | Wyrównanie graczy w silniku przed aplikacją danych; odtwarzanie P2 nawet gdy `health === 0`. | Zapis 2P z martwym P2 wczytuje się do 2 graczy z pełnym ekwipunkiem. |
| **T-3.1** | Pamięć preferencji w `GameEngine` | `src/game/loop/engine.ts`, `src/game/locations/levelLifecycleManager.ts` | Dodać `defaultPrimaryCharacter` do silnika; używać go w `resetLevel` i `restart`. | Reset poziomu zachowuje wybraną postać Gracza 1. |
| **T-3.2** | Niedestrukcyjna zmiana postaci | `src/game/controllers/playerCommandController.ts` | Nie niszczyć punktów, umiejętności ani ekwipunku; obsłużyć no-op i poprawną zamianę w 2P. | `setPlayerCharacter` zachowuje zebrany ekwipunek i złoto. |
| **T-3.3** | Synchronizacja w SettingsContext | `src/context/SettingsContext.tsx`, `src/game-menu/menu/tabs/GameplayTab.tsx` | Synchronizować stan silnika przy imporcie/resecie; zapisywać tylko przy sukcesie komendy. | Błąd silnika nie modyfikuje trwałej konfiguracji. |
| **T-4.1** | Usunięcie fikcyjnego P2 w UI | `src/game-menu/skills/SkillPlayerTabs.tsx`, `src/game-menu/inventory/InventoryPanel.tsx` | Ukryć zakładkę P2 gdy gra toczy się w trybie 1P. | W trybie 1P widoczna wyłącznie tożsamość P1. |
| **T-5.1** | Testy integracyjne rozszerzone | `src/tests/integration/engine/characterSelection.integration.test.ts` | Dodać rzucanie czarów, przełączanie 1P<->2P, save/load z martwym P2. | 100% testów integracyjnych przechodzi. |
| **T-5.2** | Weryfikacja w przeglądarce via Chrome MCP | Live browser (`preview_*`) | Sprawdzić działanie w realnym DOM, sprawdzić konsolę (0 błędów), wykonać snapshot. | Realny dowód przeglądarkowy załączony do raportu. |

---

## 7. Testing Strategy (Strategia Testowania)

1. **Testy Jednostkowe (AAA Pattern)**:
   - `skills.unit.test.ts`: Test odrzucenia zakupu umiejętności Valena przez Aurelię i na odwrót.
   - `playerCommandController.unit.test.ts`: Test zachowania postępów przy zmianie postaci, test no-op przy żądaniu tej samej postaci, test przeliczenia statystyk.
   - `saveSubsystem.unit.test.ts`: Test round-trip zapisu z `p2Health = 0`, test wczytania zapisu 2P do silnika 1P i zapisu 1P do silnika 2P.
2. **Testy Integracyjne (BDT Pattern)**:
   - `characterSelection.integration.test.ts`:
     - Given/When/Then: Start gry -> Rzucenie `solar_flare` -> Zmiana na Aurelię -> Rzucenie `aether_bolt` -> Dołączenie P2 (Valen) -> Rzucenie `prismatic_shield` -> Śmierć P2 -> Zapis stanu -> Nowa sesja 1P -> Wczytanie stanu -> Potwierdzenie obecności 2 graczy, martwego P2 z zachowanym ekwipunkiem.
3. **Testy Architektoniczne (`bun test:arch`)**:
   - `designSystemBoundaries.test.ts`: Brak zakazanych tagów HTML.
   - `i18nParity.test.ts`: 100% spójności kluczy językowych.
   - `layerLeakage.test.ts`: Brak wycieków warstw i bezpośrednich mutacji.
4. **Weryfikacja Manualna Przeglądarki (Chrome MCP / `preview_*`)**:
   - Sprawdzenie wizualne komponentów w żywym drzewie DOM.
   - Sprawdzenie logów konsoli (0 uncaught errors, 0 React warnings).

---

## 8. Risks & Mitigation (Ryzyka i Mitygacja)

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
| :--- | :--- | :--- | :--- |
| **Złamanie kompatybilności starych zapisów** | Średnie | Wysoki | W `saveApplicator.ts` jeśli brakuje `playerCount`, wyliczamy go heurystycznie: jeśli `state.p2CharacterId` lub `state.p2Health !== undefined`, to 2P, w przeciwnym razie 1P. |
| **Błędy w testach oczekujących starych nazw czarów** | Wysokie | Średni | Przeszukanie repozytorium i jednoczesna aktualizacja wszystkich testów jednostkowych odwołujących się do usuniętych aliasów. |
| **Desynchronizacja referencji graczy w React** | Niskie | Średni | Użycie `context.notifyStateChanged()` i `notifyEngineUpdate()` przy każdej operacji na tożsamości. |

---

## 9. Decision Points (Punkty Decyzyjne)

1. **Zachowanie postępu przy zmianie postaci w pojedynczym slocie**:
   - *Rekomendacja*: W Vibrant Castle zmiana postaci przed startem lub w menu zachowuje postępy danego gracza w runie (złoto, punkty, wspólny stan ekwipunku), podmieniając jedynie klasę i czary na właściwe dla danej tożsamości. W trybie Co-Op kliknięcie Aurelii przez P1 dokonuje czystej zamiany ról (P1=Aurelia, P2=Valen) ze swapem ich wyposażenia.
2. **Zachowanie martwego gracza P2 w zapisie**:
   - *Rekomendacja*: Zapis zachowuje `isDead: true`, `health: 0`, ale nie kasuje tożsamości, czarów ani przedmiotów. Przy wczytaniu gracz pozostaje martwy do momentu ożywienia (mechanika gry), ale jest pełnoprawnym członkiem sesji.

---

## 10. Definition of Done (Definicja Ukończenia)

- [ ] Usunięto 100% syntetycznych aliasów z `magic.ts`; czary startowe to kanoniczne `solar_flare`, `prismatic_shield`, `aether_bolt`, `aether_barrier`.
- [ ] Zmiana postaci nie kasuje ekwipunku, punktów ani postępów gracza.
- [ ] Zapis gry poprawnie rekonstruuje liczbę graczy (1P vs 2P) i przywraca stan martwego P2.
- [ ] Zakładki P2 w ekwipunku i drzewku magii są ukryte w trybie jednoosobowym.
- [ ] `bun run typecheck` kończy się kodem 0.
- [ ] `bun test:arch` przechodzi w 100%.
- [ ] `bun test` wykonuje wszystkie testy z wynikiem 0 błędów.
- [ ] Przeprowadzono test manualny za pomocą Chrome MCP w przeglądarce i załączono dowody.
- [ ] Czyste drzewo gita i przygotowane commity konwencjonalne.
