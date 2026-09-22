const UNIT_OPTIONS = [
  "1- MTZ",
  "2- SBS",
  "3- ITJ 1",
  "4- PLÇ",
  "5- GUA",
  "7- DPA JC",
  "9- DPA IRI",
  "10- JPL",
  "11- BC",
  "12- GCS GPO",
  "12- GCS JLLE",
  "13- JRG 1",
  "14- BRQ",
  "15- FLN",
  "17- FAC",
  "19- RNG 1",
  "20- BNU 1",
  "21- JRG 2",
  "22- TRINCA",
  "23- ITJ 2",
  "26- BNU 2",
  "28- ARA",
  "00- Brasil",
];
UNIT_OPTIONS.splice(3, 1, "4- PLÇ");

const UNIT_ALIASES = {
  jrg: "13- JRG 1",
  jgr: "13- JRG 1",
};

const UNIT_CITY_ALIASES = {
  brasil: "Brasil",
  mtz: "Joinville",
  sbs: "Sao Bento do Sul",
  itj: "Itajai",
  plc: "Palhoca",
  gua: "Joinville",
  "dpa jc": "Joinville",
  "dpa iri": "Joinville",
  jpl: "Joinville",
  bc: "Balneario Camboriu",
  "gcs gpo": "Araquari",
  gcs: "Joinville",
  jrg: "Jaragua do Sul",
  brq: "Brusque",
  fln: "Florianopolis",
  fac: "Joinville",
  rng: "Rio Negrinho",
  bnu: "Blumenau",
  trinca: "Joinville",
  ara: "Araquari",
};

const EPI_OPTIONS = [
  "Luva PU",
  "Luva Pigmentada",
  "Luva de Raspa",
  "Luva nitrilica",
  "Oculos Transparente",
  "Oculos Verde",
  "Mascara com Filtro",
  "Respirador PFF2",
  "Protetor Auricular",
  "Protetor Auricular tipo concha",
  "Avental de Raspa",
  "Sapatão",
  "Luva de Vaqueta",
  "Creme de Proteção",
];

const UNIFORM_OPTIONS = [
  "Camiseta Operacional Fredy - Pneus",
  "Camiseta Chefe de Pátio - Fredy Pneus",
  "Moletom Operacional - Fredy Pneus",
  "Camisa Social Azul - Fredy Pneus",
  "Camisa Social Branca Fredy - Pneus",
  "Calça Operacional Fredy - Pneus",
  "Camiseta Operacional - GCS",
  "Camiseta Cinza Claro - GCS",
  "Camisa Polo - GCS",
  "Calça Operacional - GCS",
  "Bermuda Operacional - GCS",
  "Camiseta Operacional - JPL",
  "Camisa Polo - JPL",
  "Moletom Operacional - JPL",
  "Calça Operacional - JPL",
  "Camiseta - FAC",
];

const ITEM_TYPE_OPTIONS = {
  epi: {
    label: "EPIs",
    options: EPI_OPTIONS,
  },
  uniforme: {
    label: "Uniforme",
    options: UNIFORM_OPTIONS,
  },
  cracha: {
    label: "Crachá",
    options: [],
  },
};
