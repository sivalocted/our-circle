import { getISTDateString, createSeededRNG } from './istTime';

/**
 * Curated 5-letter answer bank of friendly, universally recognizable everyday English words.
 * Filtered for no proper nouns, no offensive terms, and no obscure jargon.
 */
export const CURATED_WORDLE_ANSWERS: string[] = [
  'ABOVE', 'ACUTE', 'ADAPT', 'ADMIT', 'ADORE', 'AGILE', 'AGREE', 'AHEAD', 'ALBUM', 'ALERT',
  'ALIVE', 'ALLOW', 'ALONE', 'ALONG', 'AMBER', 'AMONG', 'ANGEL', 'ANGER', 'ANGLE', 'APPLE',
  'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARRAY', 'ARROW', 'ASIDE', 'ASSET', 'AUDIO', 'AVOID',
  'AWAKE', 'AWARE', 'BADGE', 'BASIC', 'BASIS', 'BEACH', 'BEGAN', 'BEGIN', 'BEING', 'BELOW',
  'BENCH', 'BERRY', 'BIRTH', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLAST', 'BLAZE', 'BLEND',
  'BLESS', 'BLIND', 'BLOCK', 'BLOOM', 'BLOWN', 'BLUSH', 'BOARD', 'BOAST', 'BONUS', 'BOOST',
  'BOUND', 'BRAIN', 'BRAND', 'BRAVE', 'BREAD', 'BREAK', 'BRICK', 'BRIDE', 'BRIEF', 'BRIGHT',
  'BRING', 'BROAD', 'BROWN', 'BRUSH', 'BUILD', 'BUNCH', 'BURST', 'CABIN', 'CABLE', 'CAMEL',
  'CANDY', 'CARGO', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHAMP', 'CHARM', 'CHART',
  'CHASE', 'CHEAP', 'CHECK', 'CHEEK', 'CHEER', 'CHESS', 'CHIEF', 'CHILD', 'CHILI', 'CHIME',
  'CHOIR', 'CHORD', 'CHOSE', 'CHUNK', 'CIVIL', 'CLAIM', 'CLASH', 'CLASS', 'CLEAN', 'CLEAR',
  'CLERK', 'CLICK', 'CLIFF', 'CLIMB', 'CLOAK', 'CLOCK', 'CLOSE', 'CLOTH', 'CLOUD', 'CLOVER',
  'COACH', 'COAST', 'COCOA', 'COLOR', 'COMET', 'CORAL', 'COUNT', 'COURT', 'COVER', 'CRACK',
  'CRAFT', 'CRANE', 'CRASH', 'CRAWL', 'CRAZY', 'CREAM', 'CREEK', 'CREST', 'CRIME', 'CRISP',
  'CROSS', 'CROWD', 'CROWN', 'CRUSH', 'CURVE', 'CYCLE', 'DAILY', 'DANCE', 'DAWN', 'DEALT',
  'DELTA', 'DENSE', 'DEPTH', 'DEVIL', 'DIARY', 'DIGIT', 'DRAFT', 'DRAIN', 'DREAM', 'DRESS',
  'DRIFT', 'DRINK', 'DRIVE', 'DROVE', 'EAGER', 'EARLY', 'EARTH', 'ELITE', 'EMPTY', 'ENEMY',
  'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'ESSAY', 'EVENT', 'EXACT', 'EXIST', 'EXTRA',
  'FAITH', 'FALSE', 'FANCY', 'FAULT', 'FEAST', 'FIBER', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT',
  'FINAL', 'FIRST', 'FLAME', 'FLASH', 'FLEET', 'FLOAT', 'FLOOD', 'FLOOR', 'FLOUR', 'FOCUS',
  'FORCE', 'FORTH', 'FORTY', 'FOUND', 'FRAME', 'FRESH', 'FRONT', 'FROST', 'FRUIT', 'GIANT',
  'GIFT', 'GIVEN', 'GLADE', 'GLASS', 'GLEAM', 'GLIDE', 'GLOBE', 'GLORY', 'GLOVE', 'GRACE',
  'GRADE', 'GRAIN', 'GRAND', 'GRANT', 'GRAPE', 'GRAPH', 'GRASP', 'GRASS', 'GREAT', 'GREEN',
  'GREET', 'GRIEF', 'GROUP', 'GROVE', 'GUARD', 'GUESS', 'GUIDE', 'HABIT', 'HAPPY', 'HARSH',
  'HAVEN', 'HEART', 'HEAVY', 'HONEY', 'HONOR', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'HUMOR',
  'IDEAL', 'IMAGE', 'INDEX', 'INNER', 'INPUT', 'IRONY', 'IVORY', 'JEWEL', 'JOINT', 'JUDGE',
  'JUICE', 'KNIFE', 'KNOCK', 'LABEL', 'LABOR', 'LARGE', 'LASER', 'LATCH', 'LATER', 'LAUGH',
  'LAYER', 'LEAFY', 'LEARN', 'LEASE', 'LEAST', 'LEMON', 'LEVEL', 'LIGHT', 'LIMIT', 'LINEN',
  'LOCAL', 'LOGIC', 'LOVER', 'LUCKY', 'LUNAR', 'LUNCH', 'MAGIC', 'MAJOR', 'MAKER', 'MANGO',
  'MANOR', 'MAPLE', 'MARCH', 'MATCH', 'MAYOR', 'MEDAL', 'MEDIA', 'MELON', 'MERCY', 'MERIT',
  'METAL', 'MICRO', 'MIGHT', 'MINER', 'MINOR', 'MODEL', 'MODEM', 'MONEY', 'MONTH', 'MORAL',
  'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVIE', 'MUSIC', 'NAIVE', 'NIGHT', 'NOBLE', 'NOISE',
  'NORTH', 'NOVEL', 'NURSE', 'OCEAN', 'OFFER', 'OLIVE', 'ONION', 'OPERA', 'ORBIT', 'ORDER',
  'ORGAN', 'OTHER', 'OUGHT', 'OUTER', 'OWNER', 'OXIDE', 'PAINT', 'PANEL', 'PANIC', 'PAPER',
  'PARTY', 'PEACE', 'PEACH', 'PEARL', 'PEDAL', 'PENNY', 'PHASE', 'PHONE', 'PHOTO', 'PIANO',
  'PILOT', 'PINCH', 'PIPER', 'PIVOT', 'PIZZA', 'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE',
  'PLAZA', 'POINT', 'POLAR', 'POPPY', 'PORCH', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME',
  'PRINT', 'PRIZE', 'PROUD', 'PULSE', 'PUPIL', 'QUEEN', 'QUERY', 'QUEST', 'QUICK', 'QUIET',
  'QUOTA', 'RADIO', 'RAISE', 'RALLY', 'RANCH', 'RANGE', 'RAPID', 'RATIO', 'REACH', 'REACT',
  'READY', 'REALM', 'REBEL', 'REFER', 'REIGN', 'RELAX', 'RELIC', 'RENEW', 'REPAY', 'REPLY',
  'RESET', 'RIDER', 'RIDGE', 'RIFLE', 'RIGHT', 'RIVER', 'ROBOT', 'ROCKY', 'ROAST', 'ROSE',
  'ROUND', 'ROUTE', 'ROYAL', 'RULER', 'RUMOR', 'RURAL', 'SADLY', 'SAINT', 'SALAD', 'SALON',
  'SAUCE', 'SCALE', 'SCENE', 'SCENT', 'SCOPE', 'SCORE', 'SCOUT', 'SEDAN', 'SENSE', 'SERVE',
  'SEVEN', 'SHADE', 'SHAFT', 'SHAKE', 'SHAME', 'SHAPE', 'SHARE', 'SHARP', 'SHEET', 'SHELF',
  'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORE', 'SHORT', 'SHOUT', 'SIGHT',
  'SILK', 'SILLY', 'SINCE', 'SIREN', 'SKILL', 'SKIRT', 'SLATE', 'SLEEP', 'SLICE', 'SLIDE',
  'SMART', 'SMILE', 'SMOKE', 'SNACK', 'SNAKE', 'SOLAR', 'SOLID', 'SOLVE', 'SONAR', 'SOUND',
  'SOUTH', 'SPACE', 'SPARK', 'SPEAK', 'SPEED', 'SPELL', 'SPEND', 'SPICE', 'SPIDER', 'SPIKE',
  'SPINE', 'SPIRIT', 'SPLIT', 'SPOKE', 'SPORT', 'SPRAY', 'SQUAD', 'STAFF', 'STAGE', 'STAIN',
  'STAKE', 'STAND', 'STARE', 'START', 'STATE', 'STEAM', 'STEEL', 'STEEP', 'STEER', 'STICK',
  'STILL', 'STOCK', 'STONE', 'STORM', 'STORY', 'STOVE', 'STRAP', 'STRAW', 'STRIP', 'STUDY',
  'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUNNY', 'SUPER', 'SURGE', 'SWEET', 'SWIFT', 'SWORD',
  'TABLE', 'TASTE', 'TEACH', 'THEME', 'THICK', 'THING', 'THINK', 'THIRD', 'TIGER', 'TITLE',
  'TOAST', 'TODAY', 'TOKEN', 'TOOTH', 'TOPIC', 'TOTAL', 'TOUCH', 'TOWER', 'TRACK', 'TRADE',
  'TRAIL', 'TRAIN', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRUCK', 'TRULY', 'TRUTH',
  'TULIP', 'TUTOR', 'TWICE', 'TWIST', 'UNCLE', 'UNDER', 'UNION', 'UNITY', 'UPSET', 'URBAN',
  'USAGE', 'VALID', 'VALOR', 'VALUE', 'VALVE', 'VAPOR', 'VAULT', 'VEGAN', 'VENUE', 'VERSE',
  'VIDEO', 'VIGOR', 'VILLA', 'VINYL', 'VIRAL', 'VIRUS', 'VISIT', 'VITAL', 'VIVID', 'VOCAL',
  'VOICE', 'WAGON', 'WAIST', 'WATCH', 'WATER', 'WAVE', 'WHEAT', 'WHEEL', 'WHERE', 'WHICH',
  'WHILE', 'WHITE', 'WHOLE', 'WIDOW', 'WIDTH', 'WINDY', 'WITCH', 'WOMAN', 'WORLD', 'WORRY',
  'WORTH', 'WOULD', 'WOUND', 'WRECK', 'WRIST', 'WRITE', 'WRONG', 'YACHT', 'YEARN', 'YEAST',
  'YIELD', 'YOUNG', 'YOUTH', 'ZEBRA', 'ZESTY',
];

// Additional valid guessable 5-letter words
export const VALID_GUESS_EXTENSIONS: Set<string> = new Set([
  ...CURATED_WORDLE_ANSWERS,
  'AAHED', 'AALII', 'ABACA', 'ABACI', 'ABACK', 'ABAFT', 'ABAMP', 'ABAND', 'ABASH', 'ABATE',
  'ABAYA', 'ABBEY', 'ABBOT', 'ABEAM', 'ABELE', 'ABERS', 'ABETS', 'ABHOR', 'ABIDE', 'ABIES',
  'ABLED', 'ABLER', 'ABLES', 'ABLET', 'ABLOW', 'ABMHO', 'ABODE', 'ABOHM', 'ABOIL', 'ABOMA',
  'ABOON', 'ABORD', 'ABORE', 'ABORT', 'ABOUT', 'ABRAM', 'ABRAY', 'ABRIM', 'ABRIN', 'ABRIS',
  'ABSEY', 'ABSIT', 'ABUNA', 'ABUNE', 'ABUSE', 'ABUTS', 'ABUZZ', 'ABYSS', 'ACARI', 'ACERB',
  'ACETA', 'ACHED', 'ACHES', 'ACHOO', 'ACIDS', 'ACIDY', 'ACING', 'ACINI', 'ACKEE', 'ACKER',
  'ACMES', 'ACMIC', 'ACNED', 'ACNES', 'ACOCK', 'ACOLD', 'ACORN', 'ACRED', 'ACRES', 'ACRID',
  'ACROS', 'ACTED', 'ACTIN', 'ACTON', 'ACTOR', 'ACTUS', 'ADAGE', 'ADAMS', 'ADAPT', 'ADAWS',
  'ADAYS', 'ADBOT', 'ADDAX', 'ADDED', 'ADDER', 'ADDIO', 'ADDLE', 'ADEEM', 'ADEPT', 'ADIEU',
  'ADIOS', 'ADITS', 'ADMAN', 'ADMEN', 'ADMIN', 'ADMIT', 'ADMIX', 'ADOBE', 'ADOBO', 'ADOPT',
  'ADORE', 'ADORN', 'ADOWN', 'ADOZE', 'ADRAD', 'ADRED', 'ADSUM', 'ADUKI', 'ADULT', 'ADUNC',
  'ADUST', 'ADVEW', 'ADYTA', 'ADZED', 'ADZES', 'AECIA', 'AEDES', 'AEGIS', 'AEONS', 'AERIE',
  'AEROS', 'AESIR', 'AFALD', 'AFARA', 'AFARS', 'AFEAT', 'AFFIX', 'AFIRE', 'AFLAJ', 'AFLAT',
  'AFOOT', 'AFORE', 'AFOUL', 'AFRET', 'AFRID', 'AFRIT', 'AFTER', 'AGAIN', 'AGAMA', 'AGAMI',
  'AGAPE', 'AGARS', 'AGAST', 'AGATE', 'AGAVE', 'AGAZE', 'AGENE', 'AGENT', 'AGERS', 'AGGER',
  'AGGIE', 'AGGRI', 'AGGRO', 'AGILA', 'AGILE', 'AGING', 'AGIOS', 'AGISM', 'AGIST', 'AGITA',
  'AGLEE', 'AGLET', 'AGLEY', 'AGLOO', 'AGLOW', 'AGLUS', 'AGMAS', 'AGOGE', 'AGONE', 'AGONS',
  'AGONY', 'AGOOD', 'AGORA', 'AGREE', 'AGRIA', 'AGRIN', 'AGROS', 'AGUED', 'AGUES', 'AGUNA',
  'AGUTI', 'AHEAD', 'AHEAP', 'AHENT', 'AHIGH', 'AHIND', 'AHING', 'AHINT', 'AHOLD', 'AHULL',
  'AHURU', 'AIDED', 'AIDER', 'AIDES', 'AIDOI', 'AIDOS', 'AIERY', 'AIGAS', 'AIGHT', 'AILED',
  'AIMED', 'AIMER', 'AINEE', 'AINGA', 'AIOLI', 'AIRED', 'AIRER', 'AIRNS', 'AIRTH', 'AIRTS',
  'AISLE', 'AITCH', 'AITUS', 'AIVER', 'AIYEE', 'AIZLE', 'AJIES', 'AJIVA', 'AJUGA', 'AJWAN',
  'AKEBI', 'AKELA', 'AKENE', 'AKING', 'AKITA', 'AKKAS', 'ALAAP', 'ALACK', 'ALAMO', 'ALAND',
  'ALANE', 'ALANG', 'ALANS', 'ALANT', 'ALAPA', 'ALAPS', 'ALARM', 'ALARY', 'ALATE', 'ALAYS',
  'ALBAS', 'ALBEE', 'ALBID', 'ALBUM', 'ALCID', 'ALCOS', 'ALDEA', 'ALDER', 'ALDOL', 'ALECK',
  'ALECS', 'ALEFS', 'ALEFT', 'ALEPH', 'ALERT', 'ALEWS', 'ALEYE', 'ALFAS', 'ALGAE', 'ALGAL',
  'ALGAS', 'ALGID', 'ALGIN', 'ALGOR', 'ALGUM', 'ALIAS', 'ALIBI', 'ALIEN', 'ALIFS', 'ALIGN',
  'ALIKE', 'ALINE', 'ALIST', 'ALIVE', 'ALIYA', 'ALKIE', 'ALKOS', 'ALKYD', 'ALKYL', 'ALLAY',
  'ALLOT', 'ALLOW', 'ALLOY', 'ALMAH', 'ALMAS', 'ALMEH', 'ALMES', 'ALMUD', 'ALMUG', 'ALODS',
  'ALOED', 'ALOES', 'ALOFT', 'ALOHA', 'ALOIN', 'ALONE', 'ALONG', 'ALOOF', 'ALOOS', 'ALOUD',
  'ALOWE', 'ALPHA', 'ALTAR', 'ALTER', 'ALTHO', 'ALTOS', 'ALULA', 'ALUMS', 'ALURE', 'ALWAY',
  'AMAHS', 'AMAIN', 'AMASS', 'AMATE', 'AMAUT', 'AMAZE', 'AMBER', 'AMBIT', 'AMBLE', 'AMBOS',
  'AMBRY', 'AMEBA', 'AMEER', 'AMEND', 'AMENE', 'AMENS', 'AMENT', 'AMIAS', 'AMICE', 'AMICI',
  'AMIDE', 'AMIDO', 'AMIDS', 'AMIES', 'AMIGA', 'AMIGO', 'AMINE', 'AMINO', 'AMINS', 'AMIRS',
  'AMISS', 'AMITY', 'AMLIC', 'AMMOS', 'AMNIA', 'AMNIC', 'AMNIO', 'AMOKS', 'AMOLE', 'AMONG',
  'AMORT', 'AMOUR', 'AMOVE', 'AMOWT', 'AMPED', 'AMPLE', 'AMPLY', 'AMPUL', 'AMRIT', 'AMUCK',
  'AMUSE', 'AMYLS', 'ANANA', 'ANATA', 'ANCHO', 'ANCLE', 'ANCON', 'ANDRO', 'ANEAR', 'ANELE',
  'ANENT', 'ANGAS', 'ANGEL', 'ANGER', 'ANGLE', 'ANGLO', 'ANGRY', 'ANGST', 'ANIGH', 'ANILE',
  'ANILS', 'ANIMA', 'ANIME', 'ANIMI', 'ANION', 'ANISE', 'ANKER', 'ANKHS', 'ANKLE', 'ANKUS',
  'ANLAS', 'ANNAL', 'ANNAS', 'ANNAT', 'ANNEX', 'ANNOY', 'ANNUL', 'ANOAS', 'ANODE', 'ANOLE',
  'ANOMY', 'ANSAE', 'ANSER', 'ANTAE', 'ANTAR', 'ANTAS', 'ANTED', 'ANTES', 'ANTIC', 'ANTIS',
  'ANTRA', 'ANTRE', 'ANTSY', 'ANURA', 'ANVIL', 'ANYON', 'APACE', 'APART', 'APAYD', 'APAYS',
  'APEEK', 'APEPS', 'APERY', 'APGAR', 'APHID', 'APHIS', 'APIAN', 'APING', 'APIOL', 'APISH',
  'APISM', 'APNEA', 'APODE', 'APODS', 'APOOP', 'APORT', 'APPAL', 'APPAY', 'APPEL', 'APPLE',
  'APPLY', 'APPRO', 'APPUI', 'APPUY', 'APRES', 'APRON', 'APSES', 'APSIS', 'APSOS', 'APTED',
  'APTER', 'APTLY', 'AQUAE', 'AQUAS', 'ARABA', 'ARAKS', 'ARAME', 'ARARS', 'ARBAS', 'ARBOR',
  'ARCED', 'ARCUS', 'ARDEB', 'ARDOR', 'ARDOX', 'ARDRI', 'AREAE', 'AREAL', 'AREAR', 'AREAS',
  'ARECA', 'AREDG', 'AREDE', 'AREFY', 'AREIC', 'ARENA', 'ARENE', 'AREPA', 'ARERE', 'ARETE',
  'ARETS', 'ARETT', 'ARGAL', 'ARGAN', 'ARGIL', 'ARGLE', 'ARGOL', 'ARGON', 'ARGOT', 'ARGUE',
  'ARGUS', 'ARHAT', 'ARIAS', 'ARIEL', 'ARIKI', 'ARILS', 'ARIOT', 'ARISE', 'ARISH', 'ARKED',
  'ARLED', 'ARLES', 'ARMED', 'ARMER', 'ARMET', 'ARMIL', 'ARMOR', 'ARNAS', 'ARNUT', 'AROBA',
  'AROHA', 'AROID', 'AROMA', 'AROSE', 'ARPAS', 'ARPEN', 'ARRAH', 'ARRAS', 'ARRAY', 'ARRET',
  'ARRIS', 'ARROW', 'ARSED', 'ARSES', 'ARSEY', 'ARSIS', 'ARSON', 'ARTAL', 'ARTEL', 'ARTIC',
  'ARTIS', 'ARTSY', 'ARUHE', 'ARUMS', 'ARVAL', 'ARVEE', 'ARVOS', 'ARYLS', 'ASANA', 'ASCON',
  'ASCOT', 'ASCUS', 'ASDIC', 'ASHED', 'ASHEN', 'ASHES', 'ASHET', 'ASIDE', 'ASITY', 'ASKED',
  'ASKER', 'ASKEW', 'ASKOI', 'ASKOS', 'ASPEN', 'ASPER', 'ASPIC', 'ASPIE', 'ASPIS', 'ASPRO',
  'ASSAI', 'ASSAM', 'ASSAY', 'ASSES', 'ASSET', 'ASSEZ', 'ASSOT', 'ASTER', 'ASTIR', 'ASTUN',
  'ASURA', 'ASWAY', 'ASWIM', 'ASYLA', 'ATAPS', 'ATAXY', 'ATELC', 'ATILT', 'ATIMY', 'ATLAS',
  'ATMAN', 'ATMAS', 'ATMOS', 'ATOCS', 'ATOKE', 'ATOKS', 'ATOLL', 'ATOMS', 'ATOMY', 'ATONE',
  'ATONY', 'ATOPY', 'ATRIA', 'ATRIP', 'ATTAP', 'ATTAR', 'ATTIC', 'ATUAS', 'AUDAD', 'AUDIO',
  'AUDIT', 'AUGER', 'AUGHT', 'AUGUR', 'AUNTS', 'AUNTY', 'AURAL', 'AURAR', 'AURAS', 'AUREI',
  'AURES', 'AURIC', 'AURIS', 'AURUM', 'AUTOS', 'AUXIN', 'AVAIL', 'AVALE', 'AVANT', 'AVAST',
  'AVELS', 'AVENS', 'AVERS', 'AVERT', 'AVGAS', 'AVIAN', 'AVINE', 'AVION', 'AVISE', 'AVISO',
  'AVIZE', 'AVOID', 'AVOWS', 'AVYZE', 'AWAIT', 'AWAKE', 'AWARD', 'AWARE', 'AWARN', 'AWASH',
  'AWATO', 'AWAVE', 'AWAYS', 'AWDLS', 'AWEEL', 'AWETO', 'AWFUL', 'AWING', 'AWMRY', 'AWNED',
  'AWNER', 'AWOKE', 'AWOLS', 'AWORK', 'AXELS', 'AXIAL', 'AXILE', 'AXILS', 'AXING', 'AXIOM',
  'AXION', 'AXITE', 'AXLED', 'AXLES', 'AXMAN', 'AXMEN', 'AXOID', 'AXONE', 'AXONS', 'AYAHS',
  'AYAYA', 'AYELP', 'AYGRE', 'AYINS', 'AYONT', 'AYRES', 'AYRIE', 'AZANS', 'AZIDE', 'AZIDO',
  'AZINE', 'AZLON', 'AZOIC', 'AZOLE', 'AZONS', 'AZOTE', 'AZOTH', 'AZUKI', 'AZURN', 'AZURY',
  'AZYGY', 'AZYME', 'AZYMS',
]);

/**
 * Returns the exact daily Wordle word for all players, calculated from the IST Date string.
 */
export function getDailyWordle(dateKey: string = getISTDateString()): { word: string; dateKey: string; dayIndex: number } {
  const rng = createSeededRNG(`wordle-ist-${dateKey}`);
  const dayIndex = Math.floor(rng() * CURATED_WORDLE_ANSWERS.length);
  const word = CURATED_WORDLE_ANSWERS[dayIndex];
  return { word, dateKey, dayIndex };
}

/**
 * Returns an unseeded random word for Practice Mode.
 */
export function getRandomPracticeWord(): string {
  const idx = Math.floor(Math.random() * CURATED_WORDLE_ANSWERS.length);
  return CURATED_WORDLE_ANSWERS[idx];
}

/**
 * Checks if a word is in the valid guess dictionary (case-insensitive).
 */
export function isValidWordleGuess(word: string): boolean {
  if (!word || word.length !== 5) return false;
  const upper = word.toUpperCase();
  return VALID_GUESS_EXTENSIONS.has(upper) || CURATED_WORDLE_ANSWERS.includes(upper);
}

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

/**
 * Evaluates a guess against the target word following standard Wordle frequency rules.
 * Handles duplicate letters cleanly (e.g., target 'APPLE', guess 'PUPIL' marks only 2 P's).
 */
export function evaluateWordleGuess(guess: string, target: string): LetterStatus[] {
  const g = guess.toUpperCase().split('');
  const t = target.toUpperCase().split('');
  const result: LetterStatus[] = Array(5).fill('absent');
  const targetLetterCounts: Record<string, number> = {};

  // First pass: mark 'correct' (green) and count remaining available letters
  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      result[i] = 'correct';
    } else {
      targetLetterCounts[t[i]] = (targetLetterCounts[t[i]] || 0) + 1;
    }
  }

  // Second pass: mark 'present' (yellow) if letter is in target and still available
  for (let i = 0; i < 5; i++) {
    if (result[i] !== 'correct') {
      const letter = g[i];
      if (targetLetterCounts[letter] && targetLetterCounts[letter] > 0) {
        result[i] = 'present';
        targetLetterCounts[letter]--;
      }
    }
  }

  return result;
}

/**
 * Datamuse API integration: Async lookup for hints/definitions or word validation expansion.
 */
export async function fetchWordHintFromDatamuse(word: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.datamuse.com/words?sp=${word.toLowerCase()}&md=d&max=1`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0]?.defs && data[0].defs.length > 0) {
      // e.g. "n\tA sweet fruit" -> "A sweet fruit"
      return data[0].defs[0].replace(/^[a-z]+\t/, '');
    }
    return null;
  } catch {
    return null;
  }
}
