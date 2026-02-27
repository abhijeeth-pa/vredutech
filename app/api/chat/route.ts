import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = "yourapikey"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"

async function retryWithBackoff(fn: () => Promise<Response>, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[v0] Chat API attempt ${i + 1}/${maxRetries}`)
      const response = await fn()

      console.log(`[v0] Response status: ${response.status}`)

      // Don't retry on client errors (4xx except 429) or success
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response
      }

      // Only retry on 429 (rate limit) or 5xx (server errors)
      if (response.status === 429 || response.status >= 500) {
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000
        console.log(`[v0] Retrying after ${waitTime}ms due to status ${response.status}`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        continue
      }

      return response
    } catch (error) {
      console.log(`[v0] Network error on attempt ${i + 1}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      if (i === maxRetries - 1) {
        throw lastError
      }

      // Wait before retrying network errors
      const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000
      console.log(`[v0] Retrying after ${waitTime}ms due to network error`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  throw lastError || new Error("Max retries exceeded")
}

export async function POST(request: NextRequest) {
  try {
    const { question, context, responseMode } = await request.json()

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Prepare the prompt based on response mode
    let systemPrompt = ""
    switch (responseMode) {
      case "short":
        systemPrompt = "Provide a concise, direct answer in 1-2 sentences. Focus on the key point only."
        break
      case "intuitive":
        systemPrompt =
          "Provide an intuitive explanation that breaks down complex concepts into easy-to-understand terms. Use analogies and examples where helpful. Keep it conversational and engaging."
        break
      case "essay":
        systemPrompt =
          "Provide a comprehensive, detailed essay-style response. Include background information, detailed explanations, examples, and implications. Structure your response with clear paragraphs."
        break
      default:
        systemPrompt = "Provide a helpful and informative answer."
    }

    const prompt = `${systemPrompt}

Context from uploaded study materials:
${context || "No study materials provided."}

Student Question: ${question}

Please answer the question based on the provided context. If the context doesn't contain relevant information, provide a general educational response and mention that the answer is based on general knowledge rather than the uploaded materials.`

    console.log(`[v0] Making Gemini API call with prompt length: ${prompt.length}`)

    const response = await retryWithBackoff(() =>
      fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: responseMode === "essay" ? 1024 : responseMode === "intuitive" ? 512 : 256,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      }),
    )

    console.log(`[v0] Final response status: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`[v0] Gemini API Error (${response.status}):`, errorData)

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: "API quota exceeded. Please try again in a few minutes.",
            quotaInfo: "You've reached the free tier limits. The chat will be available again shortly.",
          },
          { status: 429 },
        )
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "API authentication failed. Please check the API key." }, { status: 401 })
      }

      return NextResponse.json(
        {
          error: `AI service error (${response.status}). Please try again.`,
          details: errorData,
        },
        { status: 500 },
      )
    }

    const data = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json({ error: "No response generated" }, { status: 500 })
    }

    const answer = data.candidates[0].content.parts[0].text

    return NextResponse.json({ answer })
  } catch (error) {
    console.error("[v0] Chat API Error:", error)

    if (error instanceof Error) {
      if (error.message.includes("429") || error.message.includes("quota")) {
        return NextResponse.json(
          {
            error: "API quota exceeded. Please try again later.",
            quotaInfo: "The free tier has daily and per-minute limits.",
          },
          { status: 429 },
        )
      }

      if (error.message.includes("fetch")) {
        return NextResponse.json(
          { error: "Network error. Please check your connection and try again." },
          { status: 503 },
        )
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error. Please try again.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
