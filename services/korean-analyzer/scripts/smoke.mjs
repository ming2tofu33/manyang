// 배포된(또는 로컬) korean-analyzer를 점검한다. /health 와 /lemmatize 를 실제로 때려보고
// 내용 형태소가 돌아오는지 확인한다. 실패 시 비정상 종료(배포 게이트로 쓸 수 있게).
//   node scripts/smoke.mjs                                  # http://localhost:8080
//   node scripts/smoke.mjs https://xxx.up.railway.app       # 배포 URL
//   node scripts/smoke.mjs https://xxx.up.railway.app "내가 넣을 문장"
const base = (process.argv[2] ?? "http://localhost:8080").replace(/\/+$/, "");
const sample = process.argv[3] ?? "맑은 물에서 큰 구렁이가 올라갔어";

async function main() {
  const health = await fetch(`${base}/health`);
  const healthBody = await health.json();
  if (!health.ok || healthBody.status !== "ok") {
    throw new Error(`/health failed: ${health.status} ${JSON.stringify(healthBody)}`);
  }
  console.log(`✓ /health ok (kiwi ${healthBody.kiwi})`);

  const res = await fetch(`${base}/lemmatize`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: sample }),
  });
  const body = await res.json();
  if (!res.ok || !Array.isArray(body.lemmas)) {
    throw new Error(`/lemmatize failed: ${res.status} ${JSON.stringify(body)}`);
  }
  if (body.lemmas.length === 0) {
    throw new Error(`/lemmatize returned no lemmas for "${sample}"`);
  }
  console.log(`✓ /lemmatize ok`);
  console.log(`  text:   ${sample}`);
  console.log(`  lemmas: ${JSON.stringify(body.lemmas)}`);
  console.log(`\nAll checks passed against ${base}`);
}

main().catch((error) => {
  console.error(`✗ smoke check failed against ${base}`);
  console.error(error?.message ?? error);
  process.exit(1);
});
