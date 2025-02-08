import { OpenAI } from 'openai'

const openai = new OpenAI()

export async function POST(request: Request) {
  const { messages } = await request.json()

  console.log('Incoming messages', messages)

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      store: true,
    })

    console.log('Completion', completion)
    const assistantMessage = completion.choices[0].message

    return new Response(JSON.stringify(assistantMessage))
  } catch (error: any) {
    console.error('Error in POST handler:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    })
  }
}
