### Faza 5: Weryfikacja Końcowa (Unified Verification Gate)

#### Zadanie 5.1: Testy integracyjne przepływu wyboru postaci
* **Pliki**:
  - `src/tests/integration/engine/characterSelection.integration.test.ts` (nowy plik testu integracyjnego)
* **Zakres**:
  - Weryfikacja pełnego cyklu: start gry (P1=Valen) $\rightarrow$ zmiana na Aurelię $\rightarrow$ włączenie Co-Op (P2=Valen) $\rightarrow$ użycie czaru $\rightarrow$ zapis i wczytanie stanu $\rightarrow$ potwierdzenie spójności tożsamości.

#### Zadanie 5.2: Uruchomienie pełnego zestawu weryfikacji automatycznej
* **Polecenia**:
  - `bun run typecheck` (`tsc --noEmit`)
  - `bun run test:arch`
  - `bun test`
* **Kryteria akceptacji**: 100% testów przechodzi, 0 błędów typowania.

#### Zadanie 5.3: Manualne testy agenta za pomocą Chrome MCP / Browser Preview
* **Narzędzia**: `preview_status`, `preview_open`, `preview_navigate`, `preview_act`, `preview_evaluate`, `preview_snapshot`.
* **Zakres**:
  - Uruchomienie `bun dev` na porcie 3000.
  - Otwarcie gry w przeglądarce za pomocą Chrome MCP (`preview_open`).
  - Otwarcie Menu Ustawień $\rightarrow$ zakładka Rozgrywka (`GameplayTab`).
  - Kliknięcie wyboru postaci: zmiana na Aurelię jako P1.
  - Weryfikacja wizualna portretów, plakietek i dynamicznych etykiet.
  - Otwarcie Ekwipunku (`I`) i Drzewka Umiejętności (`K`) w przeglądarce i potwierdzenie tożsamości Aurelii na slocie P1.
  - Sprawdzenie logów konsoli przeglądarki (`preview_evaluate`) pod kątem braku błędów i ostrzeżeń Reacta.
  - Zapisanie zrzutu ekranu jako dowodu weryfikacji (`preview_snapshot`).
* **Kryteria akceptacji**: Pełne przejście ścieżki użytkownika w przeglądarce, 0 błędów w konsoli.