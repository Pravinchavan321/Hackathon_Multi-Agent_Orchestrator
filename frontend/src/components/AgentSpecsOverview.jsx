import React from "react";

const AGENT_SPECS = [
  {
    name: "Orchestrator Agent",
    nodeName: "orchestrator",
    badge: "Classifier & Router",
    badgeColor: "bg-indigo-950 text-indigo-300 border-indigo-700",
    description:
      "Analyzes user requests using structured intent classification to route to the appropriate domain specialist or handle ambiguous queries.",
    tools: ["Intent Classifier (LLM)", "Plan Generator", "State Graph Router"],
    outputs: ["task_type ('submission' | 'risk' | 'team' | 'unclear')", "routing reasoning", "multi-step plan"],
    modelFile: "backend/ai/agents/orchestrator_agent.py",
  },
  {
    name: "Submission Agent",
    nodeName: "submission_agent",
    badge: "Project Evaluator",
    badgeColor: "bg-blue-950 text-blue-300 border-blue-700",
    description:
      "Evaluates hackathon submissions on innovation, technical complexity, and completeness while retrieving semantically similar prior art from ChromaDB.",
    tools: ["find_similar_submissions (ChromaDB)", "index_submission", "Novelty Evaluator (LLM)"],
    outputs: ["0-10 innovation score", "0-10 technical score", "0-10 completeness score", "strengths & weaknesses", "similar submissions list"],
    modelFile: "backend/ai/agents/submission_agent.py",
  },
  {
    name: "Risk Agent",
    nodeName: "risk_agent",
    badge: "Integrity & Sentinel",
    badgeColor: "bg-rose-950 text-rose-300 border-rose-700",
    description:
      "Audits voting patterns, score distributions, and submissions for integrity risks, vote-brigading, and fraud. Flags requires_human_approval for HIGH risk.",
    tools: ["detect_scoring_anomaly", "flag_risk_event", "Anomaly Classifier (LLM)"],
    outputs: ["risk_level ('LOW' | 'MEDIUM' | 'HIGH')", "category", "detailed evidence", "requires_human_approval flag"],
    modelFile: "backend/ai/agents/risk_agent.py",
  },
  {
    name: "Team Agent",
    nodeName: "team_agent",
    badge: "Skill Matcher",
    badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-700",
    description:
      "Analyzes team skill requirements and performs dense vector semantic search over participant profiles to match complementary collaborators.",
    tools: ["find_matching_participants (ChromaDB)", "index_participant_skills", "Team Gap Analyzer (LLM)"],
    outputs: ["identified missing skills", "suggested team roles", "compatibility reasoning", "matched candidate profiles"],
    modelFile: "backend/ai/agents/team_agent.py",
  },
  {
    name: "Human Approval Gate",
    nodeName: "human_approval",
    badge: "HITL Gate",
    badgeColor: "bg-purple-950 text-purple-300 border-purple-700",
    description:
      "Acts as the interrupt_before gate for destructive risk actions in LangGraph. Ensures human sign-off before executing remediation.",
    tools: ["State Checkpoint Store (MongoDB)", "REST Approval Handlers (/approve)"],
    outputs: ["resumed graph state", "human auditor note", "override outcome ('approved' | 'rejected_by_human')"],
    modelFile: "backend/ai/agents/human_approval_node.py",
  },
];

export function AgentSpecsOverview() {
  return (
    <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/50 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-100">
              Agent Specifications & Node Contracts
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Detailed breakdown of LangGraph nodes, tool bindings, structured Pydantic schemas, and state transitions.
          </p>
        </div>
        <span className="text-xs font-mono text-gray-400 bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800">
          5 StateGraph Nodes
        </span>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {AGENT_SPECS.map((agent, idx) => (
          <div
            key={idx}
            className="p-4 bg-gray-950 border border-gray-800/90 rounded-xl space-y-3 hover:border-gray-700 transition flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-100">{agent.name}</span>
                  <span className="text-[10px] font-mono text-gray-500">({agent.nodeName})</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${agent.badgeColor}`}>
                  {agent.badge}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{agent.description}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-800/80 text-[11px]">
              <div>
                <strong className="text-gray-300 block mb-1">Bound Tools & Capabilities:</strong>
                <div className="flex flex-wrap gap-1">
                  {agent.tools.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 font-mono text-[10px] text-indigo-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong className="text-gray-300 block mb-1">Structured Schema Outputs:</strong>
                <div className="flex flex-wrap gap-1">
                  {agent.outputs.map((o, oIdx) => (
                    <span
                      key={oIdx}
                      className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 font-mono text-[10px] text-emerald-300"
                    >
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>Backend Implementation:</span>
              <span className="text-gray-400">{agent.modelFile}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgentSpecsOverview;
