/**
 * Robust English to Tamil Food Name Translator & Phonetic Transliteration Engine
 * 100% Pure Tamil output with zero raw English characters.
 */

// 1. Direct Multi-Word & Common Dish Mappings (including typos & Tanglish)
const EXACT_DISH_MAP: Record<string, string> = {
  // Parotta & Variants (Fixes "parrota" typo bug)
  "parrota": "பரோட்டா",
  "parotta": "பரோட்டா",
  "parota": "பரோட்டா",
  "porotta": "பரோட்டா",
  "barotta": "பரோட்டா",
  "parotha": "பரோட்டா",
  "prota": "பரோட்டா",
  "bun parotta": "பன் பரோட்டா",
  "kothu parotta": "கொத்து பரோட்டா",
  "chicken kothu parotta": "சிக்கன் கொத்து பரோட்டா",
  "egg kothu parotta": "முட்டை கொத்து பரோட்டா",
  "mutton kothu parotta": "மட்டன் கொத்து பரோட்டா",
  "veg kothu parotta": "வெஜ் கொத்து பரோட்டா",
  "chilli parotta": "சில்லி பரோட்டா",
  "chilly parotta": "சில்லி பரோட்டா",
  "ceylon parotta": "சிலோன் பரோட்டா",
  "coin parotta": "காயின் பரோட்டா",
  "veechu parotta": "வீச்சு பரோட்டா",
  "egg veechu parotta": "முட்டை வீச்சு பரோட்டா",

  // Tomato Rice & Variations
  "tomato rice": "தக்காளி சாதம்",
  "tommota rice": "தக்காளி சாதம்",
  "tomoto rice": "தக்காளி சாதம்",
  "thakkali sadham": "தக்காளி சாதம்",
  "thakkali rice": "தக்காளி சாதம்",
  "tommota": "தக்காளி",
  "tomato": "தக்காளி",
  "tomoto": "தக்காளி",
  "thakkali": "தக்காளி",

  // Curd / Lemon / Sambar / Variety Rice
  "curd rice": "தயிர் சாதம்",
  "thayir sadham": "தயிர் சாதம்",
  "lemon rice": "எலுமிச்சை சாதம்",
  "elamichai sadham": "எலுமிச்சை சாதம்",
  "sambar rice": "சாம்பார் சாதம்",
  "rasam rice": "ரசம் சாதம்",
  "ghee rice": "நெய் சாதம்",
  "jeera rice": "சீரக சாதம்",
  "variety rice": "வெரைட்டி ரைஸ்",
  "fried rice": "பிரைட் ரைஸ்",
  "veg fried rice": "வெஜ் பிரைட் ரைஸ்",
  "egg fried rice": "முட்டை பிரைட் ரைஸ்",
  "chicken fried rice": "சிக்கன் பிரைட் ரைஸ்",
  "mutton fried rice": "மட்டன் பிரைட் ரைஸ்",
  "prawn fried rice": "இறால் பிரைட் ரைஸ்",
  "schezwan fried rice": "செஸ்வான் பிரைட் ரைஸ்",
  "schezwan chicken fried rice": "செஸ்வான் சிக்கன் பிரைட் ரைஸ்",
  "noodles": "நூடுல்ஸ்",
  "veg noodles": "வெஜ் நூடுல்ஸ்",
  "egg noodles": "முட்டை நூடுல்ஸ்",
  "chicken noodles": "சிக்கன் நூடுல்ஸ்",
  "schezwan noodles": "செஸ்வான் நூடுல்ஸ்",

  // Dosa Varieties
  "dosa": "தோசை",
  "dosai": "தோசை",
  "dhosa": "தோசை",
  "thosai": "தோசை",
  "thosa": "தோசை",
  "plain dosa": "சாதா தோசை",
  "plain dosai": "சாதா தோசை",
  "ghee roast": "நெய் ரோஸ்ட்",
  "ghee roast dosa": "நெய் ரோஸ்ட் தோசை",
  "ghee dosa": "நெய் தோசை",
  "masala dosa": "மசால் தோசை",
  "masal dosa": "மசால் தோசை",
  "masala dosai": "மசால் தோசை",
  "special masala dosa": "ஸ்பெஷல் மசால் தோசை",
  "onion dosa": "வெங்காய தோசை",
  "onion roast": "வெங்காய ரோஸ்ட்",
  "egg dosa": "முட்டை தோசை",
  "podi dosa": "பொடி தோசை",
  "podi roast": "பொடி ரோஸ்ட்",
  "kal dosa": "கல் தோசை",
  "rava dosa": "ரவா தோசை",
  "rava roast": "ரவா ரோஸ்ட்",
  "onion rava dosa": "வெங்காய ரவா தோசை",
  "paper roast": "பேப்பர் ரோஸ்ட்",
  "ghee paper roast": "நெய் பேப்பர் ரோஸ்ட்",
  "paneer dosa": "பன்னீர் தோசை",
  "mushroom dosa": "காளான் தோசை",
  "chicken dosa": "சிக்கன் தோசை",
  "mutton dosa": "மட்டன் தோசை",
  "kari dosa": "கறி தோசை",

  // Idly & Tiffin
  "idly": "இட்லி",
  "idli": "இட்லி",
  "itly": "இட்லி",
  "itli": "இட்லி",
  "idly sambar": "இட்லி சாம்பார்",
  "sambar idly": "சாம்பார் இட்லி",
  "sambar idli": "சாம்பார் இட்லி",
  "mini idly": "மினி இட்லி",
  "podi idly": "பொடி இட்லி",
  "ghee podi idly": "நெய் பொடி இட்லி",
  "vada": "வடை",
  "vadai": "வடை",
  "medu vada": "மெது வடை",
  "sambar vada": "சாம்பார் வடை",
  "sambar vadai": "சாம்பார் வடை",
  "curd vada": "தயிர் வடை",
  "rasam vada": "ரசம் வடை",
  "poori": "பூரி",
  "poori masala": "பூரி மசாலா",
  "puri": "பூரி",
  "puri masala": "பூரி மசாலா",
  "pongal": "பொங்கல்",
  "ven pongal": "வெண் பொங்கல்",
  "ghee pongal": "நெய் பொங்கல்",
  "sweet pongal": "சர்க்கரை பொங்கல்",
  "uttapam": "ஊத்தப்பம்",
  "oothappam": "ஊத்தப்பம்",
  "uthappam": "ஊத்தப்பம்",
  "onion uttapam": "வெங்காய ஊத்தப்பம்",
  "tomato uttapam": "தக்காளி ஊத்தப்பம்",
  "podi uttapam": "பொடி ஊத்தப்பம்",
  "appam": "ஆப்பம்",
  "egg appam": "முட்டை ஆப்பம்",
  "idiyappam": "இடியாப்பம்",
  "paniyaram": "பணியாரம்",

  // Chapati & Breads
  "chapati": "சப்பாத்தி",
  "chapathi": "சப்பாத்தி",
  "sappathi": "சப்பாத்தி",
  "chappathi": "சப்பாத்தி",
  "chappati": "சப்பாத்தி",
  "phulka": "புல்கா",
  "naan": "நான்",
  "butter naan": "பட்டர் நான்",
  "garlic naan": "பூண்டு நான்",
  "roti": "ரொட்டி",
  "tandoori roti": "தந்தூரி ரொட்டி",

  // Biriyani & Meals
  "biriyani": "பிரியாணி",
  "biryani": "பிரியாணி",
  "briyani": "பிரியாணி",
  "chicken biriyani": "சிக்கன் பிரியாணி",
  "chiken biriyani": "சிக்கன் பிரியாணி",
  "mutton biriyani": "மட்டன் பிரியாணி",
  "beef biriyani": "பீப் பிரியாணி",
  "egg biriyani": "முட்டை பிரியாணி",
  "veg biriyani": "வெஜ் பிரியாணி",
  "prawn biriyani": "இறால் பிரியாணி",
  "fish biriyani": "மீன் பிரியாணி",
  "kuska": "குஸ்கா",
  "meals": "முழு சாப்பாடு",
  "meal": "சாப்பாடு",
  "veg meals": "சைவ சாப்பாடு",
  "non veg meals": "அசைவ சாப்பாடு",
  "chicken meals": "சிக்கன் சாப்பாடு",
  "mutton meals": "மட்டன் சாப்பாடு",
  "fish meals": "மீன் சாப்பாடு",

  // Starters & Non-Veg
  "chicken 65": "சிக்கன் 65",
  "chilli chicken": "சில்லி சிக்கன்",
  "chilly chicken": "சில்லி சிக்கன்",
  "chicken chukka": "சிக்கன் சுக்கா",
  "chicken pepper fry": "சிக்கன் மிளகு வறுவல்",
  "chicken fry": "சிக்கன் வறுவல்",
  "chicken gravy": "சிக்கன் கிரேவி",
  "chicken curry": "சிக்கன் குழம்பு",
  "butter chicken": "பட்டர் சிக்கன்",
  "mutton chukka": "மட்டன் சுக்கா",
  "mutton pepper fry": "மட்டன் மிளகு வறுவல்",
  "mutton gravy": "மட்டன் கிரேவி",
  "mutton curry": "மட்டன் குழம்பு",
  "fish fry": "மீன் வறுவல்",
  "fish curry": "மீன் குழம்பு",
  "prawn fry": "இறால் வறுவல்",
  "prawn 65": "இறால் 65",
  "egg omelette": "முட்டை ஆம்லெட்",
  "omelette": "ஆம்லெட்",
  "omlet": "ஆம்லெட்",
  "half boil": "ஹாப் பாயில்",
  "full boil": "முட்டை பாயில்",
  "egg kalaki": "முட்டை கலக்கி",
  "kalaki": "கலக்கி",
  "egg podimas": "முட்டை பொடிமாஸ்",
  "paneer 65": "பன்னீர் 65",
  "paneer butter masala": "பன்னீர் பட்டர் மசாலா",
  "mushroom 65": "காளான் 65",
  "mushroom gravy": "காளான் கிரேவி",
  "gobi 65": "கோபி 65",
  "gobi manchurian": "கோபி மஞ்சூரியன்",

  // Beverages & Drinks
  "tea": "டீ",
  "ginger tea": "இஞ்சி டீ",
  "lemon tea": "எலுமிச்சை டீ",
  "green tea": "கிரீன் டீ",
  "coffee": "காபி",
  "filter coffee": "பில்டர் காபி",
  "hot coffee": "சூடான காபி",
  "cold coffee": "கோல்ட் காபி",
  "milk": "பால்",
  "badam milk": "பாதாம் பால்",
  "boost": "பூஸ்ட்",
  "horlicks": "ஹார்லிக்ஸ்",
  "lime juice": "எலுமிச்சை ஜூஸ்",
  "lemon juice": "எலுமிச்சை ஜூஸ்",
  "orange juice": "ஆரஞ்சு ஜூஸ்",
  "apple juice": "ஆப்பிள் ஜூஸ்",
  "mango juice": "மாம்பழ ஜூஸ்",
  "watermelon juice": "தர்பூசணி ஜூஸ்",
  "pomegranate juice": "மாதுளை ஜூஸ்",
  "grape juice": "திராட்சை ஜூஸ்",
  "rose milk": "ரோஸ் மில்க்",
  "badam shake": "பாதாம் ஷேக்",
  "lassi": "லஸ்ஸி",
  "buttermilk": "மோர்",
  "water bottle": "வாட்டர் பாட்டில்",
};

// 2. Comprehensive Word-level vocabulary mapping
const WORD_MAP: Record<string, string> = {
  // Parotta & Breads
  "parrota": "பரோட்டா",
  "parotta": "பரோட்டா",
  "parota": "பரோட்டா",
  "porotta": "பரோட்டா",
  "barotta": "பரோட்டா",
  "prota": "பரோட்டா",
  "paratha": "பரோட்டா",
  "kothu": "கொத்து",
  "kottu": "கொத்து",
  "chapati": "சப்பாத்தி",
  "chapathi": "சப்பாத்தி",
  "sappathi": "சப்பாத்தி",
  "chappathi": "சப்பாத்தி",
  "naan": "நான்",
  "roti": "ரொட்டி",

  // Rice & Tiffin
  "dosa": "தோசை",
  "dosai": "தோசை",
  "dhosa": "தோசை",
  "thosa": "தோசை",
  "thosai": "தோசை",
  "idly": "இட்லி",
  "idli": "இட்லி",
  "itly": "இட்லி",
  "itli": "இட்லி",
  "vada": "வடை",
  "vadai": "வடை",
  "poori": "பூரி",
  "puri": "பூரி",
  "rice": "சாதம்",
  "sadham": "சாதம்",
  "saatham": "சாதம்",
  "sadam": "சாதம்",
  "biriyani": "பிரியாணி",
  "biryani": "பிரியாணி",
  "briyani": "பிரியாணி",
  "meals": "சாப்பாடு",
  "meal": "சாப்பாடு",
  "saapadu": "சாப்பாடு",
  "sappadu": "சாப்பாடு",
  "pongal": "பொங்கல்",
  "uttapam": "ஊத்தப்பம்",
  "uthappam": "ஊத்தப்பம்",
  "oothappam": "ஊத்தப்பம்",
  "appam": "ஆப்பம்",
  "idiyappam": "இடியாப்பம்",
  "paniyaram": "பணியாரம்",
  "kuska": "குஸ்கா",
  "fried": "பிரைட்",
  "noodles": "நூடுல்ஸ்",

  // Ingredients & Veggies
  "tomato": "தக்காளி",
  "tommota": "தக்காளி",
  "tomoto": "தக்காளி",
  "thakkali": "தக்காளி",
  "onion": "வெங்காயம்",
  "vengayam": "வெங்காயம்",
  "garlic": "பூண்டு",
  "poondu": "பூண்டு",
  "ginger": "இஞ்சி",
  "inji": "இஞ்சி",
  "pepper": "மிளகு",
  "milagu": "மிளகு",
  "chilli": "சில்லி",
  "chili": "சில்லி",
  "chilly": "சில்லி",
  "ghee": "நெய்",
  "nei": "நெய்",
  "butter": "பட்டர்",
  "oil": "எண்ணெய்",
  "curd": "தயிர்",
  "thayir": "தயிர்",
  "lemon": "எலுமிச்சை",
  "lime": "எலுமிச்சை",
  "elamichai": "எலுமிச்சை",
  "podi": "பொடி",
  "masala": "மசால்",
  "masal": "மசால்",
  "roast": "ரோஸ்ட்",
  "sambar": "சாம்பார்",
  "rasam": "ரசம்",
  "salna": "சால்னா",
  "kurma": "குருமா",
  "gravy": "கிரேவி",
  "curry": "குழம்பு",
  "kulambu": "குழம்பு",
  "kuzhambu": "குழம்பு",
  "fry": "வறுவல்",
  "varuval": "வறுவல்",
  "chukka": "சுக்கா",
  "sukka": "சுக்கா",
  "65": "65",
  "soup": "சூப்",
  "manchurian": "மஞ்சூரியன்",
  "schezwan": "செஸ்வான்",

  // Meats & Veg
  "chicken": "சிக்கன்",
  "chiken": "சிக்கன்",
  "chikken": "சிக்கன்",
  "mutton": "மட்டன்",
  "fish": "மீன்",
  "meen": "மீன்",
  "prawn": "இறால்",
  "prawns": "இறால்",
  "eral": "இறால்",
  "egg": "முட்டை",
  "eggs": "முட்டை",
  "muttai": "முட்டை",
  "beef": "பீப்",
  "veg": "வெஜ்",
  "vegetarian": "சைவ",
  "non-veg": "அசைவ",
  "nonveg": "அசைவ",
  "paneer": "பன்னீர்",
  "panir": "பன்னீர்",
  "mushroom": "காளான்",
  "kaalan": "காளான்",
  "gobi": "கோபி",

  // Beverages
  "tea": "டீ",
  "coffee": "காபி",
  "kaapi": "காபி",
  "milk": "பால்",
  "paal": "பால்",
  "juice": "ஜூஸ்",
  "shake": "ஷேக்",
  "lassi": "லஸ்ஸி",
  "soda": "சோடா",
  "water": "தண்ணீர்",
  "bottle": "பாட்டில்",
  "buttermilk": "மோர்",
  "orange": "ஆரஞ்சு",
  "apple": "ஆப்பிள்",
  "mango": "மாம்பழ",
  "grape": "திராட்சை",
  "pineapple": "அன்னாசி",
  "watermelon": "தர்பூசணி",
  "pomegranate": "மாதுளை",
  "banana": "வாழைப்பழ",
  "rose": "ரோஸ்",
  "badam": "பாதாம்",
  "pista": "பிஸ்தா",
  "cashew": "முந்திரி",

  // Modifiers
  "special": "ஸ்பெஷல்",
  "spl": "ஸ்பெஷல்",
  "mini": "மினி",
  "small": "சிறிய",
  "big": "பெரிய",
  "large": "பெரிய",
  "half": "அரை",
  "full": "முழு",
  "single": "சிங்கிள்",
  "double": "டபுள்",
  "set": "செட்",
  "plate": "பிளேட்",
  "cup": "கப்",
  "glass": "கிளாஸ்",
  "plain": "சாதா",
  "sweet": "ஸ்வீட்",
  "hot": "சூடான",
  "cold": "கோல்ட்",
  "fresh": "பிரெஷ்",
  "parcel": "பார்சல்",
  "omelette": "ஆம்லெட்",
  "omlet": "ஆம்லெட்",
  "kalaki": "கலக்கி",
  "podimas": "பொடிமாஸ்",
};

/**
 * Robust phonetic character transliterator that converts any unknown English string
 * into 100% pure Tamil Unicode with zero leftover English letters!
 */
function phoneticTransliterate(word: string): string {
  const w = word.toLowerCase().trim();
  if (!w) return "";
  if (/^[0-9\u0B80-\u0BFF\s]+$/.test(w)) return w;

  const CONSONANTS: Record<string, { base: string; pulli: string }> = {
    "k": { base: "க", pulli: "க்" },
    "g": { base: "க", pulli: "க்" },
    "c": { base: "ச", pulli: "ச்" },
    "s": { base: "ச", pulli: "ஸ்" },
    "ch": { base: "ச", pulli: "ச்" },
    "sh": { base: "ஷ", pulli: "ஷ்" },
    "j": { base: "ஜ", pulli: "ஜ்" },
    "t": { base: "ட", pulli: "ட்" },
    "th": { base: "த", pulli: "த்" },
    "d": { base: "ட", pulli: "ட்" },
    "dh": { base: "த", pulli: "த்" },
    "n": { base: "ந", pulli: "ன்" },
    "ng": { base: "ங", pulli: "ங்" },
    "nj": { base: "ஞ", pulli: "ஞ்" },
    "p": { base: "ப", pulli: "ப்" },
    "b": { base: "ப", pulli: "ப்" },
    "m": { base: "ம", pulli: "ம்" },
    "y": { base: "ய", pulli: "ய்" },
    "r": { base: "ர", pulli: "ர்" },
    "l": { base: "ல", pulli: "ல்" },
    "v": { base: "வ", pulli: "வ்" },
    "w": { base: "வ", pulli: "வ்" },
    "zh": { base: "ழ", pulli: "ழ்" },
    "h": { base: "ஹ", pulli: "ஹ்" },
  };

  const VOWEL_SIGNS: Record<string, string> = {
    "a": "",
    "aa": "ா",
    "i": "ி",
    "ee": "ீ",
    "ii": "ீ",
    "u": "ு",
    "oo": "ூ",
    "uu": "ூ",
    "e": "ெ",
    "ae": "ே",
    "ai": "ை",
    "o": "ொ",
    "oa": "ோ",
    "au": "ௌ",
    "ow": "ௌ",
  };

  const INDEPENDENT_VOWELS: Record<string, string> = {
    "a": "அ", "aa": "ஆ", "i": "இ", "ee": "ஈ", "ii": "ஈ",
    "u": "உ", "oo": "ஊ", "uu": "ஊ", "e": "எ", "ae": "ஏ",
    "ai": "ஐ", "o": "ஒ", "oa": "ஓ", "au": "ஔ",
  };

  let out = "";
  let i = 0;

  while (i < w.length) {
    // Check 2-letter consonants first (e.g. "th", "ch", "sh", "zh", "ng")
    let cKey = "";
    if (i + 1 < w.length && CONSONANTS[w.substring(i, i + 2)]) {
      cKey = w.substring(i, i + 2);
    } else if (CONSONANTS[w[i]]) {
      cKey = w[i];
    }

    if (cKey) {
      i += cKey.length;
      // Now check following vowel
      let vKey = "";
      if (i + 1 < w.length && VOWEL_SIGNS[w.substring(i, i + 2)] !== undefined) {
        vKey = w.substring(i, i + 2);
      } else if (i < w.length && VOWEL_SIGNS[w[i]] !== undefined) {
        vKey = w[i];
      }

      if (vKey) {
        i += vKey.length;
        out += CONSONANTS[cKey].base + VOWEL_SIGNS[vKey];
      } else {
        // Consonant without vowel -> pulli (e.g. க், ர், ட்)
        out += CONSONANTS[cKey].pulli;
      }
    } else {
      // Independent vowel or other character
      let vKey = "";
      if (i + 1 < w.length && INDEPENDENT_VOWELS[w.substring(i, i + 2)]) {
        vKey = w.substring(i, i + 2);
      } else if (INDEPENDENT_VOWELS[w[i]]) {
        vKey = w[i];
      }

      if (vKey) {
        i += vKey.length;
        out += INDEPENDENT_VOWELS[vKey];
      } else {
        // Skip numbers/symbols or pass through if already tamil/digit
        if (/[0-9]/.test(w[i])) {
          out += w[i];
        }
        i++;
      }
    }
  }

  return out;
}

/**
 * Translates English Food Name into pure Tamil script.
 * 1. Checks exact dish match
 * 2. Checks word-level vocabulary
 * 3. Fallbacks to pure Tamil phonetic parser
 */
export function translateEnglishToTamil(input: string): string {
  if (!input || !input.trim()) return "";

  const clean = input.trim().toLowerCase();

  // 1. Direct exact match check
  if (EXACT_DISH_MAP[clean]) {
    return EXACT_DISH_MAP[clean];
  }

  // 2. Tokenize and translate known words
  const tokens = input.trim().split(/\s+/);
  const translatedTokens = tokens.map((token) => {
    const cleanWord = token.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (WORD_MAP[cleanWord]) {
      return WORD_MAP[cleanWord];
    }
    // If already Tamil or digit
    if (/^[0-9\u0B80-\u0BFF]+$/.test(token)) {
      return token;
    }
    // Pure phonetic transliteration
    return phoneticTransliterate(cleanWord) || token;
  });

  return translatedTokens.join(" ");
}
