from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
from app.services.ai import chat, clear_session, _get_history

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatRequest(BaseModel):
    query: Optional[str] = None
    message: Optional[str] = None
    session_id: Optional[str] = "default"
    portfolio: Optional[Dict[str, Any]] = None

class ScanRequest(BaseModel):
    holdings: List[Dict[str, Any]]

@router.post("/chat")
def chat_endpoint(payload: ChatRequest):
    """
    Fein AI chat endpoint. Accepts query or message, portfolio state, and session ID.
    Returns response formatted in HTML, plain text, and any portfolio scanner alerts.
    """
    message = payload.message or payload.query or ""
    message = message.strip()
    
    if not message:
        return {
            "reply": "Please type a message for Fein AI.",
            "reply_plain": "Please type a message.",
            "alerts": [],
            "model": "llama-3.1-8b-instant",
            "tokens_used": 0,
            "error": False,
            "error_msg": ""
        }
    
    try:
        result = chat(
            message=message,
            session_id=payload.session_id or "default",
            portfolio=payload.portfolio
        )
        return result
    except Exception as e:
        logger.error(f"Error in chat_endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process chat query: {str(e)}")

@router.post("/chat/clear")
def clear_chat_endpoint(payload: Dict[str, Any] = None):
    """
    Clears the chatbot memory/history for a given session.
    """
    session_id = "default"
    if payload:
        session_id = payload.get("session_id") or payload.get("sessionId") or "default"
    
    try:
        clear_session(session_id)
        return {"message": "Chat memory cleared.", "error": False}
    except Exception as e:
        logger.error(f"Error clearing chat session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/history")
def get_chat_history(session_id: str = "default"):
    """
    Retrieves the raw conversation history for a given session.
    """
    try:
        history = _get_history(session_id)
        public = [m for m in history if m["role"] in ("user", "assistant")]
        return {"history": public, "count": len(public) // 2}
    except Exception as e:
        logger.error(f"Error getting history for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/portfolio/scan")
def scan_portfolio_endpoint(payload: ScanRequest):
    """
    Standalone portfolio scanner. Returns list of alerts.
    """
    from app.services.ai import scan_portfolio
    try:
        alerts = scan_portfolio(payload.holdings)
        return {"alerts": alerts, "count": len(alerts)}
    except Exception as e:
        logger.error(f"Error scanning portfolio: {e}")
        raise HTTPException(status_code=500, detail=str(e))
