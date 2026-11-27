# Nowości

## 0.3.x (faza 4, w toku): stabilizacja i odbudowa

Faza 4 odbudowuje to, co zniknęło przy porządkach w 0.3.0, które usunęły tilesety, dekoracje, potok sprite'ów, testy i dokumentację. Przywraca utracone elementy i wyznacza kierunek kolejnej fazy. Najnowsze zmiany są na początku listy.

- **Grafika zastępcza.** Dodano brakującą grafikę hi-8bit dla kilku sprite'ów. Test śledzi kilka konstrukcji i wrogów, które wciąż nie mają jednego z poziomów.
- **Kontrakty postaci i mapy.** System postaci i kontrakt mapy są spisane jako dokumenty projektowe, tak by kolejna faza mogła na nich bazować.
- **Karty planowania.** Karty zadań fazy 4 dotyczące dyskusji o lore, scenariuszy demo oraz narzędzia Tworzenie do map i tekstów są na tablicy zadań.
- **Mapper pada.** W Ustawienia > Sterowanie jest mapper pada dla ograniczonego układu. Można przypisać tylko <kbd>A</kbd> / <kbd>B</kbd> / <kbd>X</kbd> / <kbd>Y</kbd>, <kbd>LB</kbd> / <kbd>RB</kbd> i <kbd>LT</kbd> / <kbd>RT</kbd>. Przywrócenie sterowania najpierw pyta o potwierdzenie.
- **Menu przebudowane do jednego okna gry.** Menu gry to jedno dwupoziomowe okno z rejestrem kart: Gra, Mapa, Postać, Ekwipunek, Magia, Ustawienia i Pomoc. Okno deweloperskie („Tworzenie”) pojawia się tylko w buildach deweloperskich.
- **Nawigacja padem.** Menu obsługuje się padem: <kbd>LB</kbd> / <kbd>RB</kbd> dla kart górnych, <kbd>LT</kbd> / <kbd>RT</kbd> dla kart drugiego poziomu, a menu otwiera <kbd>Start</kbd> albo przytrzymanie <kbd>LB</kbd> + <kbd>RB</kbd> przez 0,5 s. Zobacz *Sterowanie*.
- **Potwierdzenia.** Niebezpieczne akcje najpierw pytają: restart lokacji, wczytanie zapisu, import lub reset ustawień, reset sterowania i wyrzucenie przedmiotu.
- **Testy przywrócone.** Wróciły testy postaci, granic błędów, menu, sterowania i układu. Bramka pokrycia działa dla każdego zestawu, z minimami: 74% dla testów jednostkowych, 58% dla integracyjnych i 73% łącznie.
- **Dokumentacja, lore i wiki przywrócone.** Wróciły lore, manifest i pliki zadań dla poszczególnych faz. Ta wiki jest napisana w Markdownie i budowana razem z grą.
- **Tilesety i dekoracje z powrotem.** Tilesety platform są przywrócone na prefabrykatach podłogi i platform, a dekoracje i narzędzia sprite'ów wróciły do potoku.
- **Ponownie poprawne cięcie arkuszy.** Arkusze pikselowe bohaterów i arkusz sowy-gargulca są znów cięte poprawnie.
- **Mapa drogowa z fazami.** Plan wyznacza każdą fazę aż do wersji 1.0, z celami i bramkami jakości.

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
