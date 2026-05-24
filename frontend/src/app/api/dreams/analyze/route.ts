import { analyzeDream } from "@manyang/backend";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const analysis = analyzeDream(body);

    return Response.json(analysis);
  } catch (error) {
    if (error instanceof Error && error.message === "dreamText is required") {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ error: "failed to analyze dream" }, { status: 500 });
  }
}
