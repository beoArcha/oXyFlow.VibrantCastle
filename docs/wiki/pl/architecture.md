# Techniczna architektura

Vibrant Castle oddziela deterministyczną symulację od pasywnej warstwy prezentacji. Zasady są w `.agents/rules/`, a testy architektury w `src/tests/arch/` je egzekwują.

## Warstwy

- **Treść (`src/data/`, `src/assets/`).** Deklaratywny JSON jest jedynym źródłem prawdy dla map, wrogów i sterowania. Grafika występuje w poziomach jako pliki PNG i SVG.
- **Symulacja (`src/game/`).** Czysty TypeScript na Canvas 2D. Nie importuje React ani DOM. Działa w pętli o stałym kroku: 30, 60, 90 lub 120 Hz (domyślnie 60 Hz), a rysowanie interpoluje między krokami.
- **Prezentacja (`src/game-menu/`, `src/hud/`, `src/ui/`).** Pasywna nakładka React 19: interfejs jest funkcją niezmiennej migawki stanu silnika. Nigdy nie zmienia stanu rozgrywki bezpośrednio.
- **Most (`src/context/`).** Typowane konteksty React przenoszą polecenia z interfejsu do silnika, a migawki i zdarzenia domenowe z powrotem.

Zdarzenia dyskretne przechodzą przez `GameEventBus`. Stan ciągły przechodzi przez niezmienne migawki.

## Egzekwowane zasady

- Silnik nie ma zależności od interfejsu.
- Kod produkcyjny używa klas błędów domenowych dziedziczących po `GameBaseError`, a nie zwykłego `Error`.
- Pętle renderowania nie alokują obiektów.
- Dane map sprawdza walidator poziomów: `bun scripts/validate-level.ts <id>` potwierdza, że mapę da się przejść.

## Paralaksa

Tła używają pięciu poziomów głębi: `FAR` (nieprzezroczyste niebo), `MID_FAR` (odległa architektura), `MID` (blanki za płaszczyzną rozgrywki), `MID_CLOSE` (bliski kamień) i `CLOSE` (roślinność pierwszego planu). Przewijają się z różnymi prędkościami, a zbyt małe warstwy są powielane bez szwów.

## Budowanie i kontrole

- `bun run build:pages` buduje portal wiki i grę pod `/game/` w katalogu `dist/`.
- `bun test:unit`, `bun test:integration`, `bun test:arch`, `bun test:e2e` i `bun test:scripts` uruchamiają zestawy testów. W CI bramka pokrycia działa dla każdego zestawu.
- Workflow wydania promuje `main` i publikuje artefakty na bramce fazy.
