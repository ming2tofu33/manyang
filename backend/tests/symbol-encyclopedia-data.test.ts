import { describe, expect, test } from "vitest";

import { SUPPORTED_LOCALES } from "../src/contracts/symbol-encyclopedia";
import { getRuntimeSymbolEntry, symbolEntries } from "../src/data/symbol-encyclopedia";

const acceptedSymbolIds = [
  "snake",
  "owned_land",
  "door",
  "school",
  "corridor",
  "searching",
  "many",
  "dawn",
  "water",
  "cat",
  "home",
  "room",
  "window",
  "key",
  "stairs",
  "elevator",
  "mirror",
  "bag",
  "shoes",
  "lost_item",
  "running",
  "fire",
  "rain",
  "sea",
  "hospital",
  "stranger",
  "child",
  "dog",
  "bird",
  "fish",
  "mother",
  "father",
  "friend",
  "partner",
  "ex_partner",
  "death",
  "funeral",
  "baby",
  "pregnancy",
  "toilet",
  "bathroom",
  "car",
  "bus",
  "train",
  "airplane",
  "workplace",
  "money",
  "phone",
  "teeth",
  "hair",
  "road",
  "bridge",
  "bed",
  "kitchen",
  "food",
  "apple",
  "fruit",
  "rice",
  "egg",
  "eye",
  "clothes",
  "body",
  "blood",
  "crying",
  "falling",
  "flying",
  "swimming",
  "fighting",
  "being_chased",
  "exam",
  "wedding",
  "crowd",
  "mountain",
  "tree",
  "flower",
  "pig",
  "feces",
  "dragon",
  "tiger",
  "cow",
  "mouse",
  "spider",
  "naked",
  "gold",
  "snow",
  "moon",
  "flood",
  "ancestor",
  "turtle",
  "rainbow",
  "ghost",
  "knife",
  "grave",
  "bear",
  "river",
  "anger",
  "whale",
  "butterfly",
  "market",
  "cave",
  "book",
  "war",
  "chicken",
  "accident",
  "ring",
  "earthquake",
  "song",
  "photo",
  "wind",
  "rock",
  "laughter",
  "meat",
  "alcohol",
  "dance",
  "insect",
  "deer",
  "frog",
  "monkey",
  "celebrity",
  "monk",
  "prison",
  "watch",
  "hand",
  "foot",
  "horse",
  "star",
  // ENC-06: coverage_gap 26개 신규 심볼
  "sun",
  "sky",
  "fog",
  "lightning",
  "lion",
  "elephant",
  "wolf",
  "rabbit",
  "fox",
  "police",
  "soldier",
  "thief",
  "teacher",
  "grandmother",
  "temple",
  "church",
  "boat",
  "bicycle",
  "gun",
  "hat",
  "glasses",
  "letter",
  "computer",
  "urine",
  "corpse",
  "kiss",
  "night",
  "ear",
  "neck",
  "mouth",
  "nail",
  "medicine",
  "rope",
  "message",
  "button",
  "wallet",
  "coworker",
  "boss",
  "sibling",
  "son_daughter",
  "doctor",
  "nurse",
  "neighbor",
  "customer",
  "crush",
  "classmate",
  "bath",
  "makeup",
  "mirror_self",
  "voice",
  "name",
  "gift",
  "birthday",
  "party",
  "restaurant",
  "hotel",
  "sns",
  "camera",
  "password",
  "email",
  "notification",
  "map",
  "ticket",
  "passport",
  "airport_security",
  "delivery",
  "luggage",
  "lost_luggage",
  "wallet_card",
  "id_card",
  "contract",
  "calendar",
  "alarm_clock",
  "appointment",
  "charger",
  "wifi",
  "bathroom_stall",
  "shower",
  "laundry",
  "trash",
  "refrigerator",
  "closet",
  "desk",
  "chair",
  "blanket",
  "clock",
  "queue",
  "entrance",
  "exit",
  "gate",
  "elevator_button",
  "stairs_down",
  "stairs_up",
  "parking_lot",
  "receipt",
  "payment",
  "meeting",
  "presentation",
  "document",
  "spreadsheet",
  "printer",
  "keyboard",
  "screen",
  "video_call",
  "login",
  "error_message",
  "handshake",
  "hug",
  "argument",
  "apology",
  "confession",
  "rejection",
  "invitation",
  "secret",
  "rumor",
  "promise",
  "moving_house",
  "packing",
  "unpacking",
  "cleaning",
  "washing_dishes",
  "cooking",
  "renovation",
  "broken_object",
  "repair",
  "storage_box",
  "subway",
  "taxi",
  "crosswalk",
  "traffic_light",
  "intersection",
  "tunnel",
  "station",
  "platform",
  "missed_stop",
  "traffic_jam",
  "toothache",
  "bleeding_nose",
  "vomit",
  "sick",
  "unable_to_speak",
  "betrayal",
  "bullying",
  "being_ignored",
  "being_late",
  "lost_child",
  "reunion",
  "divorce",
  "proposal",
  "jealousy",
  "embarrassment",
  "wound",
  "scar",
  "skin",
  "pimple",
  "fever",
  "injection",
  "surgery",
  "bandage",
  "ambulance",
  "hospital_bed",
  "roof",
  "balcony",
  "basement",
  "attic",
  "ceiling",
  "floor",
  "wall",
  "fence",
  "garden",
  "yard",
  "job_interview",
  "resignation",
  "promotion",
  "deadline",
  "overtime",
  "salary",
  "work_mistake",
  "work_seat",
  "office_move",
  "performance_review",
  "trapped",
  "hiding",
  "unable_to_move",
  "drowning",
  "being_watched",
  "invisible",
  "apocalypse",
  "explosion",
  "monster",
  "zombie",
  "mall",
  "library",
  "park",
  "beach",
  "forest",
  "desert",
  "island",
  "cliff",
  "old_house",
  "cinema",
  "watch_lost",
  "umbrella",
  "diary",
  "mirror_broken",
  "candle",
  "box",
  "letter_unread",
  "toy",
  "doll",
  "mask",
  "storm",
  "waves",
  "tsunami",
  "volcano",
  "mud",
  "ice",
  "lake",
  "well",
  "dark_cloud",
  "eclipse",
  "bridge_underpass",
  "rooftop",
  "playground",
  "bank",
  "debt",
  "lottery",
  "investment",
  "rent",
  "tax",
  "insurance",
  "fine",
  "refund",
  "receipt_error",
  "landlord",
  "childhood_friend",
  "awkwardness",
  "longing",
  "guilt",
  "relief",
  "shame",
  "admiration",
  "pressure_to_perform",
  "being_left_out",
  "mixed_feelings",
  "group_chat",
  "dm_message",
  "meeting_room",
  "resume",
  "portfolio",
  "approval",
  "rejection_email",
  "calendar_invite",
  "eye_contact",
  "holding_hands",
  "date",
  "breakup",
  "cheating",
  "reconciliation",
  "avoiding_someone",
  "waiting_for_someone",
  "personal_space",
  "love_triangle",
  "anxiety",
  "loneliness",
  "excitement",
  "confusion",
  "disappointment",
  "hope",
  "exhaustion",
  "peacefulness",
  "regret",
  "numbness",
  "profile_photo",
  "screenshot",
  "comment",
  "like_count",
  "blocked_account",
  "unfollow",
  "read_receipt",
  "typing_indicator",
  "deleted_message",
  "viral_post",
  "phone_call",
  "missed_call",
  "declined_call",
  "unknown_number",
  "voice_message",
  "contact_name",
  "wrong_chat_room",
  "unsent_message",
  "muted_chat",
  "spam_message",
  "aunt",
  "uncle",
  "cousin",
  "niece_nephew",
  "mother_in_law",
  "father_in_law",
  "in_laws",
  "step_parent",
  "younger_self",
  "family_gathering",
  "headache",
  "stomachache",
  "chest_pressure",
  "breathlessness",
  "heartbeat",
  "dizziness",
  "sweating",
  "thirst",
  "hunger",
  "hand_tremor",
  "stage",
  "audience",
  "microphone",
  "spotlight",
  "award",
  "trophy",
  "certificate",
  "ranking",
  "scoreboard",
  "interview_panel",
  "cashier",
  "checkout_counter",
  "convenience_store",
  "shopping_cart",
  "price_tag",
  "sold_out",
  "return_exchange",
  "coupon",
  "membership_card",
  "receipt_check",
];

const phase2BatchSymbolIds = [
  "mother",
  "father",
  "friend",
  "partner",
  "ex_partner",
  "death",
  "funeral",
  "baby",
  "pregnancy",
  "toilet",
  "bathroom",
  "car",
  "bus",
  "train",
  "airplane",
  "workplace",
  "money",
  "phone",
  "teeth",
  "hair",
];

const v02BatchSymbolIds = [
  "home",
  "room",
  "window",
  "key",
  "stairs",
  "elevator",
  "mirror",
  "bag",
  "shoes",
  "lost_item",
  "running",
  "fire",
  "rain",
  "sea",
  "hospital",
  "stranger",
  "child",
  "dog",
  "bird",
  "fish",
];

const phase2BBatchSymbolIds = [
  "road",
  "bridge",
  "bed",
  "kitchen",
  "food",
  "clothes",
  "body",
  "blood",
  "crying",
  "falling",
  "flying",
  "swimming",
  "fighting",
  "being_chased",
  "exam",
  "wedding",
  "crowd",
  "mountain",
  "tree",
  "flower",
];

const allowedAliasCollisions = new Set([
  "ko:방:home,room",
  "en:bedroom:bed,room",
  "ko:침실:bed,room",
  "ko:화장실:bathroom,toilet",
  "en:flight:airplane,flying",
  "en:floating:flying,swimming",
  "ko:비행:airplane,flying",
  "ko:아기:baby,child",
  "en:baby:baby,child",
  "en:littlechild:baby,child",
  "ko:아이:baby,child",
  "ko:잃어버린:lost_item,searching",
  "en:lost:lost_item,searching",
  "ko:파도:sea,water",
  "en:shower:bathroom,rain",
  "ko:금반지:gold,ring",
  "en:goldring:gold,ring",
  "en:caraccident:accident,car",
  "ko:밥:food,rice",
  "ko:눈:eye,snow",
  "ko:해변:beach,sea",
  "ko:해안:beach,sea",
  "ko:상가:funeral,mall",
  "ko:옥상:roof,rooftop",
  "ko:건물옥상:roof,rooftop",
  "ko:옥상위:roof,rooftop",
  "ko:숲:forest,tree",
  "en:beach:beach,sea",
  "en:shore:beach,sea",
  "en:ticket:fine,ticket",
  "en:rooftop:roof,rooftop",
  "en:buildingroof:roof,rooftop",
  "en:ontheroof:roof,rooftop",
  "en:forest:forest,tree",
  "en:box:box,storage_box",
  "ko:호수:lake,water",
  "ko:흙탕물:mud,water",
  "ko:상자:box,gift",
  "ko:쓰나미:flood,tsunami",
  "ko:해일:flood,tsunami",
  "ko:먹구름:dark_cloud,sky",
  "en:lake:lake,water",
  "en:storm:rain,storm",
  "en:tsunami:flood,tsunami",
]);

const foodExpansionSymbolIds = ["apple", "fruit", "rice", "egg", "eye"];

const secondHomonymDisambiguationSymbolIds = [
  "dog",
  "key",
  "bridge",
  "sun",
  "moon",
  "fire",
  "temple",
  "gun",
  "gold",
  "celebrity",
];

const thirdHomonymDisambiguationSymbolIds = [
  "road",
  "mouse",
  "bear",
  "chicken",
  "rock",
  "wind",
  "market",
  "book",
  "watch",
  "glasses",
];

const everydayExpansionSymbolIds = [
  "night",
  "ear",
  "neck",
  "mouth",
  "nail",
  "medicine",
  "rope",
  "message",
  "button",
  "wallet",
];

const relationshipRoleExpansionSymbolIds = [
  "coworker",
  "boss",
  "sibling",
  "son_daughter",
  "doctor",
  "nurse",
  "neighbor",
  "customer",
  "crush",
  "classmate",
];

const lifeSceneExpansionSymbolIds = [
  "bath",
  "makeup",
  "mirror_self",
  "voice",
  "name",
  "gift",
  "birthday",
  "party",
  "restaurant",
  "hotel",
];

const digitalTravelExpansionSymbolIds = [
  "sns",
  "camera",
  "password",
  "email",
  "notification",
  "map",
  "ticket",
  "passport",
  "airport_security",
  "delivery",
];

const practicalStressExpansionSymbolIds = [
  "luggage",
  "lost_luggage",
  "wallet_card",
  "id_card",
  "contract",
  "calendar",
  "alarm_clock",
  "appointment",
  "charger",
  "wifi",
];

const householdRoutineExpansionSymbolIds = [
  "bathroom_stall",
  "shower",
  "laundry",
  "trash",
  "refrigerator",
  "closet",
  "desk",
  "chair",
  "blanket",
  "clock",
];

const publicProcedureExpansionSymbolIds = [
  "queue",
  "entrance",
  "exit",
  "gate",
  "elevator_button",
  "stairs_down",
  "stairs_up",
  "parking_lot",
  "receipt",
  "payment",
];

const workDigitalExpansionSymbolIds = [
  "meeting",
  "presentation",
  "document",
  "spreadsheet",
  "printer",
  "keyboard",
  "screen",
  "video_call",
  "login",
  "error_message",
];

const socialRelationshipExpansionSymbolIds = [
  "handshake",
  "hug",
  "argument",
  "apology",
  "confession",
  "rejection",
  "invitation",
  "secret",
  "rumor",
  "promise",
];

const lifeOrganizationExpansionSymbolIds = [
  "moving_house",
  "packing",
  "unpacking",
  "cleaning",
  "washing_dishes",
  "cooking",
  "renovation",
  "broken_object",
  "repair",
  "storage_box",
];

const urbanTransitExpansionSymbolIds = [
  "subway",
  "taxi",
  "crosswalk",
  "traffic_light",
  "intersection",
  "tunnel",
  "station",
  "platform",
  "missed_stop",
  "traffic_jam",
];

const priorityBodyRelationshipExpansionSymbolIds = [
  "toothache",
  "bleeding_nose",
  "vomit",
  "sick",
  "hospital_bed",
  "surgery",
  "wound",
  "scar",
  "fever",
  "unable_to_speak",
  "betrayal",
  "bullying",
  "being_ignored",
  "being_late",
  "lost_child",
  "reunion",
  "divorce",
  "proposal",
  "jealousy",
  "embarrassment",
];

const priorityPlaceObjectNatureExpansionSymbolIds = [
  "forest",
  "desert",
  "island",
  "cliff",
  "basement",
  "attic",
  "old_house",
  "mall",
  "cinema",
  "library",
  "watch_lost",
  "umbrella",
  "diary",
  "mirror_broken",
  "candle",
  "box",
  "letter_unread",
  "toy",
  "doll",
  "mask",
  "storm",
  "waves",
  "tsunami",
  "volcano",
  "mud",
  "ice",
  "lake",
  "well",
  "dark_cloud",
  "eclipse",
];

const bodyTreatmentExpansionSymbolIds = [
  "wound",
  "scar",
  "skin",
  "pimple",
  "fever",
  "injection",
  "surgery",
  "bandage",
  "ambulance",
  "hospital_bed",
];

const homeStructureExpansionSymbolIds = [
  "roof",
  "balcony",
  "basement",
  "attic",
  "ceiling",
  "floor",
  "wall",
  "fence",
  "garden",
  "yard",
];

const workPressureExpansionSymbolIds = [
  "job_interview",
  "resignation",
  "promotion",
  "deadline",
  "overtime",
  "salary",
  "work_mistake",
  "work_seat",
  "office_move",
  "performance_review",
];

const fearControlExpansionSymbolIds = [
  "trapped",
  "hiding",
  "unable_to_move",
  "drowning",
  "being_watched",
  "invisible",
  "apocalypse",
  "explosion",
  "monster",
  "zombie",
];

const placeSpaceExpansionSymbolIds = [
  "mall",
  "library",
  "park",
  "beach",
  "forest",
  "desert",
  "island",
  "bridge_underpass",
  "rooftop",
  "playground",
];

const moneyPressureExpansionSymbolIds = [
  "bank",
  "debt",
  "lottery",
  "investment",
  "rent",
  "tax",
  "insurance",
  "fine",
  "refund",
  "receipt_error",
];

const peopleRoleCompletionSymbolIds = [
  "boss",
  "coworker",
  "teacher",
  "classmate",
  "neighbor",
  "landlord",
  "customer",
  "celebrity",
  "childhood_friend",
  "stranger",
];

const newPeopleRoleCompletionSymbolIds = ["landlord", "childhood_friend"];

const emotionStateExpansionSymbolIds = [
  "awkwardness",
  "jealousy",
  "longing",
  "guilt",
  "relief",
  "shame",
  "admiration",
  "pressure_to_perform",
  "being_left_out",
  "mixed_feelings",
];

const newEmotionStateExpansionSymbolIds = emotionStateExpansionSymbolIds.filter((id) => id !== "jealousy");

const modernWorkCommunicationExpansionSymbolIds = [
  "group_chat",
  "dm_message",
  "video_call",
  "meeting_room",
  "contract",
  "resume",
  "portfolio",
  "approval",
  "rejection_email",
  "calendar_invite",
];

const newModernWorkCommunicationExpansionSymbolIds = modernWorkCommunicationExpansionSymbolIds.filter(
  (id) => id !== "video_call" && id !== "contract",
);

const relationshipDistanceExpansionSymbolIds = [
  "eye_contact",
  "holding_hands",
  "date",
  "breakup",
  "cheating",
  "reconciliation",
  "avoiding_someone",
  "waiting_for_someone",
  "personal_space",
  "love_triangle",
];

const coreEmotionExpansionSymbolIds = [
  "anxiety",
  "loneliness",
  "excitement",
  "confusion",
  "disappointment",
  "hope",
  "exhaustion",
  "peacefulness",
  "regret",
  "numbness",
];

const digitalRelationshipExpansionSymbolIds = [
  "profile_photo",
  "screenshot",
  "comment",
  "like_count",
  "blocked_account",
  "unfollow",
  "read_receipt",
  "typing_indicator",
  "deleted_message",
  "viral_post",
];

const callCommunicationExpansionSymbolIds = [
  "phone_call",
  "missed_call",
  "declined_call",
  "unknown_number",
  "voice_message",
  "contact_name",
  "wrong_chat_room",
  "unsent_message",
  "muted_chat",
  "spam_message",
];

const extendedFamilyExpansionSymbolIds = [
  "aunt",
  "uncle",
  "cousin",
  "niece_nephew",
  "mother_in_law",
  "father_in_law",
  "in_laws",
  "step_parent",
  "younger_self",
  "family_gathering",
];

const bodySensationExpansionSymbolIds = [
  "headache",
  "stomachache",
  "chest_pressure",
  "breathlessness",
  "heartbeat",
  "dizziness",
  "sweating",
  "thirst",
  "hunger",
  "hand_tremor",
];

const publicEvaluationExpansionSymbolIds = [
  "stage",
  "audience",
  "microphone",
  "spotlight",
  "award",
  "trophy",
  "certificate",
  "ranking",
  "scoreboard",
  "interview_panel",
];

const consumerServiceExpansionSymbolIds = [
  "cashier",
  "checkout_counter",
  "convenience_store",
  "shopping_cart",
  "price_tag",
  "sold_out",
  "return_exchange",
  "coupon",
  "membership_card",
  "receipt_check",
];

function normalizeAlias(alias: string): string {
  return alias.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

describe("symbol encyclopedia data", () => {
  test("contains the seventy accepted curated symbols", () => {
    expect(symbolEntries.map((entry) => entry.id).sort()).toEqual([...acceptedSymbolIds].sort());
  });

  test("provides Korean and English localization for every active symbol", () => {
    for (const entry of symbolEntries) {
      expect(entry.status).toBe("active");
      expect(entry.editorialStatus).toBe("approved");
      expect(entry.subcategory.length).toBeGreaterThan(0);
      expect(entry.facets.length).toBeGreaterThanOrEqual(3);
      expect(entry.symbolRole.length).toBeGreaterThanOrEqual(1);
      expect(entry.embeddingProfile.chunkTypes).toEqual(
        expect.arrayContaining(["searchText", "sceneModifier", "safeReading", "metaphorHook"]),
      );

      for (const locale of SUPPORTED_LOCALES) {
        expect(entry.locales[locale].label.length).toBeGreaterThan(0);
        expect(entry.locales[locale].aliases.length).toBeGreaterThanOrEqual(3);
        expect(entry.locales[locale].coreMeanings.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test("keeps each locale vector-ready with scene modifiers, search text, and avoid expressions", () => {
    for (const entry of symbolEntries) {
      for (const locale of SUPPORTED_LOCALES) {
        const localized = entry.locales[locale];

        expect(localized.searchText.length).toBeGreaterThan(20);
        expect(Object.keys(localized.sceneModifiers).length).toBeGreaterThanOrEqual(3);
        expect(localized.avoidExpressions.length).toBeGreaterThanOrEqual(2);
        expect(localized.cardTitleSeeds.length).toBeGreaterThanOrEqual(2);
        expect(localized.smallPrescriptions.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test("keeps Korean encyclopedia safe readings neutral and user-facing", () => {
    const forbiddenSafeReadingPatterns = [
      /길몽|길조|태몽|재물운|대표적/,
      /반드시|무조건/,
      /안전해요|다뤄야 해요|낮게 반영/,
    ];
    const violations = symbolEntries.flatMap((entry) =>
      forbiddenSafeReadingPatterns
        .filter((pattern) => pattern.test(entry.locales.ko.safeReading))
        .map((pattern) => ({
          id: entry.id,
          pattern: String(pattern),
          safeReading: entry.locales.ko.safeReading,
        })),
    );

    expect(violations).toEqual([]);
  });

  test("flattens a localized symbol into the runtime retrieval shape", () => {
    const snake = getRuntimeSymbolEntry("snake", "ko");

    expect(snake).toMatchObject({
      id: "snake",
      category: "animal",
      subcategory: "animal",
      facets: expect.arrayContaining(["reptile", "instinct", "hidden_movement"]),
      symbolRole: expect.arrayContaining(["primary_candidate"]),
      safetyLevel: "sensitive",
      accessTier: "free",
      label: "뱀",
    });
    expect(snake.aliases).toEqual(expect.arrayContaining(["뱀", "구렁이"]));
    expect(snake.evidence.sceneModifiers.many?.reading).toContain("한꺼번에");
    expect(snake.evidence.avoidExpressions).toContain("태몽이다");
  });

  test("adds the next twenty symbols with the v0.2 taxonomy", () => {
    const newSymbols = symbolEntries.filter((entry) => v02BatchSymbolIds.includes(entry.id));

    expect(newSymbols).toHaveLength(20);
    expect(newSymbols.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["home", "key", "hospital", "stranger", "fish"]),
    );
    expect(newSymbols.every((entry) => entry.status === "active")).toBe(true);
    expect(newSymbols.every((entry) => entry.editorialStatus === "approved")).toBe(true);
  });

  test("adds the first phase 2 coverage batch with person, body, place, object, and event symbols", () => {
    const phase2Symbols = symbolEntries.filter((entry) => phase2BatchSymbolIds.includes(entry.id));

    expect(phase2Symbols).toHaveLength(20);
    expect(phase2Symbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["person", "body", "place", "object", "event"]),
    );
    expect(phase2Symbols.filter((entry) => entry.safetyLevel === "sensitive").map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["death", "funeral", "pregnancy", "money", "teeth"]),
    );
  });

  test("adds the second phase 2 coverage batch for routes, actions, body cues, public scenes, and nature", () => {
    const phase2BSymbols = symbolEntries.filter((entry) => phase2BBatchSymbolIds.includes(entry.id));

    expect(phase2BSymbols).toHaveLength(20);
    expect(phase2BSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["place", "object", "body", "action", "event", "nature", "food", "emotion", "abstract"]),
    );
    expect(phase2BSymbols.filter((entry) => entry.safetyLevel === "sensitive").map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["body", "blood", "wedding"]),
    );
  });

  test("uses domain-specific categories for food, emotion, and scene-quality symbols", () => {
    expect(symbolEntries.find((entry) => entry.id === "food")?.category).toBe("food");
    expect(symbolEntries.find((entry) => entry.id === "apple")?.category).toBe("food");
    expect(symbolEntries.find((entry) => entry.id === "rice")?.category).toBe("food");
    expect(symbolEntries.find((entry) => entry.id === "egg")?.category).toBe("food");
    expect(symbolEntries.find((entry) => entry.id === "eye")?.category).toBe("body");
    expect(symbolEntries.find((entry) => entry.id === "crying")?.category).toBe("emotion");
    expect(symbolEntries.find((entry) => entry.id === "crowd")?.category).toBe("abstract");
  });

  test("adds disambiguated food and eye symbols for common dream coverage", () => {
    const foodExpansionSymbols = symbolEntries.filter((entry) => foodExpansionSymbolIds.includes(entry.id));

    expect(foodExpansionSymbols).toHaveLength(5);
    expect(foodExpansionSymbols.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["apple", "fruit", "rice", "egg", "eye"]),
    );
    expect(symbolEntries.find((entry) => entry.id === "apple")?.disambiguation?.ko?.[0]).toMatchObject({
      alias: "사과",
      fallback: "candidate_only",
    });
    expect(symbolEntries.find((entry) => entry.id === "eye")?.disambiguation?.ko?.[0]).toMatchObject({
      alias: "눈",
      fallback: "candidate_only",
    });
  });

  test("adds the second Korean homonym disambiguation batch with internet-reviewed source notes", () => {
    const batchSymbols = symbolEntries.filter((entry) => secondHomonymDisambiguationSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);

    for (const id of secondHomonymDisambiguationSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.disambiguation?.ko?.length).toBeGreaterThan(0);
      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the third homonym disambiguation batch for Korean and English high-risk aliases", () => {
    const batchSymbols = symbolEntries.filter((entry) => thirdHomonymDisambiguationSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);

    for (const id of thirdHomonymDisambiguationSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);
      const hasDisambiguation = Boolean(entry?.disambiguation?.ko?.length) || Boolean(entry?.disambiguation?.en?.length);

      expect(hasDisambiguation).toBe(true);
    }
  });

  test("adds the next researched everyday expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => everydayExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["nature", "body", "object"]),
    );

    for (const id of everydayExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched relationship-role expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => relationshipRoleExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(expect.arrayContaining(["person"]));

    for (const id of relationshipRoleExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched life-scene expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => lifeSceneExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["place", "object", "event", "abstract", "body"]),
    );

    for (const id of lifeSceneExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched digital-travel expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => digitalTravelExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["object", "place", "abstract"]),
    );

    for (const id of digitalTravelExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched practical-stress expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => practicalStressExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["object", "event", "abstract"]),
    );
    expect(batchSymbols.filter((entry) => entry.safetyLevel === "sensitive").map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["wallet_card", "id_card", "contract"]),
    );

    for (const id of practicalStressExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched household-routine expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => householdRoutineExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["place", "object", "event"]),
    );

    for (const id of householdRoutineExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched public-procedure expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => publicProcedureExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["place", "object", "event", "abstract"]),
    );

    for (const id of publicProcedureExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched work-digital expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => workDigitalExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["object", "event", "abstract"]),
    );

    for (const id of workDigitalExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched social-relationship expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => socialRelationshipExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["action", "event", "abstract"]),
    );

    for (const id of socialRelationshipExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched life-organization expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => lifeOrganizationExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["action", "event", "object"]),
    );

    for (const id of lifeOrganizationExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched urban-transit expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => urbanTransitExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["place", "object", "event"]),
    );

    for (const id of urbanTransitExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched priority body and relationship expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => priorityBodyRelationshipExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(20);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["body", "event", "emotion", "object"]),
    );
    expect(batchSymbols.filter((entry) => entry.safetyLevel === "sensitive").map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        "toothache",
        "bleeding_nose",
        "vomit",
        "sick",
        "wound",
        "fever",
        "surgery",
        "hospital_bed",
        "lost_child",
        "divorce",
      ]),
    );

    for (const id of priorityBodyRelationshipExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched priority place, object, and nature expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => priorityPlaceObjectNatureExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(30);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["place", "object", "nature"]),
    );
    expect(batchSymbols.filter((entry) => entry.safetyLevel === "sensitive").map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["cliff", "storm", "tsunami", "volcano", "eclipse"]),
    );

    for (const id of priorityPlaceObjectNatureExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched body-treatment expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => bodyTreatmentExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["body", "event", "object"]),
    );
    expect(batchSymbols.filter((entry) => entry.safetyLevel === "sensitive").map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["wound", "fever", "injection", "surgery", "ambulance", "hospital_bed"]),
    );

    for (const id of bodyTreatmentExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched home-structure expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => homeStructureExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["place", "object"]),
    );

    for (const id of homeStructureExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched work-pressure expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => workPressureExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["event", "abstract", "place"]),
    );

    for (const id of workPressureExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched fear-control expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => fearControlExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["event", "abstract", "person"]),
    );
    expect(batchSymbols.filter((entry) => entry.safetyLevel === "sensitive").map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["drowning", "apocalypse", "explosion", "monster", "zombie"]),
    );

    for (const id of fearControlExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched place-space expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => placeSpaceExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["place"]),
    );

    for (const id of placeSpaceExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the researched money-pressure expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => moneyPressureExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["abstract", "object", "place"]),
    );

    for (const id of moneyPressureExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("covers the requested people-role completion symbols without duplicating unknown-person semantics", () => {
    const batchSymbols = symbolEntries.filter((entry) => peopleRoleCompletionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(expect.arrayContaining(["person"]));
    expect(symbolEntries.some((entry) => entry.id === "unknown_person")).toBe(false);
    expect(symbolEntries.find((entry) => entry.id === "stranger")?.locales.ko.aliases).toEqual(
      expect.arrayContaining(["낯선 사람"]),
    );

    for (const id of newPeopleRoleCompletionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the requested emotion-state expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => emotionStateExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(expect.arrayContaining(["emotion", "abstract"]));

    for (const id of newEmotionStateExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the requested modern work-communication expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => modernWorkCommunicationExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["object", "event", "place", "abstract"]),
    );

    for (const id of newModernWorkCommunicationExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the requested relationship-distance expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => relationshipDistanceExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["action", "event", "emotion", "abstract"]),
    );

    for (const id of relationshipDistanceExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the requested core-emotion expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => coreEmotionExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(expect.arrayContaining(["emotion", "abstract"]));

    for (const id of coreEmotionExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the requested digital-relationship expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => digitalRelationshipExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(expect.arrayContaining(["object", "event", "abstract"]));

    for (const id of digitalRelationshipExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the requested call-communication expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => callCommunicationExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(expect.arrayContaining(["object", "event", "abstract"]));

    for (const id of callCommunicationExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the requested extended-family expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => extendedFamilyExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(expect.arrayContaining(["person", "event", "abstract"]));

    for (const id of extendedFamilyExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the requested body-sensation expansion symbols with sensitive safety", () => {
    const batchSymbols = symbolEntries.filter((entry) => bodySensationExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(expect.arrayContaining(["body"]));
    expect(batchSymbols.every((entry) => entry.safetyLevel === "sensitive")).toBe(true);

    for (const id of bodySensationExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the requested public-evaluation expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => publicEvaluationExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["place", "person", "object", "event", "abstract"]),
    );

    for (const id of publicEvaluationExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("adds the requested consumer-service expansion symbols", () => {
    const batchSymbols = symbolEntries.filter((entry) => consumerServiceExpansionSymbolIds.includes(entry.id));

    expect(batchSymbols).toHaveLength(10);
    expect(batchSymbols.map((entry) => entry.category)).toEqual(
      expect.arrayContaining(["person", "place", "object", "event"]),
    );

    for (const id of consumerServiceExpansionSymbolIds) {
      const entry = symbolEntries.find((symbolEntry) => symbolEntry.id === id);

      expect(entry?.sourceBasis.some((basis) => basis.startsWith("internet review:"))).toBe(true);
    }
  });

  test("keeps high-risk aliases from waking multiple active symbols", () => {
    const collisions = SUPPORTED_LOCALES.flatMap((locale) => {
      const aliasOwners = new Map<string, Set<string>>();

      for (const entry of symbolEntries) {
        for (const alias of [entry.locales[locale].label, ...entry.locales[locale].aliases]) {
          const key = normalizeAlias(alias);

          if (!key) {
            continue;
          }

          aliasOwners.set(key, new Set([...(aliasOwners.get(key) ?? []), entry.id]));
        }
      }

      return [...aliasOwners.entries()]
        .map(([alias, owners]) => ({
          alias,
          owners: [...owners].sort(),
          collisionKey: `${locale}:${alias}:${[...owners].sort().join(",")}`,
        }))
        .filter((collision) => collision.owners.length > 1)
        .filter((collision) => !allowedAliasCollisions.has(collision.collisionKey));
    });

    expect(collisions).toEqual([]);
  });
});
