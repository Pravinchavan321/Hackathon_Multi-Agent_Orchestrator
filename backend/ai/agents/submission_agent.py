import json
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig

from backend.ai.llm import llm
from backend.ai.prompts.submission_prompt import SUBMISSION_SYSTEM_PROMPT
from backend.ai.tools.submission_tools import find_similar_submissions
from backend.ai.graph.state import HackathonAgentState
from backend.core.logging import log


class SubmissionAnalysis(BaseModel):
    innovation_score: float = Field(
        ge=0, le=10, description="Score between 0-10 evaluating novelty and creativity"
    )
    technical_score: float = Field(
        ge=0, le=10, description="Score between 0-10 evaluating technical depth and execution"
    )
    completeness_score: float = Field(
        ge=0, le=10, description="Score between 0-10 evaluating project completeness"
    )
    summary: str = Field(
        description="Concise summary of the analyzed project submission"
    )
    strengths: List[str] = Field(
        default_factory=list, description="Key technical and design strengths"
    )
    weaknesses: List[str] = Field(
        default_factory=list, description="Key areas of improvement or gaps"
    )
    similar_submissions: List[Dict[str, Any]] = Field(
        default_factory=list, description="Semantically similar existing submissions retrieved from ChromaDB"
    )
    novelty_assessment: str = Field(
        description="LLM assessment of originality and differentiation compared to similar projects"
    )


async def submission_agent_node(state: HackathonAgentState, config: RunnableConfig = None) -> dict:
    """
    Submission Agent Node:
    1. Extracts the submission description from state messages.
    2. Calls the ChromaDB semantic search tool `find_similar_submissions` to retrieve prior art.
    3. Prompts the LLM with structured output to evaluate the submission and produce novelty assessment.
    4. Updates state with structured final_result and tool_results.
    """
    log.info("Submission agent node entered", current_messages=len(state.get("messages", [])))

    messages = state.get("messages", [])
    user_content = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage) or (hasattr(msg, "type") and msg.type == "human"):
            user_content = msg.content if isinstance(msg.content, str) else str(msg.content)
            break
        elif isinstance(msg, dict) and msg.get("role") in ("user", "human"):
            user_content = str(msg.get("content", ""))
            break

    if not user_content:
        user_content = "Hackathon project submission details"

    # Step 1: Execute semantic search tool over ChromaDB
    try:
        similar_items = find_similar_submissions.invoke({
            "description": user_content,
            "n_results": 3,
        })
    except Exception as e:
        log.error("Tool execution find_similar_submissions failed", error=str(e))
        similar_items = []

    similar_summary = json.dumps(similar_items, indent=2) if similar_items else "No existing similar submissions found."

    # Step 2: LLM call with structured output incorporating tool results
    prompt_messages = [
        SystemMessage(content=SUBMISSION_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"[USER_CONTENT]\n{user_content}\n[/USER_CONTENT]\n\n"
                f"[SIMILAR_SUBMISSIONS]\n{similar_summary}\n[/SIMILAR_SUBMISSIONS]"
            )
        ),
    ]

    structured_llm = llm.with_structured_output(SubmissionAnalysis)
    analysis: SubmissionAnalysis = await structured_llm.ainvoke(prompt_messages, config=config)

    # Ensure the structured output contains the actual ChromaDB retrieval items
    analysis_dict = analysis.model_dump()
    if not analysis_dict.get("similar_submissions"):
        analysis_dict["similar_submissions"] = similar_items

    log.info(
        "Submission analysis completed with semantic similarity",
        innovation=analysis.innovation_score,
        technical=analysis.technical_score,
        completeness=analysis.completeness_score,
        similar_count=len(similar_items),
    )

    ai_msg = AIMessage(
        content=(
            f"Submission Analysis: {analysis.summary} "
            f"(Scores: Innovation={analysis.innovation_score}/10, Technical={analysis.technical_score}/10, Completeness={analysis.completeness_score}/10. "
            f"Novelty: {analysis.novelty_assessment[:100]}...)"
        )
    )

    tool_results = state.get("tool_results", {}) or {}
    tool_results["similar_submissions"] = similar_items

    return {
        "messages": [ai_msg],
        "current_agent": "submission_agent",
        "tool_results": tool_results,
        "final_result": analysis_dict,
    }

