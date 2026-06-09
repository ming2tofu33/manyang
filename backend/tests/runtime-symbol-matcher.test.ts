import { describe, expect, test } from "vitest";

import { findRuntimeSymbolMatches } from "../src/services/symbol-matcher";

describe("findRuntimeSymbolMatches", () => {
  test("returns scored runtime matches with evidence for the snake owned-land case", () => {
    const matches = findRuntimeSymbolMatches("우리 땅에 큰 구렁이들하고 뱀들이 수십 마리가 나왔어.", {
      locale: "ko",
      limit: 5,
    });

    expect(matches.map((match) => match.entryId)).toEqual(expect.arrayContaining(["snake", "owned_land", "many"]));

    const snake = matches.find((match) => match.entryId === "snake");
    expect(snake).toMatchObject({
      locale: "ko",
      label: "뱀",
      matchType: "exact",
      category: "animal",
      subcategory: "animal",
    });
    expect(snake?.facets).toEqual(expect.arrayContaining(["reptile", "hidden_movement"]));
    expect(snake?.symbolRole).toContain("primary_candidate");
    expect(snake?.confidence).toBeGreaterThanOrEqual(0.82);
    expect(snake?.matchedText).toEqual(expect.arrayContaining(["뱀", "구렁이"]));
    expect(snake?.usedFields).toEqual(expect.arrayContaining(["aliases", "sceneModifiers.enteringHomeOrLand", "sceneModifiers.many"]));
    expect(snake?.evidence.coreMeanings).toContain("생명력");
  });

  test("detects scene modifiers for a changing door without losing the canonical symbol", () => {
    const matches = findRuntimeSymbolMatches("학교 복도에서 문이 계속 바뀌는 꿈을 꿨어.", {
      locale: "ko",
      limit: 5,
    });

    const door = matches.find((match) => match.entryId === "door");

    expect(door?.matchType).toBe("exact");
    expect(door?.confidence).toBeGreaterThanOrEqual(0.96);
    expect(door?.confidence).toBeLessThan(1);
    expect(door?.usedFields).toContain("sceneModifiers.changing");
    expect(door?.rankReason).toContain("scene modifier");
  });

  test("supports English aliases and localized evidence", () => {
    const matches = findRuntimeSymbolMatches("I walked down a long hallway toward a locked door.", {
      locale: "en",
      limit: 5,
    });

    expect(matches.map((match) => match.entryId)).toEqual(expect.arrayContaining(["corridor", "door"]));
    expect(matches.find((match) => match.entryId === "corridor")?.label).toBe("Corridor");
    expect(matches.find((match) => match.entryId === "door")?.usedFields).toContain("sceneModifiers.locked");
  });

  test("does not match English aliases inside longer words", () => {
    const matches = findRuntimeSymbolMatches("I barely remember the dream. Only a strange mood stayed with me.", {
      locale: "en",
      limit: 5,
    });

    expect(matches.map((match) => match.entryId)).not.toContain("naked");
  });

  test("matches newly added everyday symbols with v0.2 metadata", () => {
    const matches = findRuntimeSymbolMatches("집에서 열쇠를 찾다가 가방과 신발을 잃어버렸어.", {
      locale: "ko",
      limit: 8,
    });

    expect(matches.map((match) => match.entryId)).toEqual(
      expect.arrayContaining(["home", "key", "bag", "shoes", "lost_item"]),
    );
    expect(matches.find((match) => match.entryId === "key")).toMatchObject({
      category: "object",
      subcategory: "key_item",
    });
  });

  test("matches phase 2 coverage symbols for relationship, communication, and body details", () => {
    const matches = findRuntimeSymbolMatches("전 연인이 휴대폰으로 연락했는데 답장이 오지 않았고 치아가 빠졌어요.", {
      locale: "ko",
      limit: 8,
    });

    expect(matches.map((match) => match.entryId)).toEqual(expect.arrayContaining(["ex_partner", "phone", "teeth"]));
    expect(matches.find((match) => match.entryId === "phone")?.usedFields).toEqual(
      expect.arrayContaining(["aliases", "sceneModifiers.noReply"]),
    );
    expect(matches.find((match) => match.entryId === "teeth")).toMatchObject({
      category: "body",
      subcategory: "mouth",
    });
  });

  test("matches phase 2B coverage symbols for route, pursuit, and body-fluid details", () => {
    const matches = findRuntimeSymbolMatches("긴 길을 따라 다리를 건너는데 누군가에게 쫓기다가 피를 봤어요.", {
      locale: "ko",
      limit: 8,
    });

    expect(matches.map((match) => match.entryId)).toEqual(
      expect.arrayContaining(["road", "bridge", "being_chased", "blood"]),
    );
    expect(matches.find((match) => match.entryId === "being_chased")?.category).toBe("action");
    expect(matches.find((match) => match.entryId === "blood")?.usedFields).toEqual(
      expect.arrayContaining(["aliases"]),
    );
  });

  test("matches real UTF-8 Korean dream text with particles and spacing", () => {
    const matches = findRuntimeSymbolMatches("내 땅에 큰 구렁이와 뱀이 수십 마리 나왔어.", {
      locale: "ko",
      limit: 8,
    });

    expect(matches.map((match) => match.entryId)).toEqual(
      expect.arrayContaining(["snake", "owned_land", "many"]),
    );
    expect(matches.find((match) => match.entryId === "snake")?.matchedText).toEqual(
      expect.arrayContaining(["뱀", "구렁이"]),
    );
    expect(matches.find((match) => match.entryId === "owned_land")?.matchedText).toContain("내 땅");
    expect(matches.find((match) => match.entryId === "many")?.matchedText).toContain("수십");
  });

  test("matches real UTF-8 Korean object and nature symbols with particles", () => {
    const matches = findRuntimeSymbolMatches("엘리베이터에 갇혔고 바다를 봤어.", {
      locale: "ko",
      limit: 5,
    });

    expect(matches.map((match) => match.entryId)).toEqual(expect.arrayContaining(["elevator", "sea"]));
    expect(matches.find((match) => match.entryId === "elevator")?.matchedText).toContain("엘리베이터");
    expect(matches.find((match) => match.entryId === "sea")?.matchedText).toContain("바다");
  });

  describe("monosyllabic-homonym guard", () => {
    const ids = (text: string) => findRuntimeSymbolMatches(text, { locale: "ko", limit: 8 }).map((m) => m.entryId);

    test("matches the single-syllable nouns in their real noun forms", () => {
      expect(ids("말을 타고 달렸어")).toContain("horse");
      expect(ids("들판에 말이 서 있었어")).toContain("horse");
      expect(ids("별이 가득했어")).toContain("star");
      expect(ids("불이 났어")).toContain("fire");
      expect(ids("손을 다쳤어")).toContain("hand");
      expect(ids("발이 무거웠어")).toContain("foot");
    });

    test("does not wake them on homonyms formed by a guarded suffix", () => {
      // 말로(by words)/말도(idiom), 별로(adverb)/별도(separately), 불었어(불다 "to blow")
      expect(ids("말로 설명했어")).not.toContain("horse");
      expect(ids("말도 안 되는 일이야")).not.toContain("horse");
      expect(ids("별로 안 좋았어")).not.toContain("star");
      expect(ids("별도로 챙겼어")).not.toContain("star");
      expect(ids("바람이 세게 불었어")).not.toContain("fire");
    });

    test("does not treat speech as the horse symbol", () => {
      const matches = findRuntimeSymbolMatches(
        "꿈에서 돼지가 나와서 나한테 말을 거는 꿈을 꿨어. 뭐라고 얘기해준 거 같은데 기억은 잘 안 나.",
        { locale: "ko", limit: 8 },
      );
      const matchIds = matches.map((match) => match.entryId);

      expect(matchIds).toContain("pig");
      expect(matchIds).not.toContain("horse");
    });

    test("matches relationship harm actions when a friend is the actor", () => {
      const matches = findRuntimeSymbolMatches("친구가 나를 계속 괴롭히는 꿈을 꿨어.", {
        locale: "ko",
        limit: 8,
      });
      const matchIds = matches.map((match) => match.entryId);
      const bullying = matches.find((match) => match.entryId === "bullying");

      expect(matchIds).toEqual(expect.arrayContaining(["friend", "bullying"]));
      expect(bullying?.usedFields).toContain("sceneModifiers.victim");
      expect(bullying?.evidence.coreMeanings).toContain("권력 차이");
    });

    test("uses encyclopedia disambiguation for common Korean homonyms", () => {
      expect(ids("말을 타고 들판을 달렸어")).toContain("horse");
      expect(ids("돼지가 나한테 말을 걸었어")).not.toContain("horse");

      expect(ids("차를 운전하는 꿈")).toContain("car");
      expect(ids("차를 마시는 꿈")).not.toContain("car");

      expect(ids("배를 타고 강을 건넜어")).toContain("boat");
      expect(ids("배가 아픈 꿈")).not.toContain("boat");

      expect(ids("눈이 펑펑 오는 꿈")).toContain("snow");
      expect(ids("눈이 아픈 꿈")).not.toContain("snow");

      expect(ids("피가 나는 꿈")).toContain("blood");
      expect(ids("커피를 마시는 꿈")).not.toContain("blood");
    });

    test("matches new food and eye symbols without confusing apology or snow usage", () => {
      expect(ids("사과를 먹는 꿈")).toContain("apple");
      expect(ids("사과를 받는 꿈")).not.toContain("apple");
      expect(ids("과일이 가득 열린 꿈")).toContain("fruit");
      expect(ids("밥을 차려주는 꿈")).toContain("rice");
      expect(ids("달걀이 깨지는 꿈")).toContain("egg");
      expect(ids("눈이 나를 바라보는 꿈")).toContain("eye");
    });

    test("uses the second Korean homonym disambiguation batch", () => {
      expect(ids("강아지 한 마리가 나를 따라왔어")).toContain("dog");
      expect(ids("사과 세 개를 받았어")).not.toContain("dog");

      expect(ids("열쇠와 키를 찾아 문을 열었어")).toContain("key");
      expect(ids("키가 커지는 꿈")).not.toContain("key");

      expect(ids("다리를 건너 강을 지나갔어")).toContain("bridge");
      expect(ids("다리를 다치는 꿈")).not.toContain("bridge");

      expect(ids("해가 뜨는 꿈")).toContain("sun");
      expect(ids("새해가 된 꿈")).not.toContain("sun");

      expect(ids("보름달이 환하게 떴어")).toContain("moon");
      expect(ids("한 달 동안 기다렸어")).not.toContain("moon");

      expect(ids("불이 나서 연기가 났어")).toContain("fire");
      expect(ids("불안한 마음만 남았어")).not.toContain("fire");

      expect(ids("절에 가서 기도했어")).toContain("temple");
      expect(ids("누군가에게 절을 했어")).not.toContain("temple");

      expect(ids("총을 쏘는 소리를 들었어")).toContain("gun");
      expect(ids("총 세 명이 방에 있었어")).not.toContain("gun");

      expect(ids("금반지를 받는 꿈")).toContain("gold");
      expect(ids("거울에 금이 갔어")).not.toContain("gold");

      expect(ids("유명 배우가 나왔어")).toContain("celebrity");
      expect(ids("새로운 기술을 배우는 꿈")).not.toContain("celebrity");
      expect(ids("새로운 기술을 배우는 꿈")).not.toContain("crying");
    });

    test("uses the third Korean homonym disambiguation batch", () => {
      expect(ids("길을 따라 조용히 걸었어")).toContain("road");
      expect(ids("일이 너무 길어지는 꿈")).not.toContain("road");

      expect(ids("쥐가 방 안을 돌아다녔어")).toContain("mouse");
      expect(ids("다리에 쥐가 나는 꿈")).not.toContain("mouse");
      expect(ids("다리에 쥐가 나는 꿈")).not.toContain("bridge");
      expect(ids("다리에 쥐가 나는 꿈")).not.toContain("flying");

      expect(ids("큰 곰이 숲에서 나왔어")).toContain("bear");
      expect(ids("곰곰이 생각하는 꿈")).not.toContain("bear");

      expect(ids("닭이 새벽에 우는 꿈")).toContain("chicken");
      expect(ids("닭고기를 먹는 꿈")).not.toContain("chicken");

      expect(ids("큰 바위와 돌이 길을 막았어")).toContain("rock");
      expect(ids("집으로 돌아가는 꿈")).not.toContain("rock");

      expect(ids("시원한 바람이 불었어")).toContain("wind");
      expect(ids("바람피우는 장면을 봤어")).not.toContain("wind");

      expect(ids("시장에 가서 물건을 샀어")).toContain("market");
      expect(ids("시장님이 연설하는 꿈")).not.toContain("market");

      expect(ids("책을 펼쳐 읽는 꿈")).toContain("book");
      expect(ids("책임을 지는 꿈")).not.toContain("book");

      expect(ids("목이 꽉 막혀 말을 못 했어")).not.toContain("horse");
    });

    test("uses English disambiguation for watch and glasses", () => {
      const enIds = (text: string) => findRuntimeSymbolMatches(text, { locale: "en", limit: 8 }).map((m) => m.entryId);

      expect(enIds("I found a wristwatch ticking on the desk.")).toContain("watch");
      expect(enIds("I watched the door from far away.")).not.toContain("watch");

      expect(enIds("I put on glasses and everything became clear.")).toContain("glasses");
      expect(enIds("I drank water from a glass cup.")).not.toContain("glasses");
    });

    test("matches the next ten researched everyday symbols", () => {
      expect(ids("깊은 밤에 별빛 아래 서 있었어")).toContain("night");
      expect(ids("귀에 누군가 속삭이는 소리가 들렸어")).toContain("ear");
      expect(ids("목이 꽉 막혀 말을 못 했어")).toContain("neck");
      expect(ids("입이 열리지 않아 말할 수 없었어")).toContain("mouth");
      expect(ids("손톱이 깨져서 신경 쓰였어")).toContain("nail");
      expect(ids("약을 먹고 몸이 나아지는 꿈")).toContain("medicine");
      expect(ids("밧줄에 묶여 있다가 풀려났어")).toContain("rope");
      expect(ids("휴대폰에 메시지가 도착했어")).toContain("message");
      expect(ids("엘리베이터 버튼을 눌렀어")).toContain("button");
      expect(ids("지갑을 잃어버렸다가 다시 찾았어")).toContain("wallet");
    });

    test("matches the researched relationship-role expansion symbols", () => {
      expect(ids("프로젝트 때문에 같이 일하는 동료가 자꾸 꿈에 나왔어")).toContain("coworker");
      expect(ids("상사가 나를 칭찬하는 꿈을 꿨어")).toContain("boss");
      expect(ids("오빠와 크게 다투는 꿈을 꿨어")).toContain("sibling");
      expect(ids("내 딸이 길을 잃어버린 꿈을 꿨어")).toContain("son_daughter");
      expect(ids("의사가 내 상태를 차분히 봐주는 꿈")).toContain("doctor");
      expect(ids("간호사가 나를 돌봐주는 꿈")).toContain("nurse");
      expect(ids("이웃이 우리 집 문을 두드렸어")).toContain("neighbor");
      expect(ids("가게 손님이 계속 불만을 말하는 꿈")).toContain("customer");
      expect(ids("짝사랑하는 사람이 나에게 웃어줬어")).toContain("crush");
      expect(ids("같은 반 친구와 시험을 보는 꿈")).toContain("classmate");

      expect(ids("낯선 남자가 조용히 서 있었어")).toContain("stranger");
      expect(ids("낯선 여자가 나를 도와줬어")).toContain("stranger");
      expect(ids("의사결정을 못 하고 망설였어")).not.toContain("doctor");
    });

    test("matches the researched life-scene expansion symbols", () => {
      expect(ids("욕조에서 목욕을 하며 피로를 씻어냈어")).toContain("bath");
      expect(ids("거울 앞에서 화장을 고치고 있었어")).toContain("makeup");
      expect(ids("내 얼굴이 이상하게 변해 있었어")).toContain("mirror_self");
      expect(ids("목소리가 나오지 않아서 답답했어")).toContain("voice");
      expect(ids("누군가 내 이름을 불렀어")).toContain("name");
      expect(ids("예쁜 선물을 받는 꿈을 꿨어")).toContain("gift");
      expect(ids("내 생일인데 아무도 축하해주지 않았어")).toContain("birthday");
      expect(ids("시끄러운 파티에서 혼자 서 있었어")).toContain("party");
      expect(ids("식당에서 친구와 밥을 먹었어")).toContain("restaurant");
      expect(ids("낯선 호텔 방에서 잠을 잤어")).toContain("hotel");
    });

    test("matches the researched digital-travel expansion symbols", () => {
      expect(ids("인스타 게시물에 좋아요가 너무 많이 달렸어")).toContain("sns");
      expect(ids("인스타 게시물에 좋아요가 너무 많이 달렸어")).not.toContain("running");
      expect(ids("카메라로 내 모습을 계속 찍는 꿈을 꿨어")).toContain("camera");
      expect(ids("비밀번호를 잊어버려서 로그인을 못 했어")).toContain("password");
      expect(ids("메일함에 중요한 이메일이 도착했어")).toContain("email");
      expect(ids("휴대폰 알림이 계속 울려서 불안했어")).toContain("notification");
      expect(ids("지도를 보는데 길이 계속 바뀌었어")).toContain("map");
      expect(ids("공연 티켓을 잃어버리는 꿈을 꿨어")).toContain("ticket");
      expect(ids("공항에서 여권을 찾지 못했어")).toContain("passport");
      expect(ids("공항 보안검색대에서 계속 걸렸어")).toContain("airport_security");
      expect(ids("택배 상자가 문 앞에 도착했어")).toContain("delivery");
    });

    test("matches the researched practical-stress expansion symbols", () => {
      expect(ids("공항에서 캐리어를 끌고 계속 헤맸어")).toContain("luggage");
      expect(ids("비행기에서 내렸는데 수하물이 사라졌어")).toContain("lost_luggage");
      expect(ids("계산하려는데 신용카드가 계속 거절됐어")).toContain("wallet_card");
      expect(ids("신분증을 잃어버려서 확인을 못 받았어")).toContain("id_card");
      expect(ids("계약서에 사인을 해야 하는데 손이 떨렸어")).toContain("contract");
      expect(ids("달력에 중요한 날짜가 빨갛게 표시돼 있었어")).toContain("calendar");
      expect(ids("알람시계가 계속 울리는데 끌 수 없었어")).toContain("alarm_clock");
      expect(ids("예약한 약속 시간에 늦을까 봐 뛰어갔어")).toContain("appointment");
      expect(ids("휴대폰 배터리가 없는데 충전기를 찾지 못했어")).toContain("charger");
      expect(ids("와이파이가 끊겨서 인터넷에 연결이 안 됐어")).toContain("wifi");
    });

    test("matches the researched household-routine expansion symbols", () => {
      expect(ids("화장실 칸에 들어갔는데 문이 안 잠겼어")).toContain("bathroom_stall");
      expect(ids("화장실 칸에 들어갔는데 문이 안 잠겼어")).not.toContain("flood");
      expect(ids("샤워를 하면서 몸의 먼지를 씻어냈어")).toContain("shower");
      expect(ids("빨래가 산더미처럼 쌓여 있었어")).toContain("laundry");
      expect(ids("쓰레기를 버리려는데 봉투가 찢어졌어")).toContain("trash");
      expect(ids("냉장고 문을 열었는데 안이 텅 비어 있었어")).toContain("refrigerator");
      expect(ids("냉장고 문을 열었는데 안이 텅 비어 있었어")).not.toContain("rain");
      expect(ids("옷장을 열었는데 입을 옷을 찾지 못했어")).toContain("closet");
      expect(ids("옷장을 열었는데 입을 옷을 찾지 못했어")).not.toContain("mouth");
      expect(ids("책상 위에 서류가 가득 쌓여 있었어")).toContain("desk");
      expect(ids("의자가 부서져서 앉을 수 없었어")).toContain("chair");
      expect(ids("이불을 덮고 숨어 있었어")).toContain("blanket");
      expect(ids("벽시계 바늘이 거꾸로 돌고 있었어")).toContain("clock");
      expect(ids("벽시계 바늘이 거꾸로 돌고 있었어")).not.toContain("rock");
      expect(ids("벽시계 바늘이 거꾸로 돌고 있었어")).not.toContain("watch");
      expect(ids("손목시계를 잃어버렸어")).toContain("watch");
      expect(ids("손목시계를 잃어버렸어")).not.toContain("clock");
    });

    test("matches the researched public-procedure expansion symbols", () => {
      expect(ids("매표소 앞에서 긴 줄을 서서 기다렸어")).toContain("queue");
      expect(ids("건물 입구를 찾지 못해서 계속 돌았어")).toContain("entrance");
      expect(ids("비상구 출구가 닫혀 있어서 나갈 수 없었어")).toContain("exit");
      expect(ids("개찰구 게이트에서 표가 인식되지 않았어")).toContain("gate");
      expect(ids("엘리베이터 버튼을 눌렀는데 불이 안 들어왔어")).toContain("elevator_button");
      expect(ids("엘리베이터 버튼을 눌렀는데 불이 안 들어왔어")).toContain("elevator");
      expect(ids("아래층으로 내려가는 계단을 계속 내려갔어")).toContain("stairs_down");
      expect(ids("위층으로 올라가는 계단을 힘겹게 올랐어")).toContain("stairs_up");
      expect(ids("주차장에서 내 차를 어디 세웠는지 찾지 못했어")).toContain("parking_lot");
      expect(ids("계산 후 영수증이 길게 나왔어")).toContain("receipt");
      expect(ids("카드 결제가 계속 거절되어 당황했어")).toContain("payment");
    });

    test("matches the researched work-digital expansion symbols", () => {
      expect(ids("회의실에서 중요한 회의를 기다리고 있었어")).toContain("meeting");
      expect(ids("사람들 앞에서 발표를 해야 하는데 자료가 사라졌어")).toContain("presentation");
      expect(ids("중요한 문서에 서명해야 하는 꿈을 꿨어")).toContain("document");
      expect(ids("엑셀 표 숫자가 계속 바뀌어서 혼란스러웠어")).toContain("spreadsheet");
      expect(ids("프린터가 종이를 계속 뱉어내고 멈추지 않았어")).toContain("printer");
      expect(ids("키보드가 고장 나서 아무 글자도 입력되지 않았어")).toContain("keyboard");
      expect(ids("화면이 갑자기 검게 변하고 아무것도 보이지 않았어")).toContain("screen");
      expect(ids("화상회의에서 내 얼굴만 멈춰 있었어")).toContain("video_call");
      expect(ids("로그인을 하려는데 비밀번호가 계속 틀렸어")).toContain("login");
      expect(ids("컴퓨터 화면에 오류 메시지가 떠서 진행할 수 없었어")).toContain("error_message");
    });

    test("matches the researched social-relationship expansion symbols", () => {
      expect(ids("처음 보는 사람과 악수를 했는데 손이 차가웠어")).toContain("handshake");
      expect(ids("친구가 나를 꼭 포옹해줘서 안심됐어")).toContain("hug");
      expect(ids("가족이랑 말다툼을 하다가 목소리가 커졌어")).toContain("argument");
      expect(ids("상대가 나한테 미안하다고 사과했어")).toContain("apology");
      expect(ids("상대가 나한테 미안하다고 사과했어")).not.toContain("apple");
      expect(ids("빨간 사과를 먹는 꿈을 꿨어")).toContain("apple");
      expect(ids("빨간 사과를 먹는 꿈을 꿨어")).not.toContain("apology");
      expect(ids("내가 좋아한다고 고백했는데 얼굴이 뜨거웠어")).toContain("confession");
      expect(ids("제안을 했는데 거절당해서 민망했어")).toContain("rejection");
      expect(ids("친구에게 초대장을 받고 파티에 갔어")).toContain("invitation");
      expect(ids("중요한 비밀을 숨기고 들킬까 봐 불안했어")).toContain("secret");
      expect(ids("나에 대한 소문이 퍼져서 사람들이 수군거렸어")).toContain("rumor");
      expect(ids("약속을 지키지 못해서 마음이 무거웠어")).toContain("promise");
      expect(ids("약속을 지키지 못해서 마음이 무거웠어")).not.toContain("appointment");
      expect(ids("진료 예약 시간에 늦는 꿈을 꿨어")).toContain("appointment");
      expect(ids("진료 예약 시간에 늦는 꿈을 꿨어")).not.toContain("promise");
    });

    test("matches the researched life-organization expansion symbols", () => {
      expect(ids("새 집으로 이사 가려고 짐을 정리했어")).toContain("moving_house");
      expect(ids("여행 가방에 짐을 싸는데 끝이 없었어")).toContain("packing");
      expect(ids("새 방에서 짐을 풀었는데 물건이 계속 나왔어")).toContain("unpacking");
      expect(ids("집을 청소했는데 먼지가 계속 나왔어")).toContain("cleaning");
      expect(ids("싱크대에서 설거지를 끝없이 했어")).toContain("washing_dishes");
      expect(ids("냄비에 국을 끓이며 요리를 했어")).toContain("cooking");
      expect(ids("집 전체가 리모델링 공사 중이었어")).toContain("renovation");
      expect(ids("아끼던 컵이 깨져서 물건이 부서졌어")).toContain("broken_object");
      expect(ids("고장 난 의자를 고치려고 나사를 조였어")).toContain("repair");
      expect(ids("보관함과 박스가 방 안에 쌓여 있었어")).toContain("storage_box");
      expect(ids("냄비에 국을 끓이며 요리를 했어")).not.toContain("kitchen");
    });

    test("matches the researched urban-transit expansion symbols", () => {
      expect(ids("지하철을 탔는데 사람이 너무 많았어")).toContain("subway");
      expect(ids("택시를 탔는데 기사가 다른 길로 갔어")).toContain("taxi");
      expect(ids("횡단보도 앞에서 건너야 할지 멈춰 있었어")).toContain("crosswalk");
      expect(ids("신호등이 계속 빨간불이라 기다렸어")).toContain("traffic_light");
      expect(ids("교차로에서 어느 방향으로 가야 할지 몰랐어")).toContain("intersection");
      expect(ids("어두운 터널을 지나가고 있었어")).toContain("tunnel");
      expect(ids("지하철역에서 출구를 찾지 못했어")).toContain("station");
      expect(ids("승강장에서 열차를 기다리는데 문이 열리지 않았어")).toContain("platform");
      expect(ids("내려야 할 역을 지나쳐서 당황했어")).toContain("missed_stop");
      expect(ids("차가 막혀 교통체증 속에서 움직이지 못했어")).toContain("traffic_jam");
      expect(ids("택시를 탔는데 기사가 다른 길로 갔어")).not.toContain("car");
      expect(ids("지하철을 탔는데 사람이 너무 많았어")).not.toContain("train");
    });

    test("matches the researched body-treatment expansion symbols", () => {
      expect(ids("팔에 깊은 상처가 나서 붕대를 찾았어")).toContain("wound");
      expect(ids("오래된 흉터가 갑자기 선명하게 보였어")).toContain("scar");
      expect(ids("피부가 벗겨지는 것 같아서 불편했어")).toContain("skin");
      expect(ids("얼굴에 큰 여드름이 나서 신경 쓰였어")).toContain("pimple");
      expect(ids("몸에 열이 나고 고열 때문에 누워 있었어")).toContain("fever");
      expect(ids("주사를 맞는 꿈을 꿨어")).toContain("injection");
      expect(ids("수술실에서 수술을 기다리고 있었어")).toContain("surgery");
      expect(ids("손에 붕대를 감고 있었어")).toContain("bandage");
      expect(ids("구급차가 와서 누군가를 태우고 갔어")).toContain("ambulance");
      expect(ids("병원 침대에 누워서 회복을 기다렸어")).toContain("hospital_bed");
      expect(ids("주사를 맞는 꿈을 꿨어")).not.toContain("hospital");
    });

    test("matches the researched home-structure expansion symbols", () => {
      expect(ids("옥상에 올라가서 아래를 내려다봤어")).toContain("roof");
      expect(ids("베란다에서 바깥 풍경을 보고 있었어")).toContain("balcony");
      expect(ids("어두운 지하실로 내려가는 꿈을 꿨어")).toContain("basement");
      expect(ids("다락방에서 오래된 상자를 발견했어")).toContain("attic");
      expect(ids("천장에서 물이 새고 있었어")).toContain("ceiling");
      expect(ids("바닥이 갈라져서 조심히 걸었어")).toContain("floor");
      expect(ids("벽에 금이 가서 계속 신경 쓰였어")).toContain("wall");
      expect(ids("울타리 너머로 누군가 서 있었어")).toContain("fence");
      expect(ids("정원에 꽃과 풀이 가득했어")).toContain("garden");
      expect(ids("마당에서 가족들이 모여 있었어")).toContain("yard");
    });

    test("matches the researched work-pressure expansion symbols", () => {
      expect(ids("회사 면접을 보는데 질문에 대답이 막혔어")).toContain("job_interview");
      expect(ids("퇴사한다고 말하려는데 목소리가 안 나왔어")).toContain("resignation");
      expect(ids("승진 발표 명단에 내 이름이 있는 꿈을 꿨어")).toContain("promotion");
      expect(ids("마감 시간이 다가오는데 일이 끝나지 않았어")).toContain("deadline");
      expect(ids("회사에서 야근을 계속하는 꿈을 꿨어")).toContain("overtime");
      expect(ids("월급이 입금되지 않아서 당황했어")).toContain("salary");
      expect(ids("업무 실수를 해서 보고서를 다시 고쳤어")).toContain("work_mistake");
      expect(ids("회사에서 내 자리가 없어져서 헤맸어")).toContain("work_seat");
      expect(ids("부서 이동으로 사무실 자리를 옮겼어")).toContain("office_move");
      expect(ids("인사평가 결과를 기다리는데 긴장됐어")).toContain("performance_review");
      expect(ids("회사 면접을 보는데 질문에 대답이 막혔어")).not.toContain("exam");
    });

    test("matches the researched fear-control expansion symbols", () => {
      expect(ids("어두운 방에 갇혀서 문을 열 수 없었어")).toContain("trapped");
      expect(ids("누군가에게 들킬까 봐 옷장 안에 숨어 있었어")).toContain("hiding");
      expect(ids("도망가야 하는데 몸이 안 움직였어")).toContain("unable_to_move");
      expect(ids("깊은 물에 빠져서 숨을 쉴 수 없었어")).toContain("drowning");
      expect(ids("누가 계속 나를 보고 감시하는 느낌이었어")).toContain("being_watched");
      expect(ids("내가 투명인간이 된 것처럼 아무도 나를 못 봤어")).toContain("invisible");
      expect(ids("세상이 끝나는 종말 같은 꿈을 꿨어")).toContain("apocalypse");
      expect(ids("건물이 갑자기 폭발해서 모두가 도망쳤어")).toContain("explosion");
      expect(ids("큰 괴물이 나를 쫓아오는 꿈을 꿨어")).toContain("monster");
      expect(ids("좀비들이 몰려와서 숨어 있었어")).toContain("zombie");
    });

    test("matches the researched place-space expansion symbols", () => {
      expect(ids("쇼핑몰에서 길을 잃고 계속 헤맸어")).toContain("mall");
      expect(ids("도서관에서 오래된 책을 찾고 있었어")).toContain("library");
      expect(ids("공원 벤치에 앉아 쉬고 있었어")).toContain("park");
      expect(ids("해변에서 파도 소리를 들으며 걸었어")).toContain("beach");
      expect(ids("깊은 숲속에서 길을 찾고 있었어")).toContain("forest");
      expect(ids("끝없는 사막을 혼자 걷고 있었어")).toContain("desert");
      expect(ids("작은 섬에 혼자 남겨진 꿈이었어")).toContain("island");
      expect(ids("어두운 지하도를 지나가는데 불안했어")).toContain("bridge_underpass");
      expect(ids("옥상에 올라가 아래를 내려다봤어")).toContain("rooftop");
      expect(ids("놀이터에서 그네를 타고 있었어")).toContain("playground");
    });

    test("matches the researched money-pressure expansion symbols", () => {
      expect(ids("은행 창구에서 번호표를 들고 기다렸어")).toContain("bank");
      expect(ids("빚을 갚아야 하는데 돈이 부족했어")).toContain("debt");
      expect(ids("복권에 당첨되는 꿈을 꿨어")).toContain("lottery");
      expect(ids("주식 투자가 크게 흔들리는 꿈이었어")).toContain("investment");
      expect(ids("월세를 내야 하는데 집세가 없었어")).toContain("rent");
      expect(ids("세금 고지서를 받고 당황했어")).toContain("tax");
      expect(ids("보험 서류를 찾고 있었어")).toContain("insurance");
      expect(ids("벌금 통지서를 받고 놀랐어")).toContain("fine");
      expect(ids("환불을 받으려고 영수증을 보여줬어")).toContain("refund");
      expect(ids("영수증 금액이 잘못 계산되어 있었어")).toContain("receipt_error");
    });

    test("matches the requested people-role completion symbols", () => {
      expect(ids("상사가 나를 불러서 보고서를 확인하는 꿈을 꿨어")).toContain("boss");
      expect(ids("프로젝트 때문에 같이 일하는 동료가 계속 꿈에 나왔어")).toContain("coworker");
      expect(ids("선생님이 교실에서 나에게 문제를 설명해줬어")).toContain("teacher");
      expect(ids("같은 반 친구와 시험을 보는 꿈을 꿨어")).toContain("classmate");
      expect(ids("이웃이 우리 집 문 앞에 서 있었어")).toContain("neighbor");
      expect(ids("집주인이 보증금을 돌려주지 않는 꿈을 꿨어")).toContain("landlord");
      expect(ids("가게 손님이 계속 불만을 말하는 꿈이었어")).toContain("customer");
      expect(ids("유명한 연예인이 나에게 말을 걸었어")).toContain("celebrity");
      expect(ids("어릴 적 친구가 갑자기 나타나서 같이 놀았어")).toContain("childhood_friend");
      expect(ids("낯선 사람이 복도 끝에 서 있었어")).toContain("stranger");
    });

    test("matches the requested emotion-state expansion symbols", () => {
      expect(ids("모임에서 분위기가 너무 어색해서 말을 못 했어")).toContain("awkwardness");
      expect(ids("친구가 칭찬받는 걸 보고 질투가 났어")).toContain("jealousy");
      expect(ids("떠난 사람이 너무 그리워서 계속 찾았어")).toContain("longing");
      expect(ids("내가 잘못한 것 같아서 죄책감이 컸어")).toContain("guilt");
      expect(ids("문제가 해결돼서 후련하고 안도했어")).toContain("relief");
      expect(ids("사람들 앞에서 창피하고 부끄러웠어")).toContain("shame");
      expect(ids("누군가를 동경하고 우러러보는 꿈이었어")).toContain("admiration");
      expect(ids("무조건 잘해야 한다는 압박이 심했어")).toContain("pressure_to_perform");
      expect(ids("모두가 나만 빼고 가서 소외감을 느꼈어")).toContain("being_left_out");
      expect(ids("좋기도 하고 불편하기도 한 복잡한 감정이 남았어")).toContain("mixed_feelings");
    });

    test("matches the requested modern work-communication expansion symbols", () => {
      expect(ids("단톡방에 메시지가 계속 올라왔어")).toContain("group_chat");
      expect(ids("인스타 DM으로 개인 메시지가 왔어")).toContain("dm_message");
      expect(ids("화상회의에서 내 얼굴만 멈춰 있었어")).toContain("video_call");
      expect(ids("회의실에 혼자 앉아 발표 순서를 기다렸어")).toContain("meeting_room");
      expect(ids("계약서에 서명해야 하는데 글자가 흐릿했어")).toContain("contract");
      expect(ids("이력서를 제출해야 하는데 내용이 비어 있었어")).toContain("resume");
      expect(ids("포트폴리오를 보여줘야 하는데 파일이 없었어")).toContain("portfolio");
      expect(ids("승인 알림을 기다리는데 계속 보류됐어")).toContain("approval");
      expect(ids("거절 메일을 받고 마음이 무거웠어")).toContain("rejection_email");
      expect(ids("캘린더 일정 초대가 와서 참석을 눌렀어")).toContain("calendar_invite");
    });

    test("matches the requested relationship-distance expansion symbols", () => {
      expect(ids("그 사람과 눈이 마주치는 꿈을 꿨어")).toContain("eye_contact");
      expect(ids("좋아하는 사람과 손을 잡고 걸었어")).toContain("holding_hands");
      expect(ids("둘이 데이트를 하며 같이 걸었어")).toContain("date");
      expect(ids("연인에게 이별 통보를 받는 꿈이었어")).toContain("breakup");
      expect(ids("상대가 바람피우는 장면을 봤어")).toContain("cheating");
      expect(ids("다툰 친구와 화해하는 꿈을 꿨어")).toContain("reconciliation");
      expect(ids("내가 계속 그 사람을 피하는 꿈이었어")).toContain("avoiding_someone");
      expect(ids("누군가를 오래 기다리는 꿈을 꿨어")).toContain("waiting_for_someone");
      expect(ids("가까이 다가오는 게 부담스러워서 거리를 뒀어")).toContain("personal_space");
      expect(ids("세 사람 사이에 끼인 삼각관계 꿈이었어")).toContain("love_triangle");
    });

    test("matches the requested core-emotion expansion symbols", () => {
      expect(ids("이유 없이 불안해서 계속 주변을 살폈어")).toContain("anxiety");
      expect(ids("사람들 사이에 있는데도 외로움이 크게 느껴졌어")).toContain("loneliness");
      expect(ids("곧 만날 생각에 설렘이 컸어")).toContain("excitement");
      expect(ids("무슨 상황인지 몰라서 혼란스러웠어")).toContain("confusion");
      expect(ids("기대했던 일이 안 돼서 실망했어")).toContain("disappointment");
      expect(ids("그래도 잘될 것 같은 희망이 남았어")).toContain("hope");
      expect(ids("너무 지쳐서 아무것도 할 수 없었어")).toContain("exhaustion");
      expect(ids("마음이 평온하고 조용한 꿈이었어")).toContain("peacefulness");
      expect(ids("그때 하지 못한 말이 후회로 남았어")).toContain("regret");
      expect(ids("아무 감정도 없이 멍한 상태였어")).toContain("numbness");
    });

    test("matches the requested digital-relationship expansion symbols", () => {
      expect(ids("프로필 사진이 갑자기 바뀌어 있었어")).toContain("profile_photo");
      expect(ids("대화 내용을 스크린샷으로 캡처하는 꿈이었어")).toContain("screenshot");
      expect(ids("내 게시물에 댓글이 계속 달렸어")).toContain("comment");
      expect(ids("좋아요 수가 갑자기 크게 늘었어")).toContain("like_count");
      expect(ids("상대에게 계정 차단을 당했어")).toContain("blocked_account");
      expect(ids("친구가 나를 언팔한 걸 봤어")).toContain("unfollow");
      expect(ids("메시지에 읽음 표시만 남고 답장이 없었어")).toContain("read_receipt");
      expect(ids("입력 중 표시가 계속 떠 있었어")).toContain("typing_indicator");
      expect(ids("삭제된 메시지가 보여서 마음이 불편했어")).toContain("deleted_message");
      expect(ids("내 게시물이 갑자기 퍼지는 꿈이었어")).toContain("viral_post");
    });

    test("matches the requested call-communication expansion symbols", () => {
      expect(ids("엄마에게 전화 통화를 하는 꿈이었어")).toContain("phone_call");
      expect(ids("부재중 전화가 여러 통 와 있었어")).toContain("missed_call");
      expect(ids("전화가 왔는데 내가 거절 버튼을 눌렀어")).toContain("declined_call");
      expect(ids("모르는 번호로 전화가 걸려왔어")).toContain("unknown_number");
      expect(ids("음성 메시지를 듣는데 목소리가 흐릿했어")).toContain("voice_message");
      expect(ids("연락처 이름이 이상하게 바뀌어 있었어")).toContain("contact_name");
      expect(ids("메시지를 잘못 보낸 채팅방이 회사 단톡방이었어")).toContain("wrong_chat_room");
      expect(ids("보내지 못한 메시지가 입력창에 남아 있었어")).toContain("unsent_message");
      expect(ids("알림 꺼둔 채팅방에 중요한 말이 와 있었어")).toContain("muted_chat");
      expect(ids("스팸 문자가 계속 도착하는 꿈을 꿨어")).toContain("spam_message");
    });

    test("matches the requested extended-family expansion symbols", () => {
      expect(ids("이모가 집에 찾아오는 꿈을 꿨어")).toContain("aunt");
      expect(ids("삼촌이 나에게 조언을 해줬어")).toContain("uncle");
      expect(ids("사촌과 가족 모임에서 만났어")).toContain("cousin");
      expect(ids("조카를 품에 안고 돌보는 꿈이었어")).toContain("niece_nephew");
      expect(ids("시어머니가 나를 지켜보는 꿈을 꿨어")).toContain("mother_in_law");
      expect(ids("장인이 식탁에서 말을 걸었어")).toContain("father_in_law");
      expect(ids("시댁 식구들이 모두 모여 있었어")).toContain("in_laws");
      expect(ids("새엄마가 내 방을 정리해주고 있었어")).toContain("step_parent");
      expect(ids("어린 시절의 나를 만나는 꿈이었어")).toContain("younger_self");
      expect(ids("가족 모임에 늦게 도착했어")).toContain("family_gathering");
    });

    test("matches the requested body-sensation expansion symbols", () => {
      expect(ids("머리가 아파서 아무 말도 못 했어")).toContain("headache");
      expect(ids("배가 아픈데 이유를 몰랐어")).toContain("stomachache");
      expect(ids("가슴이 답답해서 숨을 크게 쉬었어")).toContain("chest_pressure");
      expect(ids("숨이 막혀서 말을 잇지 못했어")).toContain("breathlessness");
      expect(ids("심장이 두근거려서 잠에서 깼어")).toContain("heartbeat");
      expect(ids("어지러워서 똑바로 서 있을 수 없었어")).toContain("dizziness");
      expect(ids("식은땀이 나서 옷이 젖어 있었어")).toContain("sweating");
      expect(ids("목이 말라서 물을 계속 찾았어")).toContain("thirst");
      expect(ids("배고파서 음식을 찾는 꿈이었어")).toContain("hunger");
      expect(ids("손이 떨려서 서명을 못 했어")).toContain("hand_tremor");
    });

    test("matches the requested public-evaluation expansion symbols", () => {
      expect(ids("무대 위에 올라가서 모두를 바라봤어")).toContain("stage");
      expect(ids("관객들이 나를 조용히 보고 있었어")).toContain("audience");
      expect(ids("마이크가 켜지지 않아서 목소리가 안 나왔어")).toContain("microphone");
      expect(ids("스포트라이트가 나에게만 비쳤어")).toContain("spotlight");
      expect(ids("큰 상을 받는 꿈을 꿨어")).toContain("award");
      expect(ids("트로피를 들고 무대에서 내려왔어")).toContain("trophy");
      expect(ids("수료증을 받았는데 이름이 틀려 있었어")).toContain("certificate");
      expect(ids("순위가 화면에 공개되는 꿈이었어")).toContain("ranking");
      expect(ids("점수판에 내 점수가 크게 보였어")).toContain("scoreboard");
      expect(ids("면접관들이 나를 바라보며 질문했어")).toContain("interview_panel");
    });

    test("matches the requested consumer-service expansion symbols", () => {
      expect(ids("계산원이 나에게 금액을 다시 말해줬어")).toContain("cashier");
      expect(ids("계산대 앞에서 줄을 서서 기다렸어")).toContain("checkout_counter");
      expect(ids("편의점에서 필요한 물건을 찾고 있었어")).toContain("convenience_store");
      expect(ids("장바구니에 물건이 가득 담겨 있었어")).toContain("shopping_cart");
      expect(ids("가격표 숫자가 계속 바뀌는 꿈이었어")).toContain("price_tag");
      expect(ids("사려던 물건이 품절이라고 적혀 있었어")).toContain("sold_out");
      expect(ids("반품 교환을 하려고 영수증을 들고 있었어")).toContain("return_exchange");
      expect(ids("쿠폰을 쓰려고 했는데 적용이 안 됐어")).toContain("coupon");
      expect(ids("멤버십 카드를 찾지 못해서 당황했어")).toContain("membership_card");
      expect(ids("영수증을 확인했는데 항목이 이상했어")).toContain("receipt_check");
    });
  });

  describe("synonym alias coverage", () => {
    const ids = (text: string) => findRuntimeSymbolMatches(text, { locale: "ko", limit: 6 }).map((m) => m.entryId);

    test("resolves common synonyms to their canonical symbol", () => {
      expect(ids("남편이 나왔어")).toContain("partner");
      expect(ids("아내가 나왔어")).toContain("partner");
      expect(ids("금전이 들어왔어")).toContain("money");
      expect(ids("폭포를 봤어")).toContain("water");
      expect(ids("호수가 펼쳐졌어")).toContain("water");
      expect(ids("쓰나미가 왔어")).toContain("flood");
      expect(ids("수능을 봤어")).toContain("exam");
      expect(ids("면접을 봤어")).toContain("job_interview");
      expect(ids("택시를 탔어")).toContain("taxi");
      expect(ids("혼례를 올렸어")).toContain("wedding");
      expect(ids("응급실에 갔어")).toContain("hospital");
      expect(ids("조상님이 나왔어")).toContain("ancestor");
      expect(ids("임종을 지켰어")).toContain("death");
    });
  });
});
