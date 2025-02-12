import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json()

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: [{
        type: "function",
        function: {
          name: tools[0].function.name,
          description: tools[0].function.description,
          parameters: tools[0].function.parameters
        }
      }],
      tool_choice: "auto"
    })

    const firstChoice = response.choices[0]
    const responseData = firstChoice.message.tool_calls && firstChoice.message.tool_calls.length > 0
      ? {
          function_call: {
            name: firstChoice.message.tool_calls[0].function.name,
            arguments: firstChoice.message.tool_calls[0].function.arguments
          }
        }
      : {
          type: 'message',
          role: 'assistant',
          content: firstChoice.message.content
        }

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error:', error)
    
    // トークン制限エラーの検出
    if (error?.error?.code === 'context_length_exceeded') {
      return new Response(JSON.stringify({
        type: 'message',
        role: 'assistant',
        content: '⚠️ エラー: トークンの制限を超えてしまいました。\n\nしばらく時間をおいてから再度実行してください。'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
