export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(503)
      .json({ error: "OPENAI_API_KEY has not been configured." });
  }

  try {
    const { topic, writing } = req.body || {};

    const prompt = `You are a supportive writing coach.

Review this writing sample.

Topic:
${topic}

Writing:
${writing}

Return ONLY valid JSON containing:

score: integer 1-100

categories:
Grammar, Vocabulary, Clarity, Sentence Structure, Overall Expression
(each integer 1-100)

corrected:
Corrected passage preserving the writer's meaning and voice.

mistakes:
Up to 6 objects containing:
original
correction
why

nextTarget:
One specific improvement for tomorrow.

Do not change the writer's voice.`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-5.6",
          input: prompt
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "AI request failed"
      });
    }

    return res.status(200).json(JSON.parse(data.output_text));
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Review failed"
    });
  }
}
