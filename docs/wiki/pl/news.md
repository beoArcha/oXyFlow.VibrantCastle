# Nowości

## 0.3.x (faza 4, w toku): stabilizacja i odbudowa

Faza 4 odbudowuje to, co zniknęło przy porządkach w 0.3.0, które usunęły tilesety, dekoracje, potok sprite'ów, testy i dokumentację. Przywraca utracone elementy i wyznacza kierunek kolejnej fazy.

- **Menu przebudowane do jednego okna gry.** Menu gry to jedno dwupoziomowe okno z rejestrem kart. Niebezpieczne akcje pytają o potwierdzenie. Okno deweloperskie („Tworzenie”) pojawia się tylko w buildach deweloperskich.
- **Nawigacja kartami padem i klawiaturą.** Menu obsługuje się padem: <kbd>LB</kbd> / <kbd>RB</kbd> dla kart górnych i <kbd>LT</kbd> / <kbd>RT</kbd> dla kart drugiego poziomu. Zobacz *Sterowanie*.
- **Przywrócone grafiki i potok.** Tilesety platform, dekoracje i narzędzia sprite'ów wróciły. Tilesety platform są przywrócone na prefabrykatach podłogi i platform.
- **Naprawione cięcie sprite'ów.** Arkusze bohaterów i sowy są znów poprawnie cięte.
- **Testy i CI.** Testy postaci i granic błędów wróciły, a bramka pokrycia działa dla każdego zestawu.
- **Dokumentacja i wiki.** Wiki to znów dwujęzyczna wiki Markdown, a artykuły są sprawdzone względem danych gry.

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
