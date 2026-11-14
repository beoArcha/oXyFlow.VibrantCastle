import { defineProp, type PixelCanvas } from "../defineProp";

// ember skull lantern prop for thorn chasm
// horned beast cranium bound in spiked iron bands suspended by rigging, cradling necrotic ember fire

const C_OUTLINE = "#180806";
const C_IRON = "#423c40";
const C_BONE_SHADOW = "#4a3b32";
const C_BONE_MID = "#8a7664";
const C_BONE_LIGHT = "#c9b89d";
const C_EMBER_DEEP = "#991b1b";
const C_EMBER_FLAME = "#ea580c";
const C_EMBER_CORE = "#f59e0b";
const C_EMBER_WHITE = "#fef08a";

function drawHi8bit(c: PixelCanvas, frame: number): void {
  // top suspension mount (touches y = 0 for top anchor)
  c.rect(7, 0, 2, 2, C_OUTLINE);
  c.px(7, 0, C_BONE_LIGHT); // ring glint
  c.rect(7, 2, 2, 2, C_BONE_MID);

  // beast horns sweeping out and arching up
  // left horn: curves out to x = 2, sweeps up to tip at (4, 3)
  c.px(4, 3, C_BONE_LIGHT); // sharp horn tip
  c.px(3, 4, C_BONE_LIGHT);
  c.line(2, 5, 2, 7, C_BONE_LIGHT);
  c.px(3, 8, C_BONE_MID);
  c.px(4, 9, C_BONE_MID);

  // right horn: curves out to x = 13, sweeps up to tip at (11, 3)
  c.px(11, 3, C_BONE_LIGHT); // sharp horn tip
  c.px(12, 4, C_BONE_LIGHT);
  c.line(13, 5, 13, 7, C_BONE_LIGHT);
  c.px(12, 8, C_BONE_MID);
  c.px(11, 9, C_BONE_MID);

  // cranium vault / dome
  c.rect(6, 4, 4, 2, C_BONE_LIGHT);
  c.rect(5, 6, 6, 3, C_BONE_MID);
  c.rect(6, 6, 4, 2, C_BONE_LIGHT);

  // angled menacing brow ridge
  c.line(4, 9, 7, 10, C_BONE_LIGHT);
  c.line(11, 9, 8, 10, C_BONE_LIGHT);

  // flared cheekbones and temporal hollows
  c.px(4, 12, C_BONE_LIGHT);
  c.px(4, 13, C_BONE_MID);
  c.px(11, 12, C_BONE_LIGHT);
  c.px(11, 13, C_BONE_MID);
  c.rect(7, 11, 2, 2, C_BONE_LIGHT); // nasal bridge

  // snout and maxilla
  c.rect(5, 14, 6, 2, C_BONE_MID);
  // fangs and teeth
  c.px(5, 16, C_BONE_LIGHT); // left fang
  c.px(7, 16, C_BONE_LIGHT);
  c.px(8, 16, C_BONE_LIGHT);
  c.px(10, 16, C_BONE_LIGHT); // right fang
  c.px(6, 16, C_OUTLINE); // interdental gap
  c.px(9, 16, C_OUTLINE);

  // lower jaw / mandible and pointed chin
  c.rect(6, 17, 4, 2, C_BONE_MID);
  c.rect(7, 19, 2, 1, C_BONE_LIGHT); // chin tip

  // animated ocular voids, nasal cavity, and mouth ember glow
  if (frame === 0) {
    // frame 0: steady burn with hot core
    c.px(5, 11, C_EMBER_WHITE);
    c.px(6, 11, C_EMBER_FLAME);
    c.px(5, 12, C_EMBER_FLAME);
    c.px(6, 12, C_EMBER_WHITE);

    c.px(9, 11, C_EMBER_FLAME);
    c.px(10, 11, C_EMBER_WHITE);
    c.px(9, 12, C_EMBER_WHITE);
    c.px(10, 12, C_EMBER_FLAME);

    c.rect(7, 13, 2, 2, C_EMBER_FLAME);
    c.px(7, 14, C_EMBER_WHITE);
    c.px(7, 17, C_EMBER_FLAME); // mouth glow
  } else if (frame === 1) {
    // frame 1: flame swell, left eye flares hot, spark at brow
    c.rect(5, 11, 2, 2, C_EMBER_WHITE); // left eye solid hot

    c.px(9, 11, C_EMBER_WHITE);
    c.px(10, 11, C_EMBER_FLAME);
    c.px(9, 12, C_EMBER_FLAME);
    c.px(10, 12, C_EMBER_WHITE);

    c.rect(7, 13, 2, 2, C_EMBER_WHITE);
    c.px(7, 8, C_EMBER_FLAME); // forehead fissure flame
    c.px(7, 6, C_EMBER_WHITE); // spark dot
    c.px(7, 17, C_EMBER_WHITE); // mouth glow flares
  } else if (frame === 2) {
    // frame 2: maximum flare, right eye superheated, flame licks up
    c.px(5, 11, C_EMBER_WHITE);
    c.px(6, 11, C_EMBER_WHITE);
    c.px(5, 12, C_EMBER_WHITE);
    c.px(6, 12, C_EMBER_FLAME);

    c.rect(9, 11, 2, 2, C_EMBER_WHITE); // right eye solid hot

    c.rect(7, 13, 2, 2, C_EMBER_WHITE);
    c.px(7, 7, C_EMBER_WHITE); // central flame lick
    c.px(8, 8, C_EMBER_FLAME);
    c.px(7, 4, C_EMBER_WHITE); // drifting spark dot
    c.rect(7, 17, 2, 1, C_EMBER_WHITE); // mouth superheated
  } else {
    // frame 3: ember subsidence, contracts and dims
    c.rect(5, 11, 2, 2, C_EMBER_FLAME);
    c.px(6, 11, C_EMBER_WHITE);

    c.rect(9, 11, 2, 2, C_EMBER_FLAME);
    c.px(9, 11, C_EMBER_WHITE);

    c.rect(7, 13, 2, 2, C_OUTLINE);
    c.px(7, 13, C_EMBER_FLAME); // dimmed ember
    c.px(7, 17, C_BONE_MID);
  }

  c.outline(C_OUTLINE);
}

function drawHi16bit(c: PixelCanvas, frame: number): void {
  // top suspension mount: wrought iron ring touching top row y = 0
  c.rect(15, 0, 2, 2, C_IRON);
  c.px(15, 0, C_BONE_LIGHT); // metallic specular glint
  c.rect(14, 2, 4, 1, C_IRON);
  c.px(15, 2, C_BONE_LIGHT);

  // triple-chain rigging forged from gothic wrought iron
  // central vertical chain: interlocking links with glints and crevice shadow
  for (let y = 3; y <= 13; y += 2) {
    c.rect(15, y, 2, 2, C_IRON);
    c.px(16, y, C_BONE_LIGHT); // outer link bevel highlight
    c.px(15, y + 1, C_BONE_SHADOW); // crevice shadow
  }

  // left diagonal chain angling from top ring out to left horn root bracket
  c.line(14, 3, 9, 14, C_IRON);
  c.px(13, 5, C_BONE_LIGHT);
  c.px(11, 9, C_BONE_LIGHT);
  c.px(9, 13, C_BONE_LIGHT);
  c.px(13, 6, C_BONE_SHADOW);
  c.px(11, 10, C_BONE_SHADOW);

  // right diagonal chain angling from top ring out to right horn root bracket
  c.line(17, 3, 22, 14, C_IRON);
  c.px(18, 5, C_BONE_LIGHT);
  c.px(20, 9, C_BONE_LIGHT);
  c.px(22, 13, C_BONE_LIGHT);
  c.px(18, 6, C_BONE_SHADOW);
  c.px(20, 10, C_BONE_SHADOW);

  // majestic horned beast horns (curved horn arches)
  // left horn: root at (9..11, 16..18), sweeps down/out to x = 3, rises up through x = 3..4, curves in to sharp tip at (7, 5)
  c.polygon(
    [
      [11, 17],
      [8, 17],
      [5, 19],
      [3, 17],
      [3, 12],
      [4, 9],
      [6, 6],
      [7, 5],
      [8, 6],
      [6, 9],
      [5, 13],
      [6, 16],
      [9, 18],
    ],
    C_BONE_MID,
  );
  // left horn growth rings and ridge highlights
  c.line(4, 16, 4, 12, C_BONE_LIGHT);
  c.line(5, 11, 7, 7, C_BONE_LIGHT);
  c.px(7, 5, C_BONE_LIGHT); // horn apex
  c.line(4, 17, 6, 18, C_BONE_SHADOW);
  c.px(4, 14, C_BONE_SHADOW);
  c.px(5, 9, C_BONE_SHADOW);
  c.px(6, 7, C_BONE_SHADOW); // growth ring notch

  // right horn: root at (20..22, 16..18), sweeps down/out to x = 28, rises up through x = 27..28, curves in to sharp tip at (24, 5)
  c.polygon(
    [
      [20, 17],
      [23, 17],
      [26, 19],
      [28, 17],
      [28, 12],
      [27, 9],
      [25, 6],
      [24, 5],
      [23, 6],
      [25, 9],
      [26, 13],
      [25, 16],
      [22, 18],
    ],
    C_BONE_MID,
  );
  // right horn growth rings, weathered chip, and ridge highlights
  c.line(27, 16, 27, 12, C_BONE_LIGHT);
  c.line(26, 11, 24, 7, C_BONE_LIGHT);
  c.px(24, 5, C_BONE_LIGHT); // horn apex
  c.line(27, 17, 25, 18, C_BONE_SHADOW);
  c.px(27, 14, C_BONE_SHADOW);
  c.px(26, 9, C_BONE_SHADOW);
  c.px(25, 7, C_BONE_SHADOW); // growth ring notch
  c.px(26, 11, C_BONE_SHADOW); // organic horn chip

  // weathered cranium vault and forehead dome
  c.polygon(
    [
      [13, 12],
      [18, 12],
      [21, 15],
      [22, 20],
      [18, 22],
      [13, 22],
      [9, 20],
      [10, 15],
    ],
    C_BONE_MID,
  );
  // forehead bone highlights
  c.rect(13, 13, 6, 2, C_BONE_LIGHT);
  c.rect(12, 15, 8, 3, C_BONE_LIGHT);
  c.px(10, 18, C_BONE_SHADOW); // temporal pit left
  c.px(21, 18, C_BONE_SHADOW); // temporal pit right

  // spiked iron crown harness across cranium
  c.line(9, 15, 22, 15, C_IRON);
  c.line(9, 16, 22, 16, C_IRON);
  c.line(9, 17, 22, 17, C_BONE_SHADOW); // iron band cast shadow
  // forged iron spikes and rivets
  c.px(10, 14, C_IRON);
  c.px(10, 13, C_BONE_LIGHT); // spike glint
  c.px(15, 13, C_IRON);
  c.px(15, 12, C_BONE_LIGHT); // center spike glint
  c.px(21, 14, C_IRON);
  c.px(21, 13, C_BONE_LIGHT); // spike glint
  c.px(12, 16, C_BONE_LIGHT); // rivet
  c.px(19, 16, C_BONE_LIGHT); // rivet

  // jagged forehead fissure / necrotic bone fracture
  c.line(16, 17, 15, 19, C_OUTLINE);
  c.line(15, 19, 16, 22, C_OUTLINE);
  c.px(14, 18, C_BONE_SHADOW);
  c.px(17, 20, C_BONE_SHADOW);

  // menacing scowling beast brow ridge sloping down to nasal bridge
  c.polygon(
    [
      [8, 21],
      [15, 23],
      [16, 23],
      [23, 21],
      [23, 22],
      [16, 24],
      [15, 24],
      [8, 22],
    ],
    C_BONE_LIGHT,
  );
  c.line(9, 23, 14, 24, C_BONE_SHADOW);
  c.line(17, 24, 22, 23, C_BONE_SHADOW);

  // deep orbital void shadows framing eyes
  c.polygon([[9, 24], [14, 24], [13, 28], [10, 28]], C_BONE_SHADOW);
  c.polygon([[17, 24], [22, 24], [21, 28], [18, 28]], C_BONE_SHADOW);

  // flared cheekbones (zygomatic arches) and temporal hollows
  c.line(7, 25, 9, 28, C_BONE_MID);
  c.px(7, 25, C_BONE_LIGHT);
  c.line(24, 25, 22, 28, C_BONE_MID);
  c.px(24, 25, C_BONE_LIGHT);
  c.line(8, 29, 9, 31, C_BONE_SHADOW); // cheek hollow
  c.line(23, 29, 22, 31, C_BONE_SHADOW);

  // nasal bridge and triangular nasal fissure
  c.rect(15, 23, 2, 5, C_BONE_MID);
  c.line(15, 23, 15, 26, C_BONE_LIGHT);
  c.rect(14, 28, 4, 4, C_BONE_SHADOW);

  // snout / maxilla with spiked iron muzzle band
  c.polygon([[10, 29], [21, 29], [19, 33], [12, 33]], C_BONE_MID);
  c.rect(12, 30, 8, 2, C_BONE_LIGHT);

  // muzzle iron band
  c.line(9, 33, 22, 33, C_IRON);
  c.line(9, 34, 22, 34, C_IRON);
  c.line(9, 35, 22, 35, C_BONE_SHADOW); // band shadow
  c.px(8, 33, C_IRON); // left stud
  c.px(8, 32, C_BONE_LIGHT);
  c.px(23, 33, C_IRON); // right stud
  c.px(23, 32, C_BONE_LIGHT);
  c.px(13, 33, C_BONE_LIGHT); // rivet
  c.px(18, 33, C_BONE_LIGHT); // rivet

  // upper vicious fangs and serrated beast teeth
  c.rect(11, 35, 10, 1, C_BONE_LIGHT);
  c.line(10, 35, 10, 37, C_BONE_LIGHT); // left curved canine fang
  c.px(11, 37, C_BONE_LIGHT);
  c.line(21, 35, 21, 37, C_BONE_LIGHT); // right curved canine fang
  c.px(20, 37, C_BONE_LIGHT);
  c.px(13, 36, C_BONE_LIGHT); // intermediate tooth
  c.px(15, 36, C_BONE_LIGHT);
  c.px(16, 36, C_BONE_LIGHT);
  c.px(18, 36, C_BONE_LIGHT);
  // interdental shadow crevices
  c.px(12, 36, C_OUTLINE);
  c.px(14, 36, C_OUTLINE);
  c.px(17, 36, C_OUTLINE);
  c.px(19, 36, C_OUTLINE);

  // lower jaw / mandible with angular gonial angles and pointed chin
  c.polygon(
    [
      [11, 38],
      [20, 38],
      [20, 41],
      [18, 42],
      [17, 43],
      [14, 43],
      [13, 42],
      [11, 41],
    ],
    C_BONE_MID,
  );
  // lower interlocking teeth
  c.px(12, 38, C_BONE_LIGHT);
  c.px(14, 38, C_BONE_LIGHT);
  c.px(17, 38, C_BONE_LIGHT);
  c.px(19, 38, C_BONE_LIGHT);
  c.rect(14, 42, 4, 1, C_BONE_LIGHT); // chin tip highlight
  c.line(13, 39, 18, 39, C_BONE_SHADOW); // mandibular hollow
  c.px(11, 41, C_BONE_SHADOW); // left gonial angle shadow
  c.px(20, 41, C_BONE_SHADOW); // right gonial angle shadow

  // interior oral cavity ember glow leaking through teeth
  c.px(13, 37, C_EMBER_DEEP);
  c.px(15, 37, C_EMBER_FLAME);
  c.px(16, 37, C_EMBER_FLAME);
  c.px(18, 37, C_EMBER_DEEP);

  // animated necrotic ember flames, ocular voids, and venting embers
  if (frame === 0) {
    // frame 0: steady burn, resting posture, centered white core
    // left eye
    c.rect(10, 24, 4, 4, C_EMBER_DEEP);
    c.rect(11, 24, 3, 3, C_EMBER_FLAME);
    c.rect(11, 25, 2, 2, C_EMBER_CORE);
    c.px(12, 25, C_EMBER_WHITE);

    // right eye
    c.rect(18, 24, 4, 4, C_EMBER_DEEP);
    c.rect(18, 24, 3, 3, C_EMBER_FLAME);
    c.rect(19, 25, 2, 2, C_EMBER_CORE);
    c.px(19, 25, C_EMBER_WHITE);

    // nasal cavity
    c.rect(15, 28, 2, 3, C_EMBER_FLAME);
    c.px(15, 29, C_EMBER_CORE);
    c.px(16, 29, C_EMBER_WHITE);

    // forehead fissure hairline glow
    c.px(15, 18, C_EMBER_DEEP);
    c.px(16, 20, C_EMBER_FLAME);

    // mouth ember leak
    c.px(15, 38, C_EMBER_FLAME);
  } else if (frame === 1) {
    // frame 1: flame swell; left ocular core flares 1 px wider, flame tip peaks at fissure, spark at (14, 12)
    // left eye
    c.rect(10, 24, 4, 4, C_EMBER_DEEP);
    c.rect(10, 24, 4, 3, C_EMBER_FLAME);
    c.rect(11, 24, 3, 3, C_EMBER_CORE);
    c.rect(11, 25, 3, 2, C_EMBER_WHITE); // flared 1 px wider

    // right eye
    c.rect(18, 24, 4, 4, C_EMBER_DEEP);
    c.rect(18, 24, 3, 3, C_EMBER_FLAME);
    c.rect(19, 25, 2, 2, C_EMBER_CORE);
    c.px(19, 25, C_EMBER_WHITE);

    // nasal cavity flare
    c.rect(15, 28, 2, 3, C_EMBER_CORE);
    c.rect(15, 29, 2, 2, C_EMBER_WHITE);

    // forehead fissure flame peak
    c.line(16, 17, 15, 14, C_EMBER_FLAME);
    c.px(15, 15, C_EMBER_CORE);
    c.px(15, 14, C_EMBER_WHITE);

    // venting spark dot at (14, 12)
    c.px(14, 12, C_EMBER_WHITE);

    // mouth ember swell
    c.px(15, 38, C_EMBER_CORE);
    c.px(16, 38, C_EMBER_WHITE);
  } else if (frame === 2) {
    // frame 2: maximum flare; right socket shifts to superheated white, central flame licks up 2 px, spark at (15, 9)
    // left eye
    c.rect(10, 24, 4, 4, C_EMBER_DEEP);
    c.rect(10, 24, 4, 3, C_EMBER_FLAME);
    c.rect(11, 24, 3, 3, C_EMBER_CORE);
    c.rect(11, 25, 2, 2, C_EMBER_WHITE);

    // right eye (superheated shift)
    c.rect(18, 24, 4, 4, C_EMBER_CORE);
    c.rect(18, 24, 4, 3, C_EMBER_WHITE); // shifted to superheated white
    c.rect(19, 25, 2, 2, C_EMBER_WHITE);

    // nasal cavity maximum flare
    c.rect(14, 28, 3, 3, C_EMBER_CORE);
    c.rect(15, 28, 2, 3, C_EMBER_WHITE);

    // central ember flame licks upward by 2 px (reaching y = 12)
    c.px(16, 16, C_EMBER_FLAME);
    c.px(15, 14, C_EMBER_CORE);
    c.px(15, 13, C_EMBER_CORE);
    c.px(15, 12, C_EMBER_WHITE);

    // venting spark drifting to (15, 9)
    c.px(15, 9, C_EMBER_WHITE);
    c.px(15, 10, C_EMBER_CORE); // trailing ember speck

    // mouth ember maximum flare
    c.rect(15, 37, 2, 2, C_EMBER_WHITE);
  } else {
    // frame 3: ember subsidence; flame contracts to ember flame, nasal cavity dims to deep ember, spark dissipates
    // left eye
    c.rect(10, 24, 4, 4, C_BONE_SHADOW);
    c.rect(10, 25, 3, 3, C_EMBER_DEEP);
    c.rect(11, 25, 2, 2, C_EMBER_FLAME);
    c.px(11, 26, C_EMBER_CORE);

    // right eye
    c.rect(18, 24, 4, 4, C_BONE_SHADOW);
    c.rect(18, 25, 3, 3, C_EMBER_DEEP);
    c.rect(19, 25, 2, 2, C_EMBER_FLAME);
    c.px(19, 26, C_EMBER_CORE);

    // nasal cavity dimmed to ember deep
    c.rect(15, 28, 2, 3, C_EMBER_DEEP);
    c.px(15, 29, C_EMBER_FLAME);

    // forehead fissure dims
    c.px(16, 19, C_EMBER_DEEP);

    // spark dissipated into smoke (no spark dot)
    c.px(15, 8, C_BONE_SHADOW); // faint dark ash speck

    // mouth ember dims
    c.px(15, 38, C_EMBER_DEEP);
  }

  // crisp 1 px dark silhouette outline
  c.outline(C_OUTLINE);
}

export default defineProp({
  id: "ember_skull_lantern",
  description: "Weathered horned beast cranium bound in spiked iron bands cradling necrotic embers.",
  size: { width: 32, height: 48 },
  anchor: "top",
  frames: 4,
  fps: 8,
  glow: { color: "#ff6a1a", radius: 80, x: 16, y: 28, flicker: true },
  draw: {
    hi8bit: drawHi8bit,
    hi16bit: drawHi16bit,
  },
});
