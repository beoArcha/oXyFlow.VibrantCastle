# Architektura Techniczna i Filozofia Silnika

*Vibrant Castle* opiera się na bezkompromisowej architekturze inżynieryjnej, oddzielającej deterministyczną symulację fizyczną od pasywnej warstwy prezentacji.

---

## 1. Trzy Filary Architektury

```mermaid
graph TD
    Data["Warstwa Danych (src/data/)<br/>Deklaratywne pliki JSON jako Single Source of Truth (SSOT)"]
    Engine["Rdzeń Symulacji (src/game/)<br/>Deterministyczny Canvas 2D, fixed timestep (60 Hz), czysty TypeScript"]
    UI["Warstwa Prezentacji (src/ui/, src/game-menu/, src/hud/)<br/>Pasywna nakładka w React 19: UI = f(Snapshot)"]

    Data --> Engine
    Engine -->|Niezmienne Migawki Stanu| UI
    UI -.->|Zdarzenia / Komendy przez Context| Engine
```

### 1.1. Rdzeń Symulacji (Simulation Core — `src/game/`)

- **Deterministyczna pętla 60 Hz**: Pętla symulacji działa w stałych krokach czasowych (fixed timestep), niezależnie od częstotliwości odświeżania monitora użytkownika (tempo symulacji wybierasz spośród 30, 60, 90 i 120 Hz; domyślnie 60 Hz).
- **Czysty TypeScript**: Kod silnika nie zawiera żadnych importów z Reacta, DOM ani zewnętrznych frameworków gier.
- **Zero alokacji w pętli renderowania**: Wewnątrz metod `render()` zabronione jest tworzenie nowych obiektów wektorów, tablic czy funkcji anonimowych, co chroni przed zacięciami Garbage Collectora.

### 1.2. Pasywna Nakładka UI (Passive Presentation Overlay)

- Formuła naczelna: $\text{UI} = f(\text{Snapshot}, \text{Locale}, \text{Theme})$.
- Komponenty React nigdy nie symulują fizyki ani nie modyfikują bezpośrednio stanu gry. Subskrybują one niezmienne migawki stanu przez porty React Context (`src/context/`).
- Wszelkie interakcje użytkownika (użycie mikstury, zmiana ustawień, pauza) są przesyłane jako silnie typowane komendy.

### 1.3. Pojedyncze Źródło Prawdy (SSOT — `src/data/`)

- Lokacje, potwory, przedmioty i czary są definiowane w deklaratywnych plikach JSON podlegających rygorystycznym testom parsowania i integralności. Walidator logiki poziomów (`bun scripts/validate-level.ts <id>`) sprawdza, czy każdą mapę da się ukończyć.

---

## 2. System Pięciu Warstw Paralaksy

Głębia wizualna Cytadeli Aether tworzona jest z 5 warstw odległości:

1. **`FAR` (Tło odległe)**: 100% nieprzezroczysty skybox i wieczny zachód słońca. Bezwzględny rygor braku przezroczystości chroni przed prześwitywaniem czarnego canvasa.
2. **`MID_FAR`**: Odległa architektura zamku i iglice.
3. **`MID`**: Wały i iglice za płaszczyzną gry. Bohaterowie, potwory, pociski i kafle platform są rysowane między tymi warstwami tła a pierwszym planem.
4. **`MID_CLOSE`**: Bliskie kamieniarka, łuki i kolumny.
5. **`CLOSE` (Pierwszy plan)**: Roślinność i elementy pierwszego planu.

Tła przewijają się z prędkością 0 (`FAR`), 0,24, 0,42, 0,65 i 0,85 prędkości kamery, a zbyt małe warstwy są odbijane lustrzanie, by kafelkować się bez szwów. Rysowane są tylko widoczne fragmenty.
