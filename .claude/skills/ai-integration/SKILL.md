# AI Integration Skill

Patterns for integrating Claude API into applications. Reference this when building AI-powered features like chat, content generation, or adaptive systems.

## Setup

### Environment

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### Client Setup

```typescript
// src/lib/ai.ts
import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Default model for different use cases
export const MODELS = {
  fast: 'claude-3-5-haiku-20241022',    // Quick responses, simple tasks
  balanced: 'claude-sonnet-4-20250514', // Good balance
  powerful: 'claude-sonnet-4-20250514', // Complex reasoning
} as const
```

---

## Chat Patterns

### Basic Chat Completion

```typescript
import { anthropic, MODELS } from '@/lib/ai'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function chat(messages: Message[], systemPrompt?: string) {
  const response = await anthropic.messages.create({
    model: MODELS.balanced,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })
  
  return response.content[0].type === 'text' 
    ? response.content[0].text 
    : ''
}
```

### Streaming Chat

```typescript
export async function* streamChat(messages: Message[], systemPrompt?: string) {
  const stream = await anthropic.messages.stream({
    model: MODELS.balanced,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })
  
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

// Usage in API route
export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of streamChat(messages)) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
```

---

## Structured Output

### JSON Mode with Schema

```typescript
import { z } from 'zod'

const WorkoutSchema = z.object({
  title: z.string(),
  duration: z.number(),
  warmup: z.array(z.object({
    name: z.string(),
    duration: z.number(),
    instructions: z.string(),
  })),
  mainSet: z.array(z.object({
    name: z.string(),
    sets: z.number().optional(),
    reps: z.string().optional(),
    duration: z.number().optional(),
    intensity: z.string(),
    instructions: z.string(),
  })),
  cooldown: z.array(z.object({
    name: z.string(),
    duration: z.number(),
    instructions: z.string(),
  })),
})

type Workout = z.infer<typeof WorkoutSchema>

export async function generateWorkout(params: WorkoutParams): Promise<Workout> {
  const response = await anthropic.messages.create({
    model: MODELS.balanced,
    max_tokens: 2048,
    system: `You are an expert endurance coach. Generate workouts as JSON only.
    
    Output format: ${JSON.stringify(WorkoutSchema.shape, null, 2)}
    
    Respond with valid JSON only, no markdown or explanation.`,
    messages: [{
      role: 'user',
      content: `Generate a ${params.sport} workout:
      - Duration: ${params.duration} minutes
      - Type: ${params.workoutType}
      - Athlete level: ${params.level}
      - Focus: ${params.focus}`,
    }],
  })
  
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  // Parse and validate
  const parsed = JSON.parse(text)
  return WorkoutSchema.parse(parsed)
}
```

---

## Tool Use (Function Calling)

### Defining Tools

```typescript
const tools = [
  {
    name: 'move_workout',
    description: 'Move a workout to a different date',
    input_schema: {
      type: 'object',
      properties: {
        workoutId: { type: 'string', description: 'ID of the workout to move' },
        newDate: { type: 'string', description: 'New date in ISO format' },
      },
      required: ['workoutId', 'newDate'],
    },
  },
  {
    name: 'add_rest_day',
    description: 'Add a rest day to the schedule',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date for rest day in ISO format' },
        reason: { type: 'string', description: 'Reason for rest day' },
      },
      required: ['date'],
    },
  },
  {
    name: 'modify_intensity',
    description: 'Adjust workout intensity up or down',
    input_schema: {
      type: 'object',
      properties: {
        workoutId: { type: 'string' },
        adjustment: { type: 'string', enum: ['easier', 'harder'] },
      },
      required: ['workoutId', 'adjustment'],
    },
  },
]
```

### Handling Tool Calls

```typescript
interface ToolResult {
  tool: string
  result: unknown
}

export async function coachChat(
  messages: Message[],
  context: CoachContext,
  executeToolFn: (name: string, input: unknown) => Promise<unknown>
): Promise<{ response: string; toolResults: ToolResult[] }> {
  const toolResults: ToolResult[] = []
  
  const response = await anthropic.messages.create({
    model: MODELS.balanced,
    max_tokens: 1024,
    system: buildCoachSystemPrompt(context),
    messages,
    tools,
  })
  
  // Check if model wants to use tools
  for (const block of response.content) {
    if (block.type === 'tool_use') {
      const result = await executeToolFn(block.name, block.input)
      toolResults.push({ tool: block.name, result })
      
      // Continue conversation with tool result
      const followUp = await anthropic.messages.create({
        model: MODELS.balanced,
        max_tokens: 1024,
        system: buildCoachSystemPrompt(context),
        messages: [
          ...messages,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            }],
          },
        ],
        tools,
      })
      
      const text = followUp.content.find(b => b.type === 'text')
      return {
        response: text?.text ?? '',
        toolResults,
      }
    }
  }
  
  const text = response.content.find(b => b.type === 'text')
  return {
    response: text?.text ?? '',
    toolResults,
  }
}
```

---

## Prompt Engineering

### System Prompt Structure

```typescript
function buildCoachSystemPrompt(context: CoachContext): string {
  return `You are an AI coach for Training Plan AI, helping athletes train smarter.

## Your Personality
- Supportive and encouraging, but honest
- Concise — athletes are busy
- Action-oriented — suggest specific next steps

## Context
Athlete: ${context.athleteName}
Current plan: ${context.planSummary}
This week's workouts: ${formatWeeklySchedule(context.schedule)}
Recent performance: ${formatRecentWorkouts(context.recentWorkouts)}
${context.hrvData ? `Recovery status: ${context.hrvData}` : ''}

## Available Actions
You can help athletes by:
- move_workout: Reschedule workouts
- add_rest_day: Insert rest when needed
- modify_intensity: Make workouts easier or harder
- Explain the purpose of any workout
- Answer training questions

## Guidelines
- If suggesting rest, explain why recovery matters
- When adjusting intensity, consider their recent RPE feedback
- Don't recommend skipping more than 2 consecutive days
- Encourage consistency over perfection

Respond conversationally. Use tools when the athlete asks to make changes.`
}
```

### Prompt Templates

```typescript
// Structured prompts for consistent output
const PROMPTS = {
  generateWorkout: (params: WorkoutParams) => ({
    system: `You are an expert ${params.sport} coach creating personalized workouts.
Follow the constraints exactly. Output valid JSON only.`,
    user: `Generate a ${params.sport} workout:

Athlete Profile:
- Level: ${params.level}
- Recent fitness: ${params.fitnessContext}

Workout Requirements:
- Duration: ${params.duration} minutes
- Type: ${params.workoutType}
- Target zone: Zone ${params.targetZone}
- Focus: ${params.focus}

Constraints:
- Include warm-up (10-15% of time)
- Include main set (70-80% of time)
- Include cool-down (10-15% of time)
${params.avoidList ? `- Avoid: ${params.avoidList.join(', ')}` : ''}

Output the workout as JSON matching the schema.`,
  }),

  explainWorkout: (workout: Workout) => ({
    system: `You are a knowledgeable coach explaining the purpose of workouts.
Be concise but educational. Help the athlete understand WHY.`,
    user: `Explain this workout to an athlete:

${JSON.stringify(workout, null, 2)}

Explain:
1. What this workout develops (1-2 sentences)
2. How it fits in their training (1-2 sentences)
3. Key execution tips (2-3 bullet points)`,
  }),
}
```

---

## Rate Limiting & Error Handling

### Retry Logic

```typescript
import { RateLimitError, APIError } from '@anthropic-ai/sdk'

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (error instanceof RateLimitError) {
        // Wait with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      if (error instanceof APIError && error.status >= 500) {
        // Server error — retry
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Other errors — don't retry
      throw error
    }
  }
  
  throw lastError
}

// Usage
const response = await withRetry(() => 
  anthropic.messages.create({ ... })
)
```

### Token Budget Management

```typescript
// Rough token estimation (4 chars ≈ 1 token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function trimContext(messages: Message[], maxTokens: number): Message[] {
  let total = 0
  const result: Message[] = []
  
  // Always keep first (system context) and last (current question)
  const first = messages[0]
  const last = messages[messages.length - 1]
  total += estimateTokens(first.content) + estimateTokens(last.content)
  
  // Add middle messages from most recent
  for (let i = messages.length - 2; i > 0; i--) {
    const tokens = estimateTokens(messages[i].content)
    if (total + tokens > maxTokens) break
    result.unshift(messages[i])
    total += tokens
  }
  
  return [first, ...result, last]
}
```

---

## Cost Control

### Caching

```typescript
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const CACHE_TTL = 60 * 60 * 24 // 24 hours

async function cachedGenerate(
  cacheKey: string,
  generateFn: () => Promise<string>
): Promise<string> {
  // Check cache
  const cached = await redis.get<string>(cacheKey)
  if (cached) return cached
  
  // Generate and cache
  const result = await generateFn()
  await redis.set(cacheKey, result, { ex: CACHE_TTL })
  
  return result
}

// Usage
const workout = await cachedGenerate(
  `workout:${sport}:${type}:${duration}:${level}`,
  () => generateWorkout(params)
)
```

### Model Selection by Task

```typescript
// Use cheaper models for simple tasks
const MODEL_BY_TASK = {
  // Simple, fast tasks
  'classify-intent': MODELS.fast,
  'extract-entities': MODELS.fast,
  'simple-response': MODELS.fast,
  
  // Balanced tasks
  'chat-response': MODELS.balanced,
  'workout-generation': MODELS.balanced,
  
  // Complex reasoning
  'plan-adaptation': MODELS.powerful,
  'multi-sport-scheduling': MODELS.powerful,
}
```

---

## Testing AI Features

```typescript
// tests/ai/workout-generation.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateWorkout } from '@/lib/ai/workout'

// Mock the API for deterministic tests
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            title: 'Test Workout',
            duration: 45,
            warmup: [{ name: 'Jog', duration: 5, instructions: 'Easy pace' }],
            mainSet: [{ name: 'Intervals', sets: 4, reps: '400m', intensity: 'hard', instructions: 'Go fast' }],
            cooldown: [{ name: 'Walk', duration: 5, instructions: 'Cool down' }],
          }),
        }],
      }),
    },
  })),
}))

describe('generateWorkout', () => {
  it('generates valid workout structure', async () => {
    const workout = await generateWorkout({
      sport: 'RUNNING',
      duration: 45,
      workoutType: 'intervals',
      level: 'INTERMEDIATE',
    })
    
    expect(workout.title).toBeDefined()
    expect(workout.warmup.length).toBeGreaterThan(0)
    expect(workout.mainSet.length).toBeGreaterThan(0)
    expect(workout.cooldown.length).toBeGreaterThan(0)
  })
})
```

---

## Security

1. **Never expose API key** to client — all AI calls through server
2. **Validate all inputs** before sending to AI
3. **Sanitize AI outputs** before displaying to users
4. **Rate limit endpoints** that call AI
5. **Log usage** for monitoring and cost tracking
6. **Set max_tokens** to prevent runaway costs
