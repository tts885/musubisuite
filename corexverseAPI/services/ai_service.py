import json
import logging
from ai_services import AIClient

logger = logging.getLogger('ai_settings')

class AIService:
    """
    Service class for AI related business logic.
    """

    @staticmethod
    def stream_ai_response(provider, prompt):
        """
        Stream AI response for a given provider and prompt.
        Yields formatted SSE data chunks.
        """
        try:
            client = AIClient(provider=provider)
            
            # Chunk-based streaming
            for chunk in client.generate_stream(prompt):
                if chunk:
                    yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
            
            # Completion signal
            yield f"data: {json.dumps({'done': True})}\n\n"
            logger.info("Stream completed successfully")
            
        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            logger.error(f"Streaming error: {error_msg}", exc_info=True)
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
