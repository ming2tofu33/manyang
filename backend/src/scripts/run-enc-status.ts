import { formatEncyclopediaReviewStatusMarkdown, getEncyclopediaReviewStatus } from "../services/encyclopedia-review-status";

/** 이중문화 재작성 진행 상태를 출력한다. 사용: npm --prefix backend run enc:status */
console.log(formatEncyclopediaReviewStatusMarkdown(getEncyclopediaReviewStatus()));
