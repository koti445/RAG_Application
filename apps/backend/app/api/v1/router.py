"""API v1 route aggregation."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, projects, pipelines, knowledge, playground, evaluation, websocket, rag, rag_components

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(pipelines.router, prefix="/pipelines", tags=["pipelines"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_router.include_router(playground.router, prefix="/playground", tags=["playground"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["evaluation"])
api_router.include_router(rag_components.router, prefix="/rag/components", tags=["rag-components"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
