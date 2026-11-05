import { getISTDateString, createSeededRNG } from './istTime';
import type { CountryChallenge } from './types';
export type { CountryChallenge };

export const CURATED_COUNTRIES: CountryChallenge[] = [
  {
    code: 'JP',
    name: 'Japan',
    capital: 'Tokyo',
    region: 'Asia',
    subregion: 'Eastern Asia',
    flagUrl: 'https://flagcdn.com/w320/jp.png',
    flagEmoji: '🇯🇵',
    clues: [
      'An island nation situated in the Pacific Ocean with volcanic archipelagos.',
      'World-renowned for Mount Fuji, cherry blossoms, bullet trains, and the world’s most populous metropolitan area.',
      'Capital city is Tokyo. The flag features a vibrant crimson circle on pure white.',
    ],
  },
  {
    code: 'IN',
    name: 'India',
    capital: 'New Delhi',
    region: 'Asia',
    subregion: 'Southern Asia',
    flagUrl: 'https://flagcdn.com/w320/in.png',
    flagEmoji: '🇮🇳',
    clues: [
      'The world’s most populous democracy, cradled between the mighty Himalayas and the Indian Ocean.',
      'Ancient cradle of Ayurvedic wellness, Yoga, spices, Masala Chai, and architectural wonder the Taj Mahal.',
      'Capital city is New Delhi. The tricolor flag features saffron, white, green and the Ashoka Chakra navy wheel.',
    ],
  },
  {
    code: 'IT',
    name: 'Italy',
    capital: 'Rome',
    region: 'Europe',
    subregion: 'Southern Europe',
    flagUrl: 'https://flagcdn.com/w320/it.png',
    flagEmoji: '🇮🇹',
    clues: [
      'A boot-shaped Mediterranean peninsula with the greatest number of UNESCO World Heritage Sites.',
      'Renowned for the Roman Colosseum, the canals of Venice, the Renaissance in Florence, and artisanal cuisine.',
      'Capital city is Rome. The tricolor flag features vertical stripes of green, white, and red.',
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    capital: 'Brasília',
    region: 'Americas',
    subregion: 'South America',
    flagUrl: 'https://flagcdn.com/w320/br.png',
    flagEmoji: '🇧🇷',
    clues: [
      'The largest nation in South America, containing the majority of the Amazon Rainforest.',
      'Famous for the vibrant Rio Carnival, the iconic Christ the Redeemer statue, and five FIFA World Cup trophies.',
      'Capital city is Brasília. The flag is green with a large yellow rhombus and a blue celestial globe with stars.',
    ],
  },
  {
    code: 'EG',
    name: 'Egypt',
    capital: 'Cairo',
    region: 'Africa',
    subregion: 'Northern Africa',
    flagUrl: 'https://flagcdn.com/w320/eg.png',
    flagEmoji: '🇪🇬',
    clues: [
      'A transcontinental nation linking northeast Africa with the Middle East along the fertile Nile basin.',
      'Home to millennia-old monuments including the Great Pyramids of Giza and the monumental Great Sphinx.',
      'Capital city is Cairo. The flag features red, white, and black horizontal bands with the golden Eagle of Saladin.',
    ],
  },
  {
    code: 'FR',
    name: 'France',
    capital: 'Paris',
    region: 'Europe',
    subregion: 'Western Europe',
    flagUrl: 'https://flagcdn.com/w320/fr.png',
    flagEmoji: '🇫🇷',
    clues: [
      'Bordered by the Atlantic Ocean, the Mediterranean Sea, and the snow-capped Alps.',
      'Famed for the Eiffel Tower, the Louvre Museum, Haute Couture fashion, and centuries of philosophy.',
      'Capital city is Paris. The tricolor flag features vertical blue, white, and red bands.',
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    capital: 'Canberra',
    region: 'Oceania',
    subregion: 'Australia and New Zealand',
    flagUrl: 'https://flagcdn.com/w320/au.png',
    flagEmoji: '🇦🇺',
    clues: [
      'Both a continent and an island country, surrounded by the Indian and Pacific Oceans.',
      'Home to unique wildlife like kangaroos and koalas, the Sydney Opera House, and the Great Barrier Reef.',
      'Capital city is Canberra (not Sydney!). The flag features the Southern Cross constellation on blue.',
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    capital: 'Ottawa',
    region: 'Americas',
    subregion: 'North America',
    flagUrl: 'https://flagcdn.com/w320/ca.png',
    flagEmoji: '🇨🇦',
    clues: [
      'The second-largest country by total area in the world, spanning three ocean borders.',
      'Famous for breathtaking Rocky Mountains, glacial turquoise lakes, maple syrup, and ice hockey.',
      'Capital city is Ottawa. The red and white flag showcases an eleven-pointed maple leaf.',
    ],
  },
  {
    code: 'ZA',
    name: 'South Africa',
    capital: 'Pretoria',
    region: 'Africa',
    subregion: 'Southern Africa',
    flagUrl: 'https://flagcdn.com/w320/za.png',
    flagEmoji: '🇿🇦',
    clues: [
      'Located at the southernmost tip of the African continent, marked by Table Mountain and two oceans.',
      'Known as the "Rainbow Nation" with 11 official languages, Kruger National Park, and Nelson Mandela’s legacy.',
      'Has three capital cities: Pretoria (administrative), Cape Town (legislative), Bloemfontein (judicial).',
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    capital: 'Berlin',
    region: 'Europe',
    subregion: 'Western Europe',
    flagUrl: 'https://flagcdn.com/w320/de.png',
    flagEmoji: '🇩🇪',
    clues: [
      'The most populous member state of the European Union, famous for engineering and the Black Forest.',
      'Renowned for the historic Brandenburg Gate, classical composers like Beethoven, and high-speed Autobahns.',
      'Capital city is Berlin. The tricolor flag features horizontal black, red, and gold stripes.',
    ],
  },
  {
    code: 'MX',
    name: 'Mexico',
    capital: 'Mexico City',
    region: 'Americas',
    subregion: 'North America',
    flagUrl: 'https://flagcdn.com/w320/mx.png',
    flagEmoji: '🇲🇽',
    clues: [
      'Rich in heritage between ancient Maya and Aztec civilizations and the Pacific and Gulf of Mexico.',
      'Famous for the Chichen Itza pyramid, vibrant cuisine, Dia de los Muertos, and warm mariachi rhythms.',
      'Capital city is Mexico City. Flag has green, white, red stripes with an eagle devouring a serpent on a cactus.',
    ],
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    capital: 'Wellington',
    region: 'Oceania',
    subregion: 'Australia and New Zealand',
    flagUrl: 'https://flagcdn.com/w320/nz.png',
    flagEmoji: '🇳🇿',
    clues: [
      'Composed of two main landmasses: the North and South Islands in the southwestern Pacific.',
      'Filming location for Middle-earth in The Lord of the Rings, renowned for dramatic fjords, glaciers, and Maori culture.',
      'Capital city is Wellington. Flag has four red stars with white borders representing the Southern Cross.',
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    capital: 'Madrid',
    region: 'Europe',
    subregion: 'Southern Europe',
    flagUrl: 'https://flagcdn.com/w320/es.png',
    flagEmoji: '🇪🇸',
    clues: [
      'Occupies the majority of the Iberian Peninsula with a rich blend of Moorish and European heritage.',
      'Known for Gaudí’s Sagrada Família in Barcelona, flamenco dance, tapas, and the Alhambra palace.',
      'Capital city is Madrid. The flag has red and golden-yellow horizontal stripes with the royal coat of arms.',
    ],
  },
  {
    code: 'KR',
    name: 'South Korea',
    capital: 'Seoul',
    region: 'Asia',
    subregion: 'Eastern Asia',
    flagUrl: 'https://flagcdn.com/w320/kr.png',
    flagEmoji: '🇰🇷',
    clues: [
      'Situated on the southern half of the Korean Peninsula, blending high-tech metropolises with centuries-old Buddhist temples.',
      'Global pioneer in semiconductor innovation, K-Pop, award-winning cinema, and high-speed fiber internet.',
      'Capital city is Seoul. The Taegeukgi flag has a red and blue yin-yang circle with four black trigrams.',
    ],
  },
  {
    code: 'IS',
    name: 'Iceland',
    capital: 'Reykjavik',
    region: 'Europe',
    subregion: 'Northern Europe',
    flagUrl: 'https://flagcdn.com/w320/is.png',
    flagEmoji: '🇮🇸',
    clues: [
      'A Nordic volcanic island nation defined by dramatic landscapes of volcanoes, geysers, hot springs, and lava fields.',
      'Powered nearly 100% by renewable geothermal energy; famous for the dancing Aurora Borealis (Northern Lights).',
      'Capital city is Reykjavik. The flag features a red Scandinavian cross with white borders on a blue field.',
    ],
  },
];

export function getDailyCountry(dateKey: string = getISTDateString()): CountryChallenge {
  const rng = createSeededRNG(`country-ist-${dateKey}`);
  const index = Math.floor(rng() * CURATED_COUNTRIES.length);
  return CURATED_COUNTRIES[index];
}

export function getRandomPracticeCountry(): CountryChallenge {
  const index = Math.floor(Math.random() * CURATED_COUNTRIES.length);
  return CURATED_COUNTRIES[index];
}

export function getAllCountryNames(): string[] {
  return CURATED_COUNTRIES.map((c) => c.name).sort();
}
