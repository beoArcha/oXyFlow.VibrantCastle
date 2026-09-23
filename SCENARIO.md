# Scenariusz Fabularny Gry: Vibrant Castle

## Wstęp i Koncepcja Świata
Świat *Vibrant Castle* to połączenie melancholijnej, ciepłej estetyki XIX-wiecznego gotyckiego fantasy (inspirowanej *Owlboy* oraz *Castlevania: Aria of Sorrow*) z dynamiczną, kinetyczną akcją i reaktywną narracją w stylu *Bastion* oraz *Hades*.

Świat zamkowy zawieszony jest w wiecznej, złotej jesieni. Prastary Zamek Aetheru, niegdyś siedziba gildii szermierzy i zegarmistrzów, został uśpiony przez tajemniczy kataklizm. Gracze wcielają się w Przebudzonych Szermierzy, którzy pod okiem niewidzialnego, mądrego Kronikarza przemierzają kolejne kondygnacje twierdzy, uruchamiając zapomniane machiny i pokonując mechaniczno-magicznych strażników.

---

## Akt I: Słoneczny Bastion Zamku (Poziom Treningowy / The Sunlit Bastion)

### Przebieg Rozgrywki i Etapy:

```
[Dziedziniec] ---> [Rozpadlina Cierni] ---> [Arena Treningowa] ---> [Winda i Portal]
  (Start 0-500)      (Skoki 500-1050)        (Walka 1050-1480)       (Finał 1480-2000)
```

### 1. Przebudzenie na Słonecznym Dziedzińcu (x: 0 - 500)
- **Atmosfera**: Ciepłe, złoto-ochrowe niebo, spadające powoli liście dębowe, bezpieczna posadzka z terakotowych cegieł.
- **Narracja początkowa**:
  > *„Chłopak obudził się na zalanym słońcem dziedzińcu zamkowym. Wokół unosił się zapach jesieni i starożytnego kamienia...”*
- **Cel gracza**: Zapoznanie się z podstawowym ruchem (kroki w lewo/prawo) oraz dynamiką postaci.
- **Dla 2 Graczy (Kooperacja)**: Drugi gracz budzi się obok; Kronikarz odnotowuje braterstwo broni i wspólną przysięgę.

### 2. Próba Zręczności – Rozpadlina Bursztynowych Cierni (x: 500 - 1050)
- **Atmosfera**: Spękane mury, dno przepaści najeżone połyskującymi, ostrymi kryształami o barwie bursztynu (śmiertelna pułapka typu *Hazard*).
- **Wyzwanie**: Seria zawieszonych w powietrzu półek skalnych na zmiennych wysokościach:
  - Półka 1: (x: 500, y: 460)
  - Półka 2: (x: 680, y: 360)
  - Półka 3: (x: 860, y: 280)
- **Narracja po skokach**:
  > *„Jeden zły krok i po tobie. Ale ten chłopak wiedział, jak oszukać grawitację.”*
- **Mechanika zrywu (Dash)**: Gracz wykorzystuje mechanikę `Dash` (zryw z widmowym powidokiem), by bezpiecznie pokonać najszersze szczeliny.

### 3. Sala Szermiercza i Złoty Rygiel (x: 1050 - 1480)
- **Atmosfera**: Zamknięta arena otoczona zabytkowymi kolumnami. Na środku stoi słomiany manekin ćwiczebny w żelaznym hełmie. Drogę dalej blokuje opuszczona, żelazna brama kratowa (`gate_1`).
- **Wyzwanie Bojowe**:
  - Gracz testuje pchnięcie i cięcie rapierem na manekinie (Straw Dummy).
  - Po uderzeniu manekin rozbłyskuje czerwienią i uwalnia deszcz trocin oraz iskier, dodając 150 punktów do wyniku.
  - **Komentarz Narratora**: *„Pierwszy cios zawsze smakuje najlepiej. Stal śpiewała w powietrzu.”*
- **Wyzwanie Logiczne (Dźwignia)**:
  - Złota dźwignia mechaniczna (x: 1200, y: 375).
  - Gracz musi uderzyć dźwignię orężem, by zwolnić blokadę przeciwwagi. Dźwignia zmienia pozycję, zapala się szmaragdowy wskaźnik, a brama zamkowa unosi się pod sufit.
  - **Komentarz Narratora**: *„Dźwignia stawiła opór, ale determinacja była silniejsza. Droga stała otworem.”*

### 4. Podniebna Wspinaczka i Brama Aetheru (x: 1480 - 2000)
- **Atmosfera**: Otwarty taras z widokiem na odległe sylwetki wież zamkowych w paralaksie. W powietrzu unosi się mosiężna, poruszająca się poziomo platforma.
- **Zagrożenie**: Zegarowy Sowi Gargulec (Clockwork Owl Gargoyle) patrolujący przestrzeń powietrzną.
- **Wyzwanie Finałowe**:
  - Uniknięcie lub zniszczenie latającego przeciwnika.
  - Wskoczenie na ruchomą windę (x: 1550, y: 280) w odpowiednim momencie trajektorii.
  - Dotarcie na najwyższą basztę (x: 1880, y: 340).
- **Zwieńczenie Poziomu**:
  - Wejście w pulsujący, aeterowy portal o błękitno-złotym blasku.
  - Ekran Zwycięstwa i podsumowanie punktów.
  - **Końcowy Monolog Narratora**:
    > *„Brama Aetheru rozbłysła dawnym blaskiem. Pierwsza próba dobiegła końca, lecz prawdziwa podróż dopiero się zaczynała...”*

---

## Zarys Kolejnych Rozdziałów (Przyszłe Akty)

### Akt II: Zegarowe Ogrody Aetheru (Clockwork Gardens)
Bohaterowie docierają do wiszących ogrodów napędzanych potężnymi przekładniami zębatymi. Środowisko pełne ruchomych kół młyńskich, parowych gejzerów i mechanicznych modliszek.
- **Główny cel**: Odnalezienie trzech Kryształów Rezonansu i ponowne uruchomienie Głównego Akweduktu.

### Akt III: Serce Prastarej Cytadeli (The Citadel Core)
Wnętrze wieży zegarowej, gdzie czas i przestrzeń ulegają zagięciu. Walka z Wielkim Konstruktem Zegarowym (The Grand Chronomancer).
- **Główny cel**: Ustabilizowanie Rdzenia Czasu i ocalenie zamku przed zapomnieniem.
