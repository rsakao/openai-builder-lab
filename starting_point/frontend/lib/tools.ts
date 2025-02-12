export const handleTool = async (toolName: string, parameters: any) => {
  if (toolName === 'googleMapsSearch') {
    const { query } = parameters;
    try {
      const response = await fetch('/api/search_location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Google Maps data:', error);
      return null;
    }
  }
  // ...他のツール処理...
}

export const tools = [
  {
    type: "function",
    function: {
      name: 'googleMapsSearch',
      description: 'Google Maps からホテルやランドマークの情報を検索します。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '検索クエリ (例: "東京 ホテル" や "パリ 観光名所")'
          }
        },
        required: ['query']
      }
    }
  }
]
