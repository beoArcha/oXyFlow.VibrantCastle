# Techniczna architektura

Vibrant Castle oddziela zasady gry od tego, co widać na ekranie. Symulacja to czysty TypeScript. Menu i HUD to nakładka React, która tylko odczytuje stan. Zasady inżynierskie są w `.agents/rules/`, a testy architektury w `src/tests/arch/` je egzekwują.

## Warstwy

- **Treść (`src/data/`, `src/assets/`).** Pliki JSON opisują mapy, wrogów, sterowanie i wartości domyślne. Grafika występuje w trzech poziomach jakości, jako pliki PNG i SVG.
- **Symulacja (`src/game/`).** Silnik w czystym TypeScript na Canvas 2D, bez importów React i DOM. Działa w pętli o stałym kroku: 30, 60, 90 lub 120 Hz (domyślnie 60 Hz), a rysowanie interpoluje między krokami.
- **Prezentacja (`src/game-menu/`, `src/hud/`, `src/ui/`, `src/developer/`).** Pasywna nakładka React 19. Każdy ekran jest funkcją niezmiennej migawki silnika i nigdy nie zmienia rozgrywki bezpośrednio. Okno deweloperskie istnieje tylko w buildach deweloperskich.
- **Most (`src/context/`).** Typowane konteksty React przenoszą polecenia z nakładki do silnika, a migawki z powrotem.

## Egzekwowane zasady

- Silnik nie ma zależności od interfejsu.
- Błędy to klasy domenowe dziedziczące po `GameBaseError`, a nie zwykły `Error`.
- Pętle renderowania nie alokują obiektów.
- Każdą mapę sprawdza walidator poziomów, który potwierdza, że da się ją przejść.

## Paralaksa

Tła używają pięciu poziomów głębi: `FAR` (nieprzezroczyste niebo), `MID_FAR` (odległa architektura), `MID` (blanki za płaszczyzną rozgrywki), `MID_CLOSE` (bliski kamień) i `CLOSE` (roślinność pierwszego planu). Przewijają się z różnymi prędkościami, a zbyt małe warstwy są powielane tak, by łączyć się bez szwów.

## Budowanie i kontrole

- **Tylko Bun.** Bez npm, npx, yarn i pnpm.
- **`bun run build:pages`** buduje dystrybucję w `dist/`: wiki w katalogu głównym i grę pod `/game/`.
- **Zestawy testów.** `bun test:unit`, `bun test:integration`, `bun test:arch`, `bun test:scripts` i `bun test:e2e`. Test end-to-end sprawdza gotowy build.
- **Bramka pokrycia.** `bun run coverage:gate` wymusza minimalne pokrycie linii dla każdego zestawu: unit 74%, integracja 58%, a 73% dla widoku łączonego.
- **Kontrole poziomów.** `bun scripts/validate-level.ts <id>` sprawdza jedną mapę, a `--all` wszystkie osiem światów.

## Ciągła integracja

- Każde wypchnięcie na `main` uruchamia pełną weryfikację: sprawdzenie typów, testy jednostkowe i integracyjne z pomiarem pokrycia, kontrole architektury i poziomów, bramkę pokrycia, budowę dystrybucji i test dymny end-to-end.
- Workflow wydania działa w każdą niedzielę o 03:00 UTC. Ponownie sprawdza `main` i przesuwa gałąź `release` na zweryfikowany commit.
- Wypchnięcie gałęzi `release` wdraża wiki i grę na GitHub Pages.

## Fazy i bramki jakości

Praca przebiega w fazach, a każda faza jest powiązana z wersją (faza 4 to 0.3.x). Faza kończy się bramką jakości: sprawdzeniem dokumentacji, jej aktualizacją, przeglądem, wydaniem i podbiciem wersji. Plan i karty zadań każdej fazy są w katalogu `docs/tasks/` w repozytorium.
