
import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = "AIzaSyDde3Wm5q-54oBzx0GrmZwPloEHKkKZRSY"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

async function retryWithBackoff(fn: () => Promise<Response>, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fn()
      if (response.status !== 429) {
        return response
      }

      // If it's a 429, wait before retrying
      const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000 // Exponential backoff with jitter
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    } catch (error) {
      if (i === maxRetries - 1) throw error
    }
  }
  throw new Error("Max retries exceeded")
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, files } = await request.json()

    if (!title && !description && (!files || files.length === 0)) {
      return NextResponse.json({ error: "Please provide a title, description, or files" }, { status: 400 })
    }

    // Prepare context from files
    const fileContext = files
      ?.map((file: any) => `File: ${file.name}\nType: ${file.type}\nContent: ${file.content}`)
      .join("\n\n")

    const prompt = `You are an expert in creating educational VR experiments using Three.js and React Three Fiber. 

Create a detailed VR experiment specification based on this input:

Title: ${title || "Not provided"}
Description: ${description || "Not provided"}
${fileContext ? `\nSupporting Files:\n${fileContext}` : ""}

Please generate a JSON response with the following structure:
{
  "id": "unique-experiment-id",
  "title": "Experiment Title",
  "description": "Brief description of what the experiment demonstrates",
  "code": "// Three.js/React Three Fiber component code that creates the VR experiment",
  "parameters": [
    {
      "name": "parameterName",
      "label": "Human Readable Label",
      "type": "number|select|boolean",
      "min": 0,
      "max": 100,
      "default": 50,
      "step": 1,
      "options": ["option1", "option2"] // for select type only
    }
  ],
  "instructions": [
    "Step 1: Do something",
    "Step 2: Observe the result",
    "Step 3: Try different parameters"
  ]
}

Requirements:
1. The experiment should be educational and scientifically accurate
2. Include 3-6 adjustable parameters that affect the simulation
3. Use realistic physics where applicable
4. Make it interactive and engaging
5. Include proper lighting and materials
6. The code should be a complete React component using @react-three/fiber
7. Include comments explaining the physics/science concepts
8. Make sure the experiment is suitable for VR viewing

Focus on creating experiments related to:
- Physics (mechanics, waves, optics, thermodynamics)
- Chemistry (molecular structures, reactions, states of matter)
- Biology (cell structures, ecosystems, anatomy)
- Mathematics (geometry, calculus, statistics)
- Engineering (structures, circuits, mechanics)

Generate only valid JSON without any markdown formatting or additional text.`

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
            maxOutputTokens: 2048,
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

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Gemini API Error:", errorData)

      if (response.status === 429) {
        const errorObj = JSON.parse(errorData)
        const retryAfter = errorObj.error?.details?.find((d: any) => d["@type"]?.includes("RetryInfo"))?.retryDelay

        return NextResponse.json(
          {
            error: "API quota exceeded. Please try again in a few minutes.",
            retryAfter: retryAfter || "60s",
            quotaInfo:
              "You've reached the free tier limits. Consider upgrading your Gemini API plan for higher quotas.",
          },
          { status: 429 },
        )
      }

      return NextResponse.json({ error: "Failed to generate experiment" }, { status: 500 })
    }

    const data = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json({ error: "No experiment generated" }, { status: 500 })
    }

    const generatedText = data.candidates[0].content.parts[0].text

    try {
      // Clean up the response to extract JSON
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response")
      }

      const experimentData = JSON.parse(jsonMatch[0])

      // Validate the structure
      if (!experimentData.id || !experimentData.title || !experimentData.parameters) {
        throw new Error("Invalid experiment structure")
      }

      // Add a unique ID if not provided
      if (!experimentData.id) {
        experimentData.id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      return NextResponse.json(experimentData)
    } catch (parseError) {
      console.error("Failed to parse generated experiment:", parseError)

      // Fallback: create a basic experiment structure
      const fallbackExperiment = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: title || "Custom Physics Simulation",
        description: description || "An AI-generated physics experiment exploring fundamental concepts.",
        code: `
// AI-Generated VR Experiment Component
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Box, Text } from '@react-three/drei'

export function CustomExperiment({ parameters }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * (parameters.speed || 1)
    }
  })
  
  return (
    <group>
      <Sphere ref={meshRef} args={[parameters.size || 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color={parameters.color || '#3498db'} />
      </Sphere>
      <Text position={[0, 2, 0]} fontSize={0.5} color="white" anchorX="center">
        ${title || "Custom Experiment"}
      </Text>
    </group>
  )
}`,
        parameters: [
          {
            name: "size",
            label: "Object Size",
            type: "number",
            min: 0.5,
            max: 3,
            default: 1,
            step: 0.1,
          },
          {
            name: "speed",
            label: "Rotation Speed",
            type: "number",
            min: 0,
            max: 5,
            default: 1,
            step: 0.1,
          },
          {
            name: "color",
            label: "Color",
            type: "select",
            options: ["#3498db", "#e74c3c", "#2ecc71", "#f39c12"],
            default: "#3498db",
          },
        ],
        instructions: [
          "Adjust the object size using the size parameter",
          "Change the rotation speed to see different motion",
          "Try different colors to customize the appearance",
          "Observe how the parameters affect the simulation",
        ],
      }

      return NextResponse.json(fallbackExperiment)
    }
  } catch (error) {
    console.error("Generate Experiment Error:", error)

    if (error instanceof Error && error.message.includes("429")) {
      return NextResponse.json(
        {
          error: "API quota exceeded. Please try again later.",
          quotaInfo: "The free tier has daily and per-minute limits. Try again in a few minutes.",
        },
        { status: 429 },
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
