# Sterowanie i interfejs

To są domyślne ustawienia dostarczane z grą, wzięte z danych sterowania. Każdy przycisk można zmienić w **Ustawienia > Sterowanie**. Klawiatura i pad działają jednocześnie.

---

## 1. Klawiatura: gracz 1 (Valen)

| Akcja | Klawisze |
| :--- | :--- |
| Ruch w lewo / w prawo | <kbd>A</kbd> / <kbd>D</kbd> |
| Patrzenie w górę / w dół | <kbd>W</kbd> / <kbd>S</kbd> |
| Skok | <kbd>Spacja</kbd> |
| Cios rapierem | <kbd>J</kbd> |
| Ślizg / dash | <kbd>L</kbd> (w przód to ślizg, w tył to odskok) |
| Zaklęcie 1 / zaklęcie 2 | <kbd>U</kbd> / <kbd>O</kbd> |
| Mikstury 1 / 2 / 3 | <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> |

## 2. Klawiatura: gracz 2 (Aurelia)

| Akcja | Klawisze |
| :--- | :--- |
| Ruch w lewo / w prawo | <kbd>←</kbd> / <kbd>→</kbd> |
| Patrzenie w górę / w dół | <kbd>↑</kbd> / <kbd>↓</kbd> |
| Skok | <kbd>Num 0</kbd> lub <kbd>Enter</kbd> |
| Cios | <kbd>Num 1</kbd> |
| Ślizg / dash | <kbd>Num 3</kbd> |
| Zaklęcie 1 / zaklęcie 2 | <kbd>Num 4</kbd> / <kbd>Num 5</kbd> |
| Mikstury 1 / 2 / 3 | <kbd>Num 7</kbd> / <kbd>Num 8</kbd> / <kbd>Num 9</kbd> |

---

## 3. Pad

Gracz 1 używa pierwszego podłączonego pada, gracz 2 drugiego. Standardowe numery przycisków są w nawiasach.

| Akcja | Przycisk |
| :--- | :--- |
| Ruch | Lewa gałka lub krzyżak |
| Skok | <kbd>A</kbd> (0) |
| Cios | <kbd>X</kbd> (2) |
| Ślizg / dash | <kbd>B</kbd> (1) |
| Zaklęcie 1 | <kbd>Y</kbd> (3) |
| Zaklęcie 2 | <kbd>RB</kbd> (5) |
| Mikstury 1 / 2 / 3 | <kbd>LB</kbd> (4) / <kbd>LT</kbd> (6) / <kbd>RT</kbd> (7) |

Martwa strefa gałki wynosi 0,25.

### Ograniczony układ pada

Pad ma 4 przyciski twarze, 2 spusty i 2 zderzaki. W menu zderzaki i spusty służą do przełączania kart:

- <kbd>LB</kbd> / <kbd>RB</kbd> przełączają karty pierwszego poziomu.
- <kbd>LT</kbd> / <kbd>RT</kbd> przełączają karty drugiego poziomu.
- <kbd>Start</kbd> otwiera menu. Przytrzymanie <kbd>LB</kbd> + <kbd>RB</kbd> razem przez 0,5 s też je otwiera, więc pad bez przycisku Start również da radę.

**Zaplanowane (faza 5):** w grze zderzaki również mają stać się selektorami, tak by domyślne ustawienia powyżej (które używają <kbd>LB</kbd>, <kbd>RB</kbd> i spustów do mikstur i zaklęć) przeszły na semantykę selektorów.

---

## 4. Karty menu gry

Menu gry to jedno okno z kartami na dwóch poziomach. Karty pierwszego poziomu przełącza się klawiszami <kbd>Q</kbd> / <kbd>E</kbd> albo <kbd>LB</kbd> / <kbd>RB</kbd>. Karty drugiego poziomu przełącza się klawiszami <kbd>[</kbd> / <kbd>]</kbd> albo <kbd>LT</kbd> / <kbd>RT</kbd>.

| Karta | Klawisz | Co zawiera |
| :--- | :--- | :--- |
| Gra | <kbd>M</kbd> | Zapis, wczytanie i restart bieżącej lokacji |
| Mapa | | Wybór lokacji |
| Postać | | Statystyki bieżącego bohatera |
| Ekwipunek | <kbd>I</kbd> | Przedmioty i wyposażenie |
| Magia | <kbd>K</kbd> | Drzewko umiejętności |
| Ustawienia | | Cztery karty drugiego poziomu: Obraz, Dźwięk, Sterowanie i Interfejs |
| Pomoc | <kbd>H</kbd>, <kbd>?</kbd> lub <kbd>F1</kbd> | Pomoc i sterowanie |

## 5. Pad w menu

| Przycisk | Akcja |
| :--- | :--- |
| <kbd>A</kbd> | Aktywuje zaznaczoną kontrolkę |
| <kbd>B</kbd> | Wstecz: anuluje przypisywanie, zamyka okno na wierzchu lub zamyka menu |
| <kbd>Start</kbd> | Otwiera menu. W menu działa jak <kbd>B</kbd>. |
| <kbd>X</kbd> | Akcja kontekstowa na zaznaczonej kontrolce |
| <kbd>Y</kbd> | Pokazuje lub chowa legendę przycisków |
| Krzyżak lub lewa gałka | Przesuwa fokus |
| <kbd>LB</kbd> / <kbd>RB</kbd>, <kbd>LT</kbd> / <kbd>RT</kbd> | Karty pierwszego i drugiego poziomu |

---

## 6. Skróty klawiaturowe

- <kbd>M</kbd>: otwiera lub zamyka menu gry.
- <kbd>Esc</kbd>: zamyka otwarte okno, a gdy żadne nie jest otwarte, otwiera menu.
- <kbd>P</kbd>: pauza i wznowienie.
- <kbd>I</kbd>: ekwipunek.
- <kbd>K</kbd>: drzewko umiejętności.
- <kbd>H</kbd>, <kbd>?</kbd> lub <kbd>F1</kbd>: pomoc i sterowanie.
- <kbd>Q</kbd> / <kbd>E</kbd>: poprzednia / następna karta pierwszego poziomu, gdy okno gry jest otwarte.
- <kbd>[</kbd> / <kbd>]</kbd>: poprzednia / następna karta drugiego poziomu, gdy okno gry jest otwarte.
- <kbd>C</kbd>: okno deweloperskie („Tworzenie”). Istnieje tylko w buildach deweloperskich.

Skróty są ignorowane, gdy piszesz w polu tekstowym. Gra nie używa kombinacji z <kbd>Ctrl</kbd>, <kbd>Alt</kbd> ani <kbd>Meta</kbd>.

---

## 7. Zmiana przypisania

1. Otwórz w menu **Ustawienia > Sterowanie**.
2. Wybierz akcję i naciśnij nowy klawisz albo przycisk pada.
3. Naciśnij <kbd>Esc</kbd>, aby anulować zmianę.

Na klawiaturze można przypisać dowolny klawisz z wyjątkiem klawiszy systemowych: <kbd>Tab</kbd>, <kbd>Caps Lock</kbd>, klawiszy <kbd>Win</kbd> / <kbd>Cmd</kbd>, klawisza menu kontekstowego oraz <kbd>F1</kbd>–<kbd>F12</kbd>. Na padzie można przypisać tylko przyciski ograniczonego układu: <kbd>A</kbd> / <kbd>B</kbd> / <kbd>X</kbd> / <kbd>Y</kbd>, <kbd>LB</kbd> / <kbd>RB</kbd> i <kbd>LT</kbd> / <kbd>RT</kbd>. Inne przyciski zostaną odrzucone z komunikatem.

## 8. Potwierdzenia

Gra pyta o potwierdzenie przed każdą akcją, której nie da się cofnąć albo która nadpisuje postęp lub ustawienia:

- restart bieżącej lokacji;
- wczytanie zapisu, które zastępuje bieżący stan;
- import ustawień, który zastępuje bieżącą konfigurację;
- przywrócenie wszystkich ustawień domyślnych;
- przywrócenie domyślnego sterowania dla jednego gracza albo dla wszystkich;
- wyzerowanie statystyk sesji;
- wyrzucenie przedmiotu z ekwipunku.

---

## 9. Gra na stronie

- Kliknij grę albo wciśnij **Uruchom Grę**, aby otrzymała fokus klawiatury.
- Gra nie blokuje klawiatury. Wciśnij <kbd>Tab</kbd>, aby z niej wyjść i wrócić na stronę.
- <kbd>F11</kbd> albo przycisk pełnego ekranu powiększa grę. <kbd>Esc</kbd> wychodzi z pełnego ekranu.
