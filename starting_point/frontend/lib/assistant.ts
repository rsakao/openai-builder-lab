import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { SYSTEM_PROMPT } from './constants'
import useConversationStore from '@/stores/useConversationStore'
import { handleTool, tools } from './tools'

export interface MessageItem {
  type: 'message'
  role: 'user' | 'assistant' | 'system'
  content: string
  isError?: boolean
}

export interface FunctionCallItem {
  type: 'function_call'
  status: 'in_progress' | 'completed' | 'failed'
  id: string
  name: string
  arguments: string
  parsedArguments: any
  output: string | null
}

export type Item = MessageItem | FunctionCallItem

export const handleTurn = async (): Promise<void> => {
  const {
    chatMessages,
    conversationItems,
    setChatMessages,
    setConversationItems
  } = useConversationStore.getState()

  const allConversationItems: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    ...conversationItems
  ]

  try {
    const response = await fetch('/api/get_response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        messages: allConversationItems,
        tools: tools, // ツール定義を追加
        tool_choice: 'auto' // ツールの選択をAIに任せる
      })
    })

    if (!response.ok && response.status !== 500) {  // 500エラーは特別に処理する
      console.error(`Error: ${response.statusText}`)
      return
    }

    const data = await response.json()
    
    // エラーレスポンスの場合
    if (data.type === 'message' && data.role === 'assistant' && data.content.includes('申し訳ありません')) {
      const errorMessage: MessageItem = {
        ...data,
        isError: true
      }
      chatMessages.push(errorMessage)
      setChatMessages([...chatMessages])
      conversationItems.push(errorMessage)
      setConversationItems([...conversationItems])
      return
    }

    // エラーレスポンスの場合でもメッセージとして表示
    if (data.type === 'message' && data.role === 'assistant') {
      chatMessages.push(data)
      setChatMessages([...chatMessages])
      conversationItems.push(data)
      setConversationItems([...conversationItems])
      return
    }
    
    // function_call が含まれている場合、ツールを実行
    if (data.function_call) {
      const functionCall: FunctionCallItem = {
        type: 'function_call',
        status: 'in_progress',
        id: Date.now().toString(),
        name: data.function_call.name,
        arguments: data.function_call.arguments,
        parsedArguments: JSON.parse(data.function_call.arguments),
        output: null
      }

      // 会話履歴に関数呼び出しを追加
      chatMessages.push(functionCall)
      setChatMessages([...chatMessages])
      
      // ツールを実行
      const result = await handleTool(functionCall.name, functionCall.parsedArguments)
      
      // 実行結果を更新
      functionCall.status = 'completed'
      functionCall.output = JSON.stringify(result)
      setChatMessages([...chatMessages])

      // 関数の実行結果をアシスタントに送信
      const functionResultMessage: ChatCompletionMessageParam = {
        role: 'function',
        name: functionCall.name,
        content: functionCall.output
      }
      
      conversationItems.push(functionResultMessage)
      
      // アシスタントからの新しい応答を取得
      return await handleTurn()
    }

    // 通常のメッセージの場合
    chatMessages.push(data)
    setChatMessages([...chatMessages])
    conversationItems.push(data)
    setConversationItems([...conversationItems])

  } catch (error) {
    console.error('Error processing messages:', error)
  }
}
