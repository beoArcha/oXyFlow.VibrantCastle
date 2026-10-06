import { LanguageCode, BestiaryI18n } from "../types";

export type { BestiaryI18n };

export const bestiaryTranslations: Record<LanguageCode, BestiaryI18n> = {
  pl: {
    bestiaryTrainingDummyDesc: "Manekin treningowy wykonany z drewna i słomy, używany przez strażników do szlifowania cięć.",
    bestiaryTrainingDummyTactics: "Nie oddaje ciosów. Idealny do testowania kombinacji ataków i nasyceń żywiołowych.",
    bestiaryTrainingDummyLore: "Nawet niemy pniak może nauczyć szermierza pokory, gdy klinga ześlizgnie się po sęku.",

    bestiaryClockworkOwlDesc: "Mechaniczna sowa gargulec patrolująca iglice zamkowe. Pikuje bezszelestnie z wysoka.",
    bestiaryClockworkOwlTactics: "Wykonaj unik w bok w momencie, gdy złoży skrzydła do lotu nurkowego.",
    bestiaryClockworkOwlLore: "Zegarowe oczy nigdy nie mrugają, wypatrując skaz na lśniącym mosiądzu murów.",

    bestiaryCourtSentinelDesc: "Ciężkozbrojny strażnik dziedzińca zasilany aetherowym rdzeniem.",
    bestiaryCourtSentinelTactics: "Jego czołowy pancerz odbija proste ataki. Obejdź go za plecy podczas ładowania promienia.",
    bestiaryCourtSentinelLore: "Niegdyś żywi rycerze, dziś uwięzieni w pancerzach z lanego żelaza przez kaprys zamkowego architekta.",

    bestiaryChasmGargoyleDesc: "Skrzydlata bestia zamieszkująca mroczne szczeliny przepaści. Poluje w stadach.",
    bestiaryChasmGargoyleTactics: "Używaj czarów dystansowych, nim zdąży wzbić się ponad zasięg miecza.",
    bestiaryChasmGargoyleLore: "Kamienne rzeźby, które ożyły pod wpływem skażenia aetherem, pożerając zapomniane kości.",

    bestiaryClockworkAutomatonDesc: "Masywny mechaniczny konstrukt poruszany skomplikowaną przekładnią zębatą.",
    bestiaryClockworkAutomatonTactics: "Uderzenie młota generuje falę uderzeniową – przeskocz nad nią w tempo.",
    bestiaryClockworkAutomatonLore: "Tykanie jego serca słychać na trzy korytarze naprzód. Nie zna strachu ani litości.",

    bestiaryAetherSentinelDesc: "Mistyczny strażnik sanktuarium emitujący pole zakłócające materię.",
    bestiaryAetherSentinelTactics: "Odporny na magię aetheru; podatny na broń białą nasyconą płomieniem.",
    bestiaryAetherSentinelLore: "Czysta energia ujęta w rycerskie karwasze, strzegąca tajemnic gwiezdnej wiedzy.",

    bestiaryAetherArchonDesc: "Potężny lewitujący arcykonstrukt władający gwiezdnymi promieniami.",
    bestiaryAetherArchonTactics: "Gdy unosi ręce do gniewu, natychmiast chowaj się za osłoną terenową.",
    bestiaryAetherArchonLore: "Najwyższe dzieło gildii chronomantów – żywy monument dawno zapomnianej pychy.",

    bestiaryShadowKnightDesc: "Elitarny rycerz cienia spowity całunem pustki. Jeden z najgroźniejszych wojowników zamku.",
    bestiaryShadowKnightTactics: "Paruj jego powolne cięcia lub unikaj za plecy, gdy szarżuje z mieczem dwuręcznym.",
    bestiaryShadowKnightLore: "W jego oczach nie ma już światła rozumu, pozostał jedynie rozkaz obrony tronu.",

    bestiaryAetherWispDesc: "Niewielki ognik skondensowanej many dryfujący w chłodnym powietrzu.",
    bestiaryAetherWispTactics: "Jeden celny cios lub pocisk niszczy go natychmiast, lecz wybuch może zranić gracza.",
    bestiaryAetherWispLore: "Ulotne wspomnienia zmarłych czarnoksiężników błąkające się bez celu.",

    bestiaryChasmCrawlerDesc: "Wielonogi drapieżnik wspinający się po pionowych ścianach przepaści.",
    bestiaryChasmCrawlerTactics: "Atakuj od góry, gdy przemieszcza się po platformach.",
    bestiaryChasmCrawlerLore: "Przystosował się do życia w wiecznym mroku, żywiąc się opadającymi odpadkami z wyższych pięter.",

    bestiaryGargoyleScoutDesc: "Zwiadowca gargulców patrolujący przedpola bastionu.",
    bestiaryGargoyleScoutTactics: "Zestrzel go zanim zaalarmuje pobliskie konstrukty.",
    bestiaryGargoyleScoutLore: "Szybki i bezwzględny, jego pisk niesie się echem po kamiennych korytarzach.",

    bestiaryBastionGargoyleDesc: "Opancerzony gargulec z baszt bastionu.",
    bestiaryBastionGargoyleTactics: "Wytrzymalszy od zwykłych gargulców – wymaga serii silnych ataków.",
    bestiaryBastionGargoyleLore: "Wykuty ze skały nasyconej żelazem, trwa niewzruszenie na wiatrach wież.",

    bestiaryBastionSentinelBossDesc: "Główny komendant straży bramnej bastionu – gigantyczny czempion żelaza.",
    bestiaryBastionSentinelBossTactics: "Naprzemienne fazy ciosów młotem i wiązek aetheru. Wyczekuj okien po szarży.",
    bestiaryBastionSentinelBossLore: "Nikt nie przeszedł przez Żelazną Bramę bez zgody tego bezdusznego tytana.",

    // Souls
    soulTrainingDummyName: "Dusza Manekina",
    soulTrainingDummyDesc: "Pasywnie zwiększa odporność na odrzut (poise) o 10%.",
    soulClockworkOwlName: "Dusza Zegarowej Sowy",
    soulClockworkOwlDesc: "Wystrzeliwuje podmuch powietrza odpychający mniejszych wrogów.",
    soulCourtSentinelName: "Dusza Strażnika Dziedzińca",
    soulCourtSentinelDesc: "Przyzywa promień aetherowy chroniący przed atakami dystansowymi.",
    soulChasmGargoyleName: "Dusza Gargulca Przepaści",
    soulChasmGargoyleDesc: "Umożliwia pikujący atak ze szponami zadający wysokie obrażenia fizyczne.",
    soulClockworkAutomatonName: "Dusza Automatonu",
    soulClockworkAutomatonDesc: "Zwiększa siłę uderzeń bronią oburęczną i tempo rozbijania tarcz.",
    soulAetherSentinelName: "Dusza Aetherowego Strażnika",
    soulAetherSentinelDesc: "Otacza gracza barierą absorbującą pociski kosmiczne.",
    soulAetherArchonName: "Dusza Gwiezdnego Archonta",
    soulAetherArchonDesc: "Uwalnia niszczycielską falę energii z góry.",
    soulShadowKnightName: "Dusza Rycerza Cienia",
    soulShadowKnightDesc: "Dodaje +15% obrażeń mroku do każdego cięcia mieczem.",
    soulAetherWispName: "Dusza Aetherowego Ognika",
    soulAetherWispDesc: "Samoczynnie regeneruje 1 punkt many co 3 sekundy.",
    soulChasmCrawlerName: "Dusza Pełzacza Przepaści",
    soulChasmCrawlerDesc: "Pozwala na szybki skok z kłapnięciem szczypiec.",
    soulGargoyleScoutName: "Dusza Zwiadowcy",
    soulGargoyleScoutDesc: "Zwiększa zasięg widzenia i wyczuwania ukrytych skarbów.",
    soulTrainingTargetName: "Dusza Tarczy Treningowej",
    soulTrainingTargetDesc: "Uodparnia na pierwsze trafienie w każdej walce.",
    soulGrandDummyName: "Dusza Wielkiego Manekina",
    soulGrandDummyDesc: "Zwiększa maksymalne punkty zdrowia o +20.",
    soulBastionGargoyleName: "Dusza Gargulca Bastionu",
    soulBastionGargoyleDesc: "Uderzenie ze skrzydeł tworzące barierę kamienną.",
    soulBastionSentinelBossName: "Dusza Komendanta Bastionu",
    soulBastionSentinelBossDesc: "Przyzywa wirujące młoty obronne orbitujące wokół gracza."
  },
  en: {
    bestiaryTrainingDummyDesc: "A practice straw dummy used by palace guards to hone their martial prowess.",
    bestiaryTrainingDummyTactics: "Does not retaliate. Ideal for testing attack chains and elemental affinities.",
    bestiaryTrainingDummyLore: "Even a wooden block teaches humility when the sword edge slips along the grain.",

    bestiaryClockworkOwlDesc: "A mechanical gargoyle owl patrolling high ramparts. Dives silently from above.",
    bestiaryClockworkOwlTactics: "Dodge laterally the moment it folds its wings for a descent.",
    bestiaryClockworkOwlLore: "Clockwork optics never blink, watching for flaws upon polished brass battlements.",

    bestiaryCourtSentinelDesc: "A heavy-armored courtyard guard driven by an internal aether core.",
    bestiaryCourtSentinelTactics: "Frontal armor deflects basic strikes. Flank behind it during its beam charge.",
    bestiaryCourtSentinelLore: "Living knights once, now encased in cast-iron armor by the castle architect's whim.",

    bestiaryChasmGargoyleDesc: "Winged predator dwelling in the dark crevices of the castle chasm.",
    bestiaryChasmGargoyleTactics: "Use ranged incantations before it takes flight above sword reach.",
    bestiaryChasmGargoyleLore: "Stone statues quickened by ambient aether corruption, devouring forgotten bones.",

    bestiaryClockworkAutomatonDesc: "A massive automaton driven by complex interconnected clock gears.",
    bestiaryClockworkAutomatonTactics: "Its hammer strike unleashes a shockwave – jump over it in rhythm.",
    bestiaryClockworkAutomatonLore: "The ticking of its heart echoes three halls ahead. It knows neither fear nor mercy.",

    bestiaryAetherSentinelDesc: "Mystic sanctuary guard projecting a matter-disrupting forcefield.",
    bestiaryAetherSentinelTactics: "Highly resistant to cosmic aether; vulnerable to flame-infused strikes.",
    bestiaryAetherSentinelLore: "Pure energy bound inside plate armor, guarding ancient celestial records.",

    bestiaryAetherArchonDesc: "A levitating arch-construct commanding searing celestial energy rays.",
    bestiaryAetherArchonTactics: "Take cover immediately behind terrain whenever it raises its hands in wrath.",
    bestiaryAetherArchonLore: "The pinnacle of the chronomancers' guild – a living monument to forgotten vanity.",

    bestiaryShadowKnightDesc: "An elite void knight wreathed in gloom. Among the deadliest castle defenders.",
    bestiaryShadowKnightTactics: "Parry its deliberate slashes or roll behind as it winds up its two-handed cleave.",
    bestiaryShadowKnightLore: "No light of reason remains in its gaze, only the undying oath to defend the throne.",

    bestiaryAetherWispDesc: "A drifting spark of condensed ambient mana floating through the chill air.",
    bestiaryAetherWispTactics: "A single clean hit destroys it instantly, though the death pop may nick you.",
    bestiaryAetherWispLore: "Fleeting memories of departed arcanists wandering without purpose.",

    bestiaryChasmCrawlerDesc: "Multi-legged scavenger scuttling along sheer cliffside walls.",
    bestiaryChasmCrawlerTactics: "Strike from above as it traverses narrow ledge pathways.",
    bestiaryChasmCrawlerLore: "Adapted to perpetual gloom, subsisting on detritus falling from upper spires.",

    bestiaryGargoyleScoutDesc: "Agile scout patrol scanning castle approaches.",
    bestiaryGargoyleScoutTactics: "Pick it off swiftly before its shriek alerts nearby sentinels.",
    bestiaryGargoyleScoutLore: "Swift and ruthless, its screeches echo endlessly down stone galleries.",

    bestiaryBastionGargoyleDesc: "Reinforced gargoyle sentinel stationed at bastion towers.",
    bestiaryBastionGargoyleTactics: "Far sturdier than scout variants – requires sustained heavy combos.",
    bestiaryBastionGargoyleLore: "Carved from iron-rich granite, enduring windstorms atop the outer wall.",

    bestiaryBastionSentinelBossDesc: "Commander of the Iron Gates – a towering juggernaut of tempered plate.",
    bestiaryBastionSentinelBossTactics: "Alternates between hammer shockwaves and sweeping beams. Exploit recovery after charges.",
    bestiaryBastionSentinelBossLore: "None have crossed the Iron Gate without the solemn accord of this silent titan.",

    // Souls
    soulTrainingDummyName: "Dummy Soul",
    soulTrainingDummyDesc: "Passively increases poise and knockback resistance by 10%.",
    soulClockworkOwlName: "Clockwork Owl Soul",
    soulClockworkOwlDesc: "Unleashes a gust of wind pushing smaller foes backward.",
    soulCourtSentinelName: "Court Sentinel Soul",
    soulCourtSentinelDesc: "Summons a hovering aether beam ward deflecting enemy shots.",
    soulChasmGargoyleName: "Chasm Gargoyle Soul",
    soulChasmGargoyleDesc: "Enables a diving talon drop inflicting high physical damage.",
    soulClockworkAutomatonName: "Automaton Soul",
    soulClockworkAutomatonDesc: "Boosts heavy weapon impact and guard break effectiveness.",
    soulAetherSentinelName: "Aether Sentinel Soul",
    soulAetherSentinelDesc: "Envelops the player in a barrier absorbing magic projectiles.",
    soulAetherArchonName: "Aether Archon Soul",
    soulAetherArchonDesc: "Calls down a devastating cascade of celestial radiance.",
    soulShadowKnightName: "Shadow Knight Soul",
    soulShadowKnightDesc: "Infuses all melee slashes with +15% bonus shadow damage.",
    soulAetherWispName: "Aether Wisp Soul",
    soulAetherWispDesc: "Passively regenerates 1 point of mana every 3 seconds.",
    soulChasmCrawlerName: "Chasm Crawler Soul",
    soulChasmCrawlerDesc: "Performs a quick leaping snap with barbed mandibles.",
    soulGargoyleScoutName: "Gargoyle Scout Soul",
    soulGargoyleScoutDesc: "Enhances detection radius and reveals nearby secret chambers.",
    soulTrainingTargetName: "Target Dummy Soul",
    soulTrainingTargetDesc: "Nullifies the first hit suffered in each encounter.",
    soulGrandDummyName: "Grand Dummy Soul",
    soulGrandDummyDesc: "Permanently boosts Maximum HP by +20.",
    soulBastionGargoyleName: "Bastion Gargoyle Soul",
    soulBastionGargoyleDesc: "Creates a defensive stone wing shield upon rolling.",
    soulBastionSentinelBossName: "Bastion Sentinel Soul",
    soulBastionSentinelBossDesc: "Summons orbiting defensive hammers rotating around the player."
  }
};
