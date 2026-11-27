# Nowości

## 0.3.x (faza 4, bramka jakości): stabilizacja, paralaksa i uzupełnienie grafik

Faza 4 odbudowała elementy utracone po porządkach 0.3.0 (tilesety, dekoracje, potok sprite'ów, testy i dokumentację), przebudowała dwupoziomowe menu, ujednoliciła potok paralaksy i domknęła wszystkie braki na poziomach `hi8bit` oraz `hi16bit` przed bramką jakości. Najnowsze zmiany są na początku listy.

- **Testy końcowe fazy 4 i metryki odczucia gry.** Wszystkie 8 map pierwszych, przebudowane menu, nawigacja padem i każde narzędzie w „Tworzeniu” przeszły końcowy playtest (`24/24` sprawdzonych pozycji, 0 błędów konsoli), a testy integracyjne 60 Hz zmierzyły parametry ruchu i walki.
- **Potok paralaksy, strefy i wydajność.** Ujednolicono renderowanie tła w jednym systemie opartym na plikach meta z progresywnym ładowaniem poza wątkiem głównym, płynnym przejściem stref `boss` i `rest`, pochodnymi poziomami `hi8bit` / `hi16bit` dla 5 światów PNG oraz trybami jakości `auto` / `high` / `mid` / `low` / `simplified` / `off` w Ustawienia > Obraz.
- **Poziomy grafik i nowa brama Aetheru.** Naprawiono migotanie ramek `hi8bit`, dodano brakujące pliki `hi16bit` SVG dla wrogów i konstrukcji, ulepszono grafiki `hi8bit` oraz zastąpiono `aether_gate` nową animowaną konstrukcją w trzech poziomach. Każdy wróg, konstrukcja, dekoracja, tileset i bohater ma teraz pełne zestawy `hi8bit` i `hi16bit`.
- **Przeglądarka map i edytor tekstów w Tworzeniu.** W Poziomach 8×8 dodano przeglądarkę mapy z przesuwaniem/przybliżaniem oraz narzędzie do umieszczania wyzwalaczy narracji i eksportu łatek JSON, a także lokalny podgląd `preview:pages`.
- **Kanon lore 2034 i scenariusze demo.** Domknięto dwie rundy kanonu lore, dwujęzyczne akta światów, archiwalne katalogi źródłowe oraz scenariusze narracji dla mapy 1 każdego z 8 światów.
- **Utwardzenie wydań i CI.** Promocja wydania działa wyłącznie na bramkach faz i publikuje wersjonowane wydanie GitHub z paczką gry obok strony Pages.
- **Przebudowa ekwipunku i menu.** Przywrócono ekwipunek z sylwetką postaci, porównaniem statystyk i potwierdzeniami, oddzielono jedno okno gry od deweloperskiego „Tworzenia”, dodano obsługę ograniczonego pada (`LB`/`RB`, `LT`/`RT`, `Start` lub 0,5 s przytrzymania `LB+RB`) i karty „Wkrótce”.
- **Kontrakty, testy i potok narzędzi.** Zatwierdzono kontrakt mapy i model sześciu atrybutów D20×10, przywrócono tilesety, dekoracje, kompilator sprite'ów (`scripts/sprites/compile.ts`) oraz bramkę pokrycia (74% unit / 58% integracja / 73% łącznie).

### Plan fazowy

- **Faza 4 (0.3.x, teraz):** stabilizacja, przebudowa menu, przywrócenie dokumentacji, testów i CI oraz kontrakty map i postaci.
- **Faza 5 (0.4.x, następna):** światy i postacie. Mapa 1 każdego świata spełnia kontrakt mapy, atrybuty napędzają HP, manę i staminę, wrogowie zadają obrażenia, a narrator jest podpięty do silnika.
- **Faza 6 (0.5.x):** głębia metroidvanii. Przedmioty zdolności blokujące trasy, ekran mapy, mapy 2–8 pierwszych światów i malowane arkusze `high` dla wrogów.
- **Faza 7 (0.6.x):** historia i kooperacja. Powieść wizualna w grze, narracja reagująca na styl gry, dopracowana kooperacja dwóch graczy i bossowie.
- **Faza 8+ (w stronę 1.0):** pełna kampania 8 x 8 map, przegląd jesiennej palety każdego świata i utwardzenie wydania.

## 0.3.0 (2026-11-14): grafika hi-bit, tilesety, dekoracje i kraty

- **Poziomy jakości z przełączaniem na żywo**: hi-8bit, hi-16bit i high, zmieniane w ustawieniach wyświetlania.
- **Bohaterowie kwantyzowani z malowanych klatek**: Valen i Aurelia wyglądają tak samo na każdym poziomie.
- **Tilesety platform i dekoracje** z blaskiem i poświatą.
- **Otwierane kraty**: kraty podnoszą się, gdy uderzy się w dźwignię.
- **Pięć przebudowanych map** i pełna trasa portalami z pętlą zwycięstwa.
- **Dziewiętnaście szablonów wrogów**, które patrolują i można je pokonać.
