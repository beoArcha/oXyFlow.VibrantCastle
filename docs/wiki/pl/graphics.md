# Jakość grafiki

Ustawienia wyświetlania, w menu gry w **Ustawienia > Obraz**, sterują poziomem jakości grafiki, proporcjami obrazu, filtrem skalowania i liczbą klatek. Poziom jakości zmienia wygląd bohaterów, wrogów, platform i dekoracji. Rozgrywka, kolizje i układ poziomu są takie same na każdym poziomie. Zmiana działa od razu, bez restartu.

## Trzy poziomy

Menu pokazuje te nazwy. Ustawienia zapisują je jako `low`, `mid` i `high`, a pliki grafik używają przyrostków `hi8bit`, `hi16bit` i `high`.

| Nazwa w menu | Bohaterowie (Valen, Aurelia) | Wrogowie | Platformy i dekoracje | Jak to wygląda |
| :--- | :--- | :--- | :--- | :--- |
| **hi-8bit** | Małe arkusze sprite'ów pikselowych | Proste grafiki SVG w krępym stylu gier 8-bitowych | Kafelki pikselowe i dekoracje | Płaskie kolory z małej palety, twarde obrysy i kanciaste kształty. Najlżejsza opcja. |
| **hi-16bit** | Bogatsze arkusze sprite'ów pikselowych | Grafiki wektorowe z większą liczbą kolorów i szczegółów | Kafelki pikselowe i dekoracje w pełnej rozdzielczości | Więcej kolorów, proste cieniowanie i podświetlenia, ostre krawędzie pikseli. |
| **high** (domyślnie) | Malowane arkusze animacji | Grafiki wektorowe w stylu hi-16bit | Kafelki i dekoracje w stylu hi-16bit | Pełnokolorowe malowane klatki tam, gdzie istnieją, z największą liczbą szczegółów. |

Jeśli dla danego elementu brakuje grafiki na wybranym poziomie, gra korzysta z następnego poziomu na liście: z **high** przechodzi na hi-16bit, a potem hi-8bit, a z **hi-8bit** na hi-16bit, a potem **high**. Dzięki temu każdy element ma sprite na każdym poziomie.

Każdy wróg, platforma, dekoracja, konstrukcja i bohater ma już pliki hi-8bit oraz hi-16bit. Malowane arkusze **high** istnieją dziś dla obu bohaterów, dla zegarowej sowy-gargulca, dla Kukły Treningowej i dla czterech konstrukcji (`aether_gate`, `chrono_lever`, `grand_portcullis`, `hazard_thorns`). Pozostałe 13 katalogów wrogów, 12 dekoracji i 8 tilesetów nie ma jeszcze malowanego arkusza `high`, więc na **high** pokazują grafikę hi-16bit.

## Ustawienia wyświetlania

Te opcje są w **Ustawienia > Obraz** w menu gry.

- **Proporcje obrazu.** Auto (wypełnia okno, domyślnie), 16:9, 16:10 lub 4:3. Obok nich jest przycisk pełnego ekranu.
- **Filtr skalowania.** Pikselowy (ostry, najbliższy sąsiad, domyślnie) lub Wygładzony (dwuliniowy, miększe krawędzie).
- **Jakość grafiki.** Trzy poziomy sprite'ów opisane wyżej (`hi-8bit`, `hi-16bit`, `high`), przełączane na żywo.
- **Jakość paralaksy.** **Auto** (wykrywa możliwości urządzenia i obniża poziom przy przekroczeniu budżetu klatki), **Wysoka**, **Średnia**, **Niska** (warstwy `hi8bit` bez ciężkiej atmosfery i efektów), **Uproszczona** (ładuje tylko horyzont `far` w `hi8bit`) lub **Wyłączona** (sam gradient tła, bez obrazów paralaksy).
- **Docelowa liczba klatek.** 30, 60 (domyślnie), 90 lub 120 FPS. Symulacja działa z wybraną częstotliwością, a mnożnik pokazany w menu mówi, jak każdy krok skaluje czas.
- **Licznik FPS.** Przełącznik pokazujący liczbę klatek na ekranie.
- **Akceleracja GPU.** Włączona domyślnie. Przełącznik jest w tej samej karcie.
- **Przywróć ustawienia ekranu.** Przywraca domyślne ustawienia wyświetlania. Nie zmienia pozostałych ustawień.

## Jak powstaje grafika pikselowa

Narzędzia do sprite'ów znajdują się w `scripts/sprites/`. Każdy sprite jest albo skryptem, albo namalowaną grafiką przekonwertowaną na pliki, dzięki czemu można go odtworzyć i sprawdzić.

- **Bohaterowie z malowanych klatek.** Valen i Aurelia są najpierw malowani. Kwantyzator palety czyta klatki i buduje arkusze hi-8bit i hi-16bit.
- **Tilesety platform.** Każdy tileset to mały skrypt opisujący kafelki. Kompilator zapisuje arkusze hi-8bit i hi-16bit z mapą kafelków.
- **Dekoracje.** Lampiony, palniki, banery i kryształy też są skryptami, z punktem zakotwiczenia do ustawiania na poziomie.
- **Wrogowie i konstrukcje.** Sprite'y wrogów i konstrukcji są opisane kodem i kompilowane do plików poziomów (`hi8bit`, `hi16bit` oraz `high` dla kompilowanych konstrukcji, takich jak `aether_gate`).

Aby obejrzeć wynik przed zatwierdzeniem, dodaj `--preview <katalog>`:

```bash
bun scripts/sprites/compile.ts <id> --preview tmp/preview
```

Katalog podglądu dostaje arkusze dla każdego poziomu, powiększone dla wygody. `--check` potwierdza, że zatwierdzone pliki odpowiadają skryptom.

## Zaplanowane

- Malowane arkusze `high` dla wrogów, platform i dekoracji, które mają dziś tylko grafikę wektorową lub pikselową (faza 6).
- Zapis grafiki hi-16bit w czasie builda (faza 5).
