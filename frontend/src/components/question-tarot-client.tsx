"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  DailyTarotFanDeck,
  DailyTarotPendingResult,
  DailyTarotResult,
  DailyTarotRevealPanel,
  tarotCardRevealMs,
} from "@/components/daily-tarot-client";
import {
  createDailyTarotOptions,
  createDailyTarotUserIdentityKey,
  getOrCreateDailyTarotGuestIdentityFromBrowser,
  pendingDailyTarotDrawIdentityKey,
  saveDailyTarotReadingToBrowser,
  type DailyTarotCardSelection,
  type DailyTarotOption,
  type DailyTarotQuestionContext,
  type DailyTarotReading,
} from "@/lib/daily-tarot";
import { cn } from "@/lib/styles";
import {
  createCustomTarotQuestionPrompt,
  maxCustomTarotQuestionLength,
  tarotQuestionStates,
  type TarotQuestionPrompt,
  type TarotQuestionState,
} from "@/lib/tarot-question-prompts";
import { getTarotCardById } from "@/lib/tarot-cards";

type QuestionTarotClientProps = {
  appDate: string;
  initialReading: DailyTarotReading | null;
  initialUserId?: string | null;
};

type QuestionTarotStep =
  | "state-select"
  | "question-select"
  | "draw"
  | "revealing"
  | "generating"
  | "result"
  | "limited"
  | "error";

type QuestionTarotRevealState = {
  options: DailyTarotOption[];
  selectedOptionId: string;
  selectedOptionIndex: number;
  selection: DailyTarotCardSelection;
};

function createInitialQuestionDrawIdentityKey(initialUserId: string | null | undefined): string {
  return initialUserId ? createDailyTarotUserIdentityKey(initialUserId) : pendingDailyTarotDrawIdentityKey;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createQuestionContext(
  state: TarotQuestionState,
  question: TarotQuestionPrompt,
): DailyTarotQuestionContext {
  return {
    stateKey: state.key,
    stateLabel: state.label,
    questionKey: question.key,
    questionText: question.text,
  };
}

function createQuestionDrawIdentity(
  baseIdentity: string,
  state: TarotQuestionState,
  question: TarotQuestionPrompt,
): string {
  return `${baseIdentity}:question:${state.key}:${question.key}`;
}

function resolveSelection(option: DailyTarotOption): DailyTarotCardSelection | null {
  const card = getTarotCardById(option.cardId);

  return card
    ? {
        position: "today",
        card,
        orientation: option.orientation,
      }
    : null;
}

export function QuestionTarotClient({
  appDate,
  initialReading,
  initialUserId = null,
}: QuestionTarotClientProps) {
  const [step, setStep] = useState<QuestionTarotStep>(initialReading ? "result" : "state-select");
  const [selectedState, setSelectedState] = useState<TarotQuestionState | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<TarotQuestionPrompt | null>(null);
  const [customQuestionText, setCustomQuestionText] = useState("");
  const [reading, setReading] = useState<DailyTarotReading | null>(initialReading);
  const [revealState, setRevealState] = useState<QuestionTarotRevealState | null>(null);
  const [pendingSelections, setPendingSelections] = useState<DailyTarotCardSelection[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [drawIdentityKey, setDrawIdentityKey] = useState(() => createInitialQuestionDrawIdentityKey(initialUserId));
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

  const questionOptions = useMemo(() => {
    if (!selectedState || !selectedQuestion) {
      return [];
    }

    return createDailyTarotOptions(appDate, {
      drawIdentityKey: createQuestionDrawIdentity(drawIdentityKey, selectedState, selectedQuestion),
    });
  }, [appDate, drawIdentityKey, selectedQuestion, selectedState]);
  const customQuestion = useMemo(
    () => createCustomTarotQuestionPrompt(customQuestionText),
    [customQuestionText],
  );

  function handleSelectState(state: TarotQuestionState) {
    setSelectedState(state);
    setSelectedQuestion(null);
    setCustomQuestionText("");
    setErrorMessage(null);
    setStep("question-select");
  }

  function handleSelectQuestion(question: TarotQuestionPrompt) {
    setDrawIdentityKey(
      initialUserId ? createDailyTarotUserIdentityKey(initialUserId) : getOrCreateDailyTarotGuestIdentityFromBrowser(),
    );
    setSelectedQuestion(question);
    setErrorMessage(null);
    setStep("draw");
  }

  function handleSubmitCustomQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customQuestion) {
      setErrorMessage("질문을 조금 더 짧고 분명하게 적어주세요.");
      return;
    }

    handleSelectQuestion(customQuestion);
  }

  async function submitQuestionReading(selection: DailyTarotCardSelection) {
    if (!selectedState || !selectedQuestion) {
      setStep("error");
      setErrorMessage("질문을 다시 선택해 주세요.");
      return;
    }

    const questionContext = createQuestionContext(selectedState, selectedQuestion);

    try {
      const response = await fetch("/api/tarot/readings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          appDate,
          spread: "question_one_card",
          selectedAt: new Date().toISOString(),
          questionContext,
          unlockMethod: "daily_free",
          selections: [
            {
              cardId: selection.card.id,
              orientation: selection.orientation,
              position: "today",
            },
          ],
        }),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        if (isRecord(payload) && payload.reason === "rewarded_ad_required") {
          setStep("limited");
          return;
        }

        setErrorMessage("지금은 질문 타로를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.");
        setStep("error");
        return;
      }

      const nextReading = payload as DailyTarotReading;

      saveDailyTarotReadingToBrowser(nextReading);
      setReading(nextReading);
      setStep("result");
    } catch {
      setErrorMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
      setStep("error");
    }
  }

  function handleSelectCard(option: DailyTarotOption, index: number) {
    if (step !== "draw") {
      return;
    }

    const selection = resolveSelection(option);

    if (!selection) {
      setErrorMessage("선택한 카드를 확인할 수 없어요.");
      setStep("error");
      return;
    }

    setPendingSelections([selection]);
    setRevealState({
      options: questionOptions,
      selectedOptionId: option.id,
      selectedOptionIndex: index,
      selection,
    });
    setStep("revealing");

    revealTimerRef.current = setTimeout(() => {
      setStep("generating");
      void submitQuestionReading(selection);
    }, tarotCardRevealMs);
  }

  function resetToQuestions() {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
    }

    setReading(null);
    setRevealState(null);
    setPendingSelections([]);
    setErrorMessage(null);
    setStep(selectedState ? "question-select" : "state-select");
  }

  if (step === "result" && reading) {
    return (
      <div data-question-tarot-state="result">
        <DailyTarotResult reading={reading} />
      </div>
    );
  }

  if (step === "revealing" && revealState) {
    return (
      <div data-question-tarot-state="revealing">
        <DailyTarotRevealPanel {...revealState} />
      </div>
    );
  }

  if (step === "generating") {
    return (
      <div data-question-tarot-state="generating">
        <DailyTarotPendingResult selections={pendingSelections} />
      </div>
    );
  }

  return (
    <section
      data-question-tarot-state={step}
      className="mx-auto flex w-full max-w-[28rem] flex-1 flex-col px-3 py-4 text-[#fff3d7]"
    >
      {step === "state-select" ? (
        <div className="space-y-3">
          <div className="space-y-1.5 text-center">
            <p className="text-[13px] font-bold text-[#f4b65f]">질문 타로</p>
            <h2 className="text-[20px] font-extrabold leading-7 text-[#ffe7b5]">지금 가장 궁금한 걸 골라주세요</h2>
          </div>
          <div className="grid gap-2">
            {tarotQuestionStates.map((state) => (
              <button
                key={state.key}
                type="button"
                data-question-tarot-state-option={state.key}
                onClick={() => handleSelectState(state)}
                className="rounded-[0.9rem] border border-[#b98255]/36 bg-[#05040b]/52 px-4 py-3 text-left text-[14px] font-bold text-[#fff3d7] shadow-[0_12px_26px_rgba(0,0,0,0.2)] transition hover:border-[#ffd08a]/70 hover:bg-[#140d24]/78 focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
              >
                {state.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "question-select" && selectedState ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedState(null);
                setSelectedQuestion(null);
                setCustomQuestionText("");
                setStep("state-select");
              }}
              className="rounded-full border border-[#b98255]/40 px-3 py-1.5 text-[12px] font-bold text-[#f2c27d] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
            >
              이전
            </button>
            <p className="text-right text-[12px] font-bold text-[#f4b65f]">{selectedState.label}</p>
          </div>
          <form
            onSubmit={handleSubmitCustomQuestion}
            className="space-y-2 rounded-[0.9rem] border border-[#b98255]/30 bg-[#05040b]/42 p-3"
          >
            <label htmlFor="question-tarot-custom-question" className="block text-[13px] font-extrabold text-[#ffe7b5]">
              직접 질문하기
            </label>
            <textarea
              id="question-tarot-custom-question"
              data-question-tarot-custom-question
              value={customQuestionText}
              onChange={(event) => {
                setCustomQuestionText(event.target.value);
                setErrorMessage(null);
              }}
              maxLength={maxCustomTarotQuestionLength}
              rows={2}
              placeholder="예: 그 사람은 지금 어떤 마음일까?"
              className="min-h-[4.25rem] w-full resize-none rounded-[0.75rem] border border-[#b98255]/36 bg-[#080711]/82 px-3 py-2 text-[14px] font-bold leading-6 text-[#fff3d7] outline-none placeholder:text-[#8f755e] focus:border-[#ffd08a]/70 focus:ring-2 focus:ring-[#d799ff]/70"
            />
            {errorMessage ? <p className="text-[12px] font-bold leading-5 text-[#ffb59f]">{errorMessage}</p> : null}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold text-[#9f846b]">
                {customQuestionText.length}/{maxCustomTarotQuestionLength}
              </p>
              <button
                type="submit"
                data-question-tarot-custom-submit
                disabled={!customQuestion}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13px] font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
                  customQuestion
                    ? "border-[#f2c27d]/55 bg-[#f2c27d]/12 text-[#ffe7b5] hover:border-[#ffd08a]/80"
                    : "cursor-not-allowed border-[#6d5948]/35 text-[#7d6854]",
                )}
              >
                이 질문으로 보기
              </button>
            </div>
          </form>
          <div className="space-y-2">
            <p className="px-1 text-[12px] font-bold text-[#c7a98a]">또는 아래 질문에서 골라보세요</p>
            <div className="grid gap-2">
              {selectedState.questions.map((question) => (
                <button
                  key={question.key}
                  type="button"
                  data-question-tarot-question-option={question.key}
                  onClick={() => handleSelectQuestion(question)}
                  className="rounded-[0.9rem] border border-[#b98255]/36 bg-[#05040b]/52 px-4 py-3 text-left text-[14px] font-bold leading-6 text-[#fff3d7] shadow-[0_12px_26px_rgba(0,0,0,0.2)] transition hover:border-[#ffd08a]/70 hover:bg-[#140d24]/78 focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
                >
                  {question.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {step === "draw" && selectedState && selectedQuestion ? (
        <div className="text-center">
          <p className="mx-auto max-w-[21rem] rounded-[0.9rem] border border-[#f2c27d]/24 bg-[#f2c27d]/8 px-4 py-3 text-[13px] font-bold leading-6 text-[#ffe7b5]">
            질문: {selectedQuestion.text}
          </p>
          <DailyTarotFanDeck
            options={questionOptions}
            onSelect={handleSelectCard}
            disabled={drawIdentityKey === pendingDailyTarotDrawIdentityKey}
          />
        </div>
      ) : null}

      {step === "limited" ? (
        <div className="mt-8 rounded-[1rem] border border-[#b98255]/36 bg-[#05040b]/58 p-4 text-center shadow-[0_14px_32px_rgba(0,0,0,0.22)]">
          <p className="text-[15px] font-extrabold text-[#ffe7b5]">오늘의 질문 타로는 이미 열었어요</p>
          <p className="mt-2 text-[13px] leading-6 text-[#c7a98a]">
            다음 단계에서는 광고를 보고 한 번 더 볼 수 있게 연결할 예정이에요.
          </p>
          <button
            type="button"
            onClick={resetToQuestions}
            className="mt-4 rounded-full border border-[#f2c27d]/45 px-4 py-2 text-[13px] font-bold text-[#f2c27d] focus:outline-none focus:ring-2 focus:ring-[#d799ff]"
          >
            다른 질문 보기
          </button>
        </div>
      ) : null}

      {step === "error" ? (
        <div className="mt-8 rounded-[1rem] border border-[#b98255]/36 bg-[#05040b]/58 p-4 text-center shadow-[0_14px_32px_rgba(0,0,0,0.22)]">
          <p className="text-[15px] font-extrabold text-[#ffe7b5]">{errorMessage ?? "질문 타로를 불러오지 못했어요."}</p>
          <button
            type="button"
            onClick={resetToQuestions}
            className={cn(
              "mt-4 rounded-full border border-[#f2c27d]/45 px-4 py-2 text-[13px] font-bold text-[#f2c27d]",
              "focus:outline-none focus:ring-2 focus:ring-[#d799ff]",
            )}
          >
            다시 고르기
          </button>
        </div>
      ) : null}
    </section>
  );
}
