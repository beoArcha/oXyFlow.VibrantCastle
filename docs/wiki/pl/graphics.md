# Jakość grafiki

Ustawienie jakości grafiki, w menu gry w ustawieniach wyświetlania, zmienia wygląd bohaterów, wrogów, platform i dekoracji. Rozgrywka, kolizje i układ poziomu są takie same na każdym ustawieniu. Zmiana działa od razu, bez restartu.

## Trzy poziomy

Menu pokazuje te nazwy. Ustawienia zapisują je jako `low`, `mid` i `high`, a pliki grafik używają przyrostków `hi8bit` i `hi16bit`.

| Nazwa w menu | Bohaterowie | Wrogowie | Platformy i dekoracje | Jak to wygląda |
| :--- | :--- | :--- | :--- | :--- |
| **hi-8bit** | Małe sprite'y pikselowe | Krępe sprite'y w stylu gier 8-bitowych | Kafelki pikselowe | Płaskie kolory z małej palety, twarde obrysy i kanciaste kształty. Najlżejsza opcja. |
| **hi-16bit** | Bogatsze sprite'y pikselowe | Bogatsze sprite'y w stylu gier 16-bitowych | Kafelki pikselowe w pełnej rozdzielczości | Więcej kolorów, proste cieniowanie i podświetlenia, ostre krawędzie pikseli. |
| **high** (domyślnie) | Malowane arkusze animacji | Grafika wektorowa w stylu hi-16bit, dopóki nie ma malowanych arkuszy | Używa wyglądu hi-16bit | Pełnokolorowe malowane klatki z największą liczbą szczegółów. |

Wrogowie bez malowanego arkusza używają na **high** grafiki hi-16bit. Nic nie zostaje bez sprite'a.

## Dlaczego gra pozostaje lekka

Poziomy zmieniają tylko wygląd. Arkusze sprite'ów wczytują się przy pierwszym użyciu, więc gra startuje szybko na każdym poziomie. Jeśli gra działa wolno na twoim urządzeniu, najpierw obniż jakość. Układ poziomu i rozgrywka pozostają takie same.

## Jak powstaje grafika pikselowa

Grafikę tworzy się narzędziami sprite'ów Bun w `scripts/sprites/`. Wszystko, czego używa gra, jest albo napisane kodem, albo namalowane i przekonwertowane, dzięki czemu można ją odtworzyć i sprawdzić.

- **Bohaterowie z malowanych klatek.** Valen i Aurelia są najpierw malowani. Kwantyzator palety czyta klatki i buduje arkusze hi-8bit i hi-16bit.
- **Tilesety platform.** Każdy tileset to mały skrypt opisujący kafelki. Kompilator zapisuje arkusze hi-8bit i hi-16bit z mapą kafelków i odrzuca puste lub przezroczyste kafelki litego podłoża.
- **Dekoracje.** Lampiony, palniki, banery i kryształy też są skryptami. Kompilator sprawdza punkt zakotwiczenia każdej dekoracji.
- **Wrogowie.** Sprite'y wrogów rysuje się piksel po pikselu, a kompilator zapisuje je jako pliki wektorowe dla poziomów. Odrzuca klatki z pustymi komórkami lub unoszącymi się stopami.

Aby sprawdzić grafikę przed zatwierdzeniem, dodaj `--preview <katalog>`:

```bash
bun scripts/sprites/cli.ts <id> --preview tmp/preview
```

Katalog podglądu dostaje arkusze dla każdego poziomu, powiększone dla wygody. `--check` potwierdza, że zatwierdzone pliki odpowiadają skryptom. Kontrakt autorski każdego rodzaju sprite'a opisuje `scripts/sprites/README.md`.

## Zaplanowane

- Malowane arkusze `high` dla wrogów, którzy mają dziś tylko grafikę wektorową (faza 6).
- Test kompletności poziomów jakości i zapis grafiki hi-16bit w czasie builda (faza 5).
