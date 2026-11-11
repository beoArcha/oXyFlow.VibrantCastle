---
trigger: model_decision
description: Zasady korzystania z grafu wiedzy Graphify (badanie sąsiedztwa, blast radius, obsługa god nodes w src/game/loop/)
---

# Architektura Graphify i Wytyczne dla Agentów

Niniejszy dokument definiuje standardy i zasady nawigacji po bazie kodu Vibrant Castle z wykorzystaniem grafu wiedzy Graphify (`graphify-out/graph.json`) oraz protokołu MCP.

---

## 1. ZASADY OGÓLNE I NAWIGACJA PO GRAFIE

Zamiast wykonywać kosztowne, wieloplikowe przeszukiwania tekstowe (grep) lub czytać dziesiątki plików w ciemno:
1. **Pytania architektoniczne**: W pierwszej kolejności używaj `query_graph` / `graphify query "<pytanie>"` do zidentyfikowania odpowiedniego podgrafu i kontekstu modułów.
2. **Relacje i powiązania**: Wykorzystuj `shortest_path(source, target)` lub `graphify path "<A>" "<B>"`, aby zrozumieć, jak odległe komponenty komunikują się ze sobą (np. interfejs użytkownika -> pętla gry -> systemy).
3. **Pojedyncze koncepcje**: Wywołaj `get_node(node_id)` lub `graphify explain "<nazwa>"` dla uzyskania syntetycznego podsumowania węzła i jego 20 najważniejszych połączeń.

---

## 2. BADANIE SĄSIEDZTWA (`get_neighbors`)

Przed przystąpieniem do edycji lub refaktoryzacji jakiegokolwiek komponentu lub pliku źródłowego:
1. **Analiza bezpośrednich zależności**: Wywołaj `get_neighbors(node_id, depth=1)` lub `graphify explain "<symbol>"`.
2. **Kierunek przepływu**:
   - **Inbound (krawędzie wchodzące)**: Kto zależy od tego symbolu/modułu? Czy zmiana sygnatury, typu lub zachowania wymusi aktualizację konsumentów?
   - **Outbound (krawędzie wychodzące)**: Z czego korzysta ten moduł? Czy nie narusza reguł warstwowych (np. zakaz importu z `src/components/` do `src/game/`)?
3. **Zasada 2-hop dla refaktoryzacji**: Przy zmianach interfejsów publicznych zbadaj sąsiedztwo do głębokości 2 (`depth=2`), aby wychwycić pośrednie efekty uboczne.

---

## 3. ANALIZA PROMIENIA RAŻENIA (BLAST RADIUS & `get_pr_impact`)

Przed zatwierdzeniem zmian, przygotowaniem PR-a lub zakończeniem zadania:
1. **Ocena wpływu (Blast Radius)**:
   - Skorzystaj z narzędzia `get_pr_impact(files)` przekazując listę zmienionych plików.
   - Narzędzie wylicza zbiór węzłów zależnych tranzytywnie oraz wyznacza krytyczne ścieżki ryzyka.
2. **Weryfikacja testów**:
   - Wszystkie moduły testowe znajdujące się w promieniu rażenia zmienionego kodu muszą zostać uruchomione i zaliczone.
   - Jeśli promień rażenia obejmuje moduły z grupy Core/Engine, konieczne jest uruchomienie testów integralności architektury (`architectureBoundaries.test.ts`, `layerLeakage.test.ts`).

---

## 4. OBSŁUGA GOD NODES I STREF KRYTYCZNYCH (`src/game/loop/`)

Wykryte w analizie grafu węzły o bardzo wysokim stopniu powiązań (god nodes) to węzły newralgiczne o najwyższym ryzyku regresji.

### Kluczowy węzeł krytyczny: `GameEngine` (`src/game/loop/engine/GameEngine.ts`, degree 133+)
Pętla gry w `src/game/loop/` koordynuje cały cykl życia symulacji i renderowania:
- **Restrykcje modyfikacji**:
  - ❌ **Zero alokacji obiektów w pętli tick/render**: Zabronione jest tworzenie nowych obiektów, tablic i funkcji anonimowych wewnątrz metod wywoływanych co klatkę (`update`, `render`, `tick`).
  - ❌ **Zakaz importu warstwy UI/DOM**: `src/game/loop/` nie może bezpośrednio importować komponentów React ani stanu UI.
  - ✅ **Determinizm Fixed Timestep**: Wszelka fizyka i symulacja w pętli gry musi działać w stałym kroku czasowym (fixed step, 60 Hz).
  - ✅ **Komunikacja zdarzeniowa**: Zdarzenia z pętli do świata zewnętrznego muszą przechodzić przez `GameEventBus`.
- **Wymóg badania wpływu przy zmianach w `src/game/loop/`**:
  - Zawsze przed zmianą w pętli uruchom `get_neighbors("src_game_loop_engine_gameengine")` lub `get_pr_impact(["src/game/loop/engine/GameEngine.ts"])`.
  - Po modyfikacji zweryfikuj brak powstawania niepożądanych cykli i nowych zależności z zewnętrznymi warstwami.

---

## 5. AKTUALIZACJA I UTRZYMANIE GRAFU

1. Po modyfikacjach plików z kodem źródłowym uruchom `npm run graph:build` (lub `graphify --code-only`), aby zachować spójność grafu.
2. W przypadku weryfikacji architektury i przepływów wywołań przed dużymi wydaniami uruchom `npm run graph:viz` oraz `npm run graph:callflow`.
