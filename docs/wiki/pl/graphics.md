# Jakość grafiki

Ustawienie jakości grafiki (w menu gry, w ustawieniach obrazu) zmienia sposób rysowania bohaterów, przeciwników, platform i dekoracji. Rozgrywka, kolizje i układ poziomów są identyczne na każdym ustawieniu.

## Trzy poziomy

| Ustawienie | Bohaterowie | Przeciwnicy | Platformy i dekoracje | Jak wygląda |
| :--- | :--- | :--- | :--- | :--- |
| **hi-8bit** | Małe pixel-artowe sprite'y, lekko rozjaśnione | Krępe sprite'y w stylu gier 8-bitowych | Pixelowe kafle rysowane w podwójnym rozmiarze | Płaskie kolory z małej palety, twarde obrysy i kanciaste kształty, ostre na dzisiejszych ekranach. Najlżejsza opcja dla słabszych urządzeń. |
| **hi-16bit** | Bogatsze pixel-artowe sprite'y z większą liczbą kolorów | Bogatsze sprite'y w stylu gier 16-bitowych | Pixelowe kafle w pełnej rozdzielczości | Więcej kolorów, proste cieniowanie i podświetlenia, wciąż ostre krawędzie pikseli. |
| **high** | Malowane animacje | Malowane animacje, jeśli istnieją | Wygląd hi-16bit | Pełnokolorowe malowane klatki z największą liczbą szczegółów. |

Część grafik nie ma jeszcze wersji malowanej. Przeciwnicy bez malowanego arkusza na ustawieniu **high** używają grafiki hi-16bit, a platformy i dekoracje na tym ustawieniu wyglądają jak hi-16bit, więc nic nie zostaje bez grafiki.

Zmiany działają od razu, bez restartu: bohaterowie, przeciwnicy, platformy i dekoracje przełączają się na wybraną jakość zaraz po jej wybraniu.

## Dlaczego gra pozostaje lekka

Poziomy jakości zmieniają tylko wygląd. Arkusze bohaterów, platform i dekoracji to bezstratne pliki PNG, a arkusze przeciwników to małe pliki wektorowe. Każdy z nich wczytuje się dopiero wtedy, gdy jest potrzebny, więc gra startuje szybko na każdym poziomie.

Jeśli gra działa wolno na Twoim urządzeniu, najpierw obniż jakość; układ poziomów i rozgrywka są identyczne na każdym ustawieniu.

## Jak powstaje pixel art

Twórcy tworzą grafikę narzędziami Bun z katalogu `scripts/sprites/`. Wszystko, czego używa gra, jest albo opisane kodem, albo namalowane i potem przekonwertowane, dzięki czemu grafikę można odtworzyć i sprawdzić.

* **Bohaterowie z malowanych klatek.** Valen i Aurelia najpierw są malowani. Kwantyzator palety czyta malowane klatki i buduje z nich arkusze hi-8bit i hi-16bit. Poziom hi-8bit ma lekką korekcję kolorów (gamma, kontrast i nasycenie), dzięki której twarze i płaszcze są czytelne; poziom hi-16bit nie jest korygowany.
* **Tilesety platform.** Każdy tileset (np. `courtyard_stone` czy `sanctuary_crystal`) jest zapisany jako mały skrypt opisujący jego kafle. Kompilator zamienia go na arkusze hi-8bit i hi-16bit wraz z mapą kafli. Walidacja odrzuca puste kafle i półprzezroczyste kafle litych elementów oraz ostrzega o szwach, które się nie łączą.
* **Dekoracje.** Lampy, kosze z ogniem, sztandary i kryształy też są skryptami. Dekoracja to krótka animacja z punktem zakotwiczenia i opcjonalnym blaskiem; kompilator sprawdza zakotwiczenie (dekoracja kotwiczona na dole musi dotykać dolnego rzędu klatek, a kotwiczona u góry — górnego) i zapisuje arkusze hi-8bit i hi-16bit.
* **Przeciwnicy.** Sprite'y przeciwników rysuje się piksel po pikselu interfejsem PixelCanvas. Kompilują się do SVG dla poziomów hi-8bit i hi-16bit, a kompilator odrzuca klatki z pustymi komórkami, unoszącymi się stopami albo klatki, które wyglądają tak samo na obu poziomach.

Aby sprawdzić grafikę przed zatwierdzeniem zmian, dodaj `--preview <katalog>`:

```bash
bun scripts/sprites/compile.ts <id> --preview tmp/preview
```

Katalog podglądu dostaje arkusze poszczególnych poziomów danego sprite'a. Przeciwnicy i bohaterowie dostają po jednym pliku PNG na poziom w normalnym rozmiarze; tilesety dostają powiększone kopie (4x) i demo kafli; dekoracje dostają powiększone kopie (4x) i pasek z blaskiem na ciemnym tle. Otwórz je i obejrzyj przed zatwierdzeniem. `--check` potwierdza, że zapisane pliki nadal odpowiadają skryptom, a `--all` buduje wszystko od nowa.

Opis kontraktu autorskiego każdego rodzaju sprite'a znajdziesz w `scripts/sprites/README.md`.
