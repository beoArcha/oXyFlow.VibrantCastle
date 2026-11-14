# What's New

## 0.3 (2026-11-14): Hi-bit art, tilesets, decor and gates

Version 0.3 brings the new art pipeline and a refresh of the wiki and lore:

- **Quality tiers with live switching**: hi-8bit, hi-16bit and painted high, changed on the fly from the display settings.
- **Heroes quantized from painted frames**: Valen and Aurelia look the same on every tier.
- **Platform tilesets** and **decor props with light**: lanterns, braziers, torches, banners and crystals.
- **Opening gates**: portcullises lift on screen when their lever is struck; structure atlases for levers, gates and thorns.
- **Bug fixes**: heroes no longer vanish for a few frames.
- **Docs**: the lore and this wiki were checked against the game data (maps, enemies, controls, heroes).

Details below.

### Hi-bit art, tilesets, decor and gates

- **Three quality tiers for everything**: hi-8bit, hi-16bit and high (painted) now apply to heroes, enemies, platforms and decor, and switch live from the display settings. See *Graphics Quality*.
- **Heroes from painted frames**: Valen and Aurelia get hi-8bit and hi-16bit sheets quantized from their painted frames.
- **Platform tilesets**: eight tilesets (stone, wood, marble, brick, rock, ledge, crystal) dress the platforms of all five locations.
- **Decor**: twelve props (lanterns, braziers, torches, banners, chains, crystals and more) add light and atmosphere in the back and front layers, with a soft glow on the light sources.
- **Gates open on screen**: a gate lifts with a 1.2 s portcullis animation, and its collision shrinks with it.
- **Creator tools**: the sprite compiler builds tilesets, props and heroes as well as enemies, with `--preview` for checking the art before you commit.

## Earlier highlights

- **Five rebuilt maps**: the Courtyard (7200 × 1350), the Chasm of Thorns (6000 × 1500), the vertical Clockwork Tower (3600 × 3000), the Aether Sanctuary (6400 × 1600) and the Grand Bastion (8000 × 1500) are much larger, with clear zones, levers and secrets.
- **A full portal route** from the Courtyard through all five locations and back (the victory loop). Every map can be finished without the dash; the dash opens secrets.
- **19 enemy templates**, including four new ones: Gear Mite, Thorn Creeper, Lantern Warden and Chrono Hound. They patrol and can be defeated; they do not damage the player yet.
- **Graphics quality now changes enemy art**: hi-8bit, hi-16bit or painted high sheets, chosen in the display settings.
- **Gamepad and keyboard** bindings are documented in *Controls*.
- **Accessible web page**: skip link, keyboard-friendly navigation, language-aware page, and a text fallback if the game cannot load.

**Planned next**: enemies that attack, more placements (such as the Shadow Knight), and further polish of combat and narration.
