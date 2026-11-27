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

Każdy wróg, platforma, dekoracja i konstrukcja ma już plik hi-8bit. Malowane arkusze **high** istnieją dziś dla obu bohaterów, dla zegarowej sowy-gargulca, dla Kukły Treningowej i dla czterech konstrukcji (bram, dźwigni i cierni). Większość pozostałych wrogów, platform i dekoracji nie ma malowanego arkusza, więc na **high** pokazują grafikę hi-16bit.

Jedyne pozostałe luki w hi-16bit to zegarowa sowa-gargulec, Kukła Treningowa i cztery konstrukcje. Na poziomie hi-16bit pokazują malowany arkusz, a na hi-8bit własną grafikę hi-8bit.

## Ustawienia wyświetlania

Te opcje są w **Ustawienia > Obraz** w menu gry.

- **Proporcje obrazu.** Auto (wypełnia okno, domyślnie), 16:9, 16:10 lub 4:3. Obok nich jest przycisk pełnego ekranu.
- **Filtr skalowania.** Pikselowy (ostry, najbliższy sąsiad, domyślnie) lub Wygładzony (dwuliniowy, miększe krawędzie).
- **Jakość grafiki.** Trzy poziomy opisane wyżej, przełączane na żywo.
- **Docelowa liczba klatek.** 30, 60 (domyślnie), 90 lub 120 FPS. Symulacja działa z wybraną częstotliwością, a mnożnik pokazany w menu mówi, jak każdy krok skaluje czas.
- **Licznik FPS.** Przełącznik pokazujący liczbę klatek na ekranie.
- **Akceleracja GPU.** Włączona domyślnie. Przełącznik jest w tej samej karcie.
- **Przywróć ustawienia ekranu.** Przywraca domyślne ustawienia wyświetlania. Nie zmienia pozostałych ustawień.

## Jak powstaje grafika pikselowa

Narzędzia do sprite'ów znajdują się w `scripts/sprites/`. Każdy sprite jest albo skryptem, albo namalowaną grafiką przekonwertowaną na pliki, dzięki czemu można go odtworzyć i sprawdzić.

- **Bohaterowie z malowanych klatek.** Valen i Aurelia są najpierw malowani. Kwantyzator palety czyta klatki i buduje arkusze hi-8bit i hi-16bit.
- **Tilesety platform.** Każdy tileset to mały skrypt opisujący kafelki. Kompilator zapisuje arkusze hi-8bit i hi-16bit z mapą kafelków.
- **Dekoracje.** Lampiony, palniki, banery i kryształy też są skryptami, z punktem zakotwiczenia do ustawiania na poziomie.
- **Wrogowie.** Sprite'y wrogów są opisane kodem i kompilowane do plików SVG dla poziomów.

Aby obejrzeć wynik przed zatwierdzeniem, dodaj `--preview <katalog>`:

```bash
bun scripts/sprites/cli.ts <id> --preview tmp/preview
```

Katalog podglądu dostaje arkusze dla każdego poziomu, powiększone dla wygody. `--check` potwierdza, że zatwierdzone pliki odpowiadają skryptom.

## Zaplanowane

- Malowane arkusze `high` dla wrogów, platform i dekoracji, które mają dziś tylko grafikę wektorową lub pikselową (faza 6).
- Zapis grafiki hi-16bit w czasie builda (faza 5).
