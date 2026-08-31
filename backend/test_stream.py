import asyncio
from app.services.llm_service import stream_chat_completion

async def test():
    try:
        async for chunk in stream_chat_completion(messages=[{"role": "user", "content": "Hello"}], model_name="qwen-2.5-0.5b-local"):
            print("CHUNK:", chunk)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
