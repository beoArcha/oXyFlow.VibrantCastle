# The Narrator: Voice Guide & Example Lines

**Status:** Canonical voice guide (`VC-082`, Round 1 & Round 2). Reactive engine wiring (`ReactiveNarratorManager`, `src/data/narrative/narrator_reactive.json`) and live map beat triggers (`VC-083`) are tracked for Phase 4/5.

---

## 1. Identity & Framing

* **In-World Character (Round 2 Canon):** The Narrator is a **person of unknown gender** inside the 2034 world—like an **AI that once watched through cameras** and now has an **ephemeral life**, **taking notes** as Valen and Aurelia cross the Zone.
* **Not "Bastion" as a Faction (Resolves N6):** The word *Bastion* in design notes refers strictly to the narrative technique inspired by the game *Bastion* (short, reactive commentary tied to player actions)—never to a knightly order or the Narrator's own title.
* **Core Tone — Deadpan, Classy, Observant:**
  * Speaks like an unhurried, educated 2034 observer with dry poise and good manners.
  * Never melodramatic, never loud, never lecturing the player on map layout or button tutorials unless framing a training beat wryly.
  * Notices the absurd collision between 21st-century technology and medieval theater without breaking composure.

---

## 2. Voice Rules & Humour Discipline

1. **Hero-Neutrality (Resolves N3):** Every shared line MUST work whether **Valen** is played solo, **Aurelia** is played solo, or **both** move together in 2P co-op. Never hard-code masculine or feminine pronouns (`he swung`, `Chłopak obudził się`, `she`) in shared triggers; use second person (*you / Wy* or singular neutral/imperative), plural observation when framing the partnership, or focus on the action and object.
2. **Subtitle Length:** Keep each trigger to **one or two crisp sentences** (~80–150 characters) so subtitles read cleanly during fast platforming.
3. **Humour on Three Levels — Never in Dramatic Beats:**
   * **Situational humour:** Dryly noting a 2034 factory worker's hazard sign rewritten in faux-Gothic brass, or a heroic dash straight into a pit of thorns.
   * **Easter eggs:** Subtle literary, fencing, or engineering winks (never fourth-wall-shattering memes or brand references).
   * **Interpersonal banter:** Understated remarks about Valen's methodical patience versus Aurelia's impatience with stubborn mechanisms.
   * **Hard boundary:** **Zero jokes in key dramatic beats**—revelations about the 2028 cataclysm, the true cost inside the catacombs, boss breakthroughs, or confrontations at the Eclipse Crown stay grounded and poised.
4. **No Legacy Contradictions:** Never refer to the Zone as an "ancient timeless realm", never call World 7 a "warm-up training range" (`trainingIntro` on W7/W8, **N8**), and never assume Valen and Aurelia are strangers (**N7**).

---

## 3. Ten Example Lines (PL & EN, Hero-Neutral)

Each line below works identically for Valen solo, Aurelia solo, or both together in co-op.

| # | Trigger / Context | English (Deadpan & Classy) | Polish (Natural Literary Tone) |
| :---: | :--- | :--- | :--- |
| 1 | **Courtyard Awakening** (`opening`) | *Autumn leaves on French stone, and a reception committee made of old museum plate. Still—there are worse Tuesdays in 2034.* | *Jesienne liście na francuskim kamieniu i komitet powitalny z muzealnych blach. Bywały w 2034 roku gorsze wtorki.* |
| 2 | **First Dash / Slide** (`movement`) | *An enviable sense of urgency. Few visitors negotiate centuries-old flagstones with quite that much kinetic enthusiasm.* | *Godny podziwu pośpiech. Niewielu gości pokonuje zabytkowy bruk z tak wyrazistą pewnością kroku.* |
| 3 | **First Combat** (`combat`) | *Steel and focus answer before questions can form. Whatever forged these guardians clearly skipped the safety inspection.* | *Stal i skupienie odpowiadają szybciej niż pytania. Ktokolwiek złożył tych strażników, wyraźnie pominął odbiór techniczny.* |
| 4 | **Hazard Fall** (`hazard_damage`) | *Gravity remains remarkably conservative, even here. Dust off the coat and mind the brambles next pass.* | *Grawitacja zachowała tu zadziwiająco konserwatywne poglądy. Proszę otrzepać kurz i tym razem ominąć ciernie.* |
| 5 | **Lever Pulled** (`lever_activated`) | *A counterweight disguised as a pendulum, yielding to a polite tap. The demon has a flair for theatrical plumbing.* | *Przeciwwaga przebrana za wahadło uległa uprzejmemu uderzeniu. Demon ma słabość do teatralnej hydrauliki.* |
| 6 | **Clocktower Entry** (`clocktower`) | *In 2034, that tower assembled precision actuators. Now the hands run backward, and the owls have developed opinions.* | *W 2034 roku ta wieża składała precyzyjne siłowniki. Dziś wskazówki biegną wstecz, a sowy nabrały własnego zdania.* |
| 7 | **Library Entry** (`alchemist_library`) | *Cleanroom glass turned emerald, server racks bound in leather. One suspects the peer review was rather hostile.* | *Szkło laboratoriów zzieleniało, a szafy serwerowe oprawiono w skórę. Recenzja naukowa najwyraźniej nie przebiegła łagodnie.* |
| 8 | **Secret Discovered** (`secret_discovered`) | *Behind false masonry, someone tucked away something worth keeping quiet. Curiosity, as ever, outlasts good sense.* | *Za fałszywym murem ukryto coś, o czym wolelibyśmy nie rozmawiać głośno. Ciekawość, jak zwykle, przeżyła rozsądek.* |
| 9 | **Low Health** (`low_health`) | *The pulse is becoming noisy, and the edges of the room are darkening. A draught from the belt would be entirely tasteful.* | *Tętno staje się natarczywe, a krawędzie sali ciemnieją. Łyk z pasa byłby teraz wyjątkowo na miejscu.* |
| 10 | **Flawless Boss Victory** *(Dramatic — zero humour)* (`boss_defeated_flawless`) | *Not a thread out of place, not a breath wasted. The silence that follows belongs entirely to you.* | *Ani jedna nitka nie drgnęła, ani jeden oddech nie poszedł na marne. Cisza, która zapadła, należy już tylko do was.* |

*(Note: `unison_cast` lines apply in co-op when both act together: EN — "Proposal and answer, struck on a single beat. Even broken time struggles to argue with that." / PL — "Propozycja i odpowiedź w jednym takcie. Nawet pęknięty czas nie potrafi z tym dyskutować.")*
