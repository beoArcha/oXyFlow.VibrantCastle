# Zasady Architektoniczne Projektu (Vibrant Castle)

Ten dokument opisuje nadrzędne reguły projektowe, strukturę kodu, architekturę interfejsu oraz powiązania dokumentacji gry. Każda nowa funkcjonalność, refaktoryzacja lub moduł musi być z nimi w pełni zgodny.

---

## 1. Dokumentacja Świata i Scenariusza

Szczegółowa dokumentacja fabuły, mechanik, postaci, lokacji i przedmiotów została wydzielona do dedykowanych plików:

*   **`/SCENARIO.md`**: Kompletny scenariusz fabularny gry, podział na akty, przebieg rozgrywki poziomu 1 (Słoneczny Bastion) oraz zarys przyszłych rozdziałów.
*   **Katalog `/lore/` (Encyklopedia Świata Gry)**:
    *   **`/lore/characters.md`**: Opisy bohaterów grywalnych (Valen – Szkarłatny Szermierz, Aurelia – Cyjanowa Strażniczka).
    *   **`/lore/enemies.md`**: Bestiariusz, przeciwnicy, manekiny treningowe, latające automaty zegarowe i potwory aeterowe.
    *   **`/lore/npcs.md`**: Postacie niezależne, wszechwiedzący Narrator z Bastionu, sojusznicy i zwierzęcy przewodnicy (Kruk Corvus, Kot Bursztynek).
    *   **`/lore/locations.md`**: Szczegółowy opis lokacji, wymiarów i wyzwań środowiskowych (Dziedziniec, Rozpadlina Cierni, Arena, Winda, Baszta).
    *   **`/lore/artifacts.md`**: Artefakty, dźwignie chrono-mechaniczne, oręż słoneczny i kryształowy, Bramy Aetheru oraz kroniki zapisu JSON.

---

## 2. Architektura UI i Prymitywy Frontendowe (`/src/components/ui/`)

Wszystkie ekrany, panele i modale (`HUDOverlay`, `MenuPanel`, `InventoryPanel`, `SkillTreePanel`, `KeyboardMapper`, `GamepadMapper`) opierają się na atomowych, wielokrotnego użytku prymitywach frontendowych:

*   **`Button.tsx`**: Dostępne przyciski o typowanych wariantach (`primary`, `secondary`, `danger`, `purple`, `ghost`, `outline`), rozmiarach (`sm`, `md`, `lg`) i obsłudze ikon.
*   **`Card.tsx`**: Kompozycja kart (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`).
*   **`ProgressBar.tsx`**: Paski zasobów (Zdrowie, Mana, Wytrzymałość) z animacją, etykietami i płynnym skalowaniem relatywnym.
*   **`Modal.tsx`**: Uniwersalny modal z obsługą klawisza Escape, tłem z efektem rozmycia (backdrop-blur) i animacją wejścia.
*   **`Badge.tsx`**: Znaczniki kategorii, tierów, statusów i klawiszy.
*   **`Slider.tsx`**: Dostępne suwaki głośności i parametrów.
*   **`ItemSlot.tsx`**: Klasyczny slot ekwipunku i pasów eliksirów z ramkami rzadkości (`common`, `uncommon`, `rare`, `legendary`).
*   **`KbdKey.tsx`**: Wizualne odznaki klawiszy klawiatury i przycisków kontrolera.
*   **`Tabs.tsx`**: Przełącznik zakładek opcji i widoków.
*   **`StatRow.tsx`**: Wiersz statystyk bojowych postaci.
*   **`/src/styles/theme.ts`**: Centralne tokeny projektowe (kolory bursztynu, hebanu, kamienia, pancerza i magii).

---

## 3. Relatywne Skalowanie i Elastyczny Viewport (Brak Sztywnych Pikseli)

*   **Wirtualne Współrzędne Świata**: Silnik operuje na logicznych jednostkach układu współrzędnych (`baseWidth: 1000`).
*   **Dynamiczny ResizeObserver**: Kontener płótna w `HUDOverlay` mierzy rozmiar okna w czasie rzeczywistym i dostosowuje bufor Canvas uwzględniając `window.devicePixelRatio`.
*   **Dopasowanie do Formatów (Aspect Ratios)**: Obsługa trybów formatu obrazu (`16:10`, `16:9`, `Auto Fill`) oraz filtrowania (`Pixel Art Sharp` / `Smooth Bilinear`).
*   **Jednostki UI**: Interfejs użytkownika wykorzystuje elastyczny Flexbox, CSS Grid, `rem`, `%`, `aspect-ratio` oraz `clamp()` bez sztywnych wymiarów blokujących responsywność.

---

## 4. Ergonomiczne Sterowanie dla 2 Graczy oraz Obsługa Padów (Gamepad API)

*   **Brak Kolizji Klawiszy (Ergonomiczny 2-Player)**:
    *   **Gracz 1**: Lewa flanka klawiatury: `WASD` (Ruch), `Spacja`/`K` (Skok), `J` (Atak), `L` (Zryw/Ślizg/Odskok), `U` (Magia Główna), `I` (Magia Pomocnicza), `1-3` (Eliksiry).
    *   **Gracz 2**: Prawa flanka klawiatury: `Strzałki` (Ruch), `Numpad 0`/`/` (Skok), `Numpad 1`/`N` (Atak), `Numpad 2`/`M` (Zryw), `Numpad 4`/`[` (Magia Główna), `Numpad 5`/`]` (Magia Pomocnicza), `Numpad 7-9`/`8-0` (Eliksiry).
*   **Gamepad (Kontroler)**:
    *   Wsparcie dla kontrolerów Xbox, PlayStation oraz DirectInput/Generic przez Gamepad API.
    *   Gracz 1 korzysta z Gamepada 0, Gracz 2 z Gamepada 1.
    *   Dedykowany komponent `GamepadMapper.tsx` z wizualnym podglądem wciśniętych przycisków, martwych stref (deadzone) oraz możliwością remapowania w locie.

---

## 5. System RPG, Ekwipunek (BG2) i Drzewko Magii

*   **Ekwipunek w stylu Baldur's Gate II (`/src/game/logic/inventory.ts`)**: Sylwetka (Głowa, Prawa Ręka, Lewa Ręka, Tors, Szyja, Palec), plecak o 12 slotach oraz szybki 3-slotowy pas na mikstury.
*   **Drzewko Magii (`/src/game/logic/skills.ts`)**: Konstelacja magii ofensywnej, defensywnej i pasywnej. Odblokowywanie za punkty umiejętności (PU) zdobywane z manekinów i zadań.
*   **Dynamiczne Obliczanie Statystyk**: Wyposażenie i umiejętności pasywne w locie modyfikują maksymalne życie, manę, wytrzymałość, moc ataku i obronę.

---

## 6. Internacjonalizacja i Tłumaczenia (Strict i18n Rule)

*   **ZAKAZ HARDKODOWANIA TEKSTU**: Żaden tekst widoczny dla użytkownika nie może być na stałe wpisany w plikach `.tsx` ani `.ts` silnika gry.
*   **STRUKTURA SŁOWNIKOWA**: Wszystkie napisy muszą znajdować się w pliku `/src/game/assets/i18n.ts` pod odpowiednimi kluczami w słownikach `pl` oraz `en`.
*   **POBIERANIE PRZEZ SŁOWNIK**: W kodzie React oraz silniku odwołujemy się wyłącznie do `translations[lang].key` lub dedykowanych zmiennych słownikowych.

---

## 7. SOLID (Zasady Architektoniczne)

*   **S**ingle Responsibility: Każda klasa/plik odpowiada wyłącznie za jedną rzecz.
*   **O**pen-Closed: Kod jest otwarty na rozbudowę, ale zamknięty na modyfikacje.
*   **L**iskov Substitution: Klasy pochodne i implementacje strategii mogą być stosowane zamiennie.
*   **I**nterface Segregation: Wąskie, wyspecjalizowane interfejsy.
*   **D**ependency Inversion: Silnik opiera się na abstrakcjach, a nie na sztywnych powiązaniach klas konkretnych.
