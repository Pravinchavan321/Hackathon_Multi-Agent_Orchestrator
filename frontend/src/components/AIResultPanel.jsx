import React from "react";

export function AIResultPanel({ result, agentType, pendingApproval = false }) {
  if (!result) {
    return (
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-6 shadow-xl shadow-black/40 text-center flex flex-col items-center justify-center min-h-[480px]">
        <div className="w-12 h-12 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center text-gray-500 mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-300">Awaiting Agent Results</h3>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          When the autonomous specialist finishes evaluating your task, structured analytical results, scoring metrics, and vector matches will appear here.
        </p>
      </div>
    );
  }

  const status = result.status;

  // Case 1: Rejected by Human in HITL gate
  if (status === "rejected_by_human" || agentType === "human_approval_rejected") {
    return (
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-6 shadow-xl shadow-black/40 animate-fadeIn">
        <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          Dismissed by Reviewer (False Positive)
        </div>
        <div className="p-4 bg-rose-950/40 border border-rose-600/30 rounded-lg text-xs space-y-2">
          <p className="text-rose-200 font-medium">
            <strong>Decision:</strong> {result.decision || "Rejected"}
          </p>
          {result.note && (
            <p className="text-gray-300">
              <strong>Reviewer Note:</strong> {result.note}
            </p>
          )}
          {result.original_risk && (
            <div className="mt-3 pt-3 border-t border-rose-800/40 text-gray-400">
              <span className="text-[11px] font-semibold uppercase text-rose-300 block mb-1">
                Original Flagged Concern:
              </span>
              <p>{result.original_risk.description || JSON.stringify(result.original_risk)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Case 2: Unclear / Ambiguous Request
  if (status === "unclear" || agentType === "unclear" || agentType === "unclear_handler") {
    return (
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-6 shadow-xl shadow-black/40 animate-fadeIn">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Clarification Requested
        </div>
        <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-lg text-xs space-y-2">
          <p className="text-amber-200 font-medium">
            {result.message || "Your request is too vague or does not match a specialist domain."}
          </p>
          {result.reasoning && (
            <p className="text-gray-300">
              <strong>Reasoning:</strong> {result.reasoning}
            </p>
          )}
          <div className="mt-3 pt-3 border-t border-amber-700/30 text-gray-400">
            <span className="font-semibold text-amber-300 block mb-1">Please try one of the following:</span>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Evaluate a project submission with tech stack & description</li>
              <li>Report an anomaly or vote brigading risk</li>
              <li>Request teammate recommendations by skill requirements</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Submission Agent Result
  if (agentType === "submission_agent" || result.innovation_score !== undefined) {
    const similar = result.similar_submissions || [];

    const getScoreWidth = (score) => {
      const pct = Math.min(100, Math.max(0, (score / 10) * 100));
      return `${pct}%`;
    };

    return (
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-xl shadow-black/40 space-y-4 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-300">
              Submission Evaluation Report
            </h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 font-mono">
            submission_agent
          </span>
        </div>

        {/* Summary */}
        {result.summary && (
          <div className="p-3 bg-gray-950/80 border border-gray-800 rounded-lg text-xs text-gray-200 leading-relaxed">
            <strong className="text-blue-400 block mb-1">Executive Summary:</strong>
            {result.summary}
          </div>
        )}

        {/* Score Bars */}
        <div className="p-3.5 bg-gray-950/80 border border-gray-800 rounded-lg space-y-3 text-xs">
          <span className="font-semibold text-gray-300 block text-[11px] uppercase tracking-wider">
            Evaluation Scoring (0 - 10):
          </span>

          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Innovation Score</span>
              <span className="font-bold text-blue-400">{result.innovation_score} / 10</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: getScoreWidth(result.innovation_score) }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Technical Complexity</span>
              <span className="font-bold text-indigo-400">{result.technical_score} / 10</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: getScoreWidth(result.technical_score) }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Completeness</span>
              <span className="font-bold text-emerald-400">{result.completeness_score} / 10</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: getScoreWidth(result.completeness_score) }}
              />
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-lg">
            <span className="font-semibold text-emerald-400 block mb-1.5 flex items-center gap-1">
              <span>✓</span> Key Strengths:
            </span>
            <ul className="space-y-1 text-gray-300">
              {result.strengths?.map((s, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-rose-950/20 border border-rose-800/30 rounded-lg">
            <span className="font-semibold text-rose-400 block mb-1.5 flex items-center gap-1">
              <span>✕</span> Areas for Improvement:
            </span>
            <ul className="space-y-1 text-gray-300">
              {result.weaknesses?.map((w, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Novelty Assessment */}
        {result.novelty_assessment && (
          <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-lg text-xs text-gray-200 leading-relaxed">
            <strong className="text-indigo-300 block mb-1">ChromaDB Prior Art & Novelty Assessment:</strong>
            {result.novelty_assessment}
          </div>
        )}

        {/* Similar Submissions Table */}
        {similar.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-300 block mb-1.5 uppercase tracking-wider">
              Semantically Similar Submissions (ChromaDB Vector Retrieval):
            </span>
            <div className="border border-gray-800 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-950 text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="p-2">Project Title</th>
                    <th className="p-2">Match Score</th>
                    <th className="p-2">Description Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-900/60">
                  {similar.map((item, idx) => {
                    const score = item.similarity_score || 0;
                    const badgeColor =
                      score > 0.5
                        ? "bg-rose-950 text-rose-300 border-rose-800"
                        : score >= 0.3
                        ? "bg-amber-950 text-amber-300 border-amber-800"
                        : "bg-emerald-950 text-emerald-300 border-emerald-800";

                    return (
                      <tr key={idx} className="hover:bg-gray-800/40">
                        <td className="p-2 font-medium text-gray-200 whitespace-nowrap">{item.title}</td>
                        <td className="p-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded border text-[11px] font-mono ${badgeColor}`}>
                            {(score * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2 text-gray-400 max-w-xs truncate">{item.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Case 4: Risk Agent Result
  if (agentType === "risk_agent" || result.risk_level !== undefined) {
    const level = result.risk_level || "LOW";
    const badgeStyle =
      level === "HIGH"
        ? "bg-rose-950 text-rose-300 border-rose-600 animate-pulse font-bold"
        : level === "MEDIUM"
        ? "bg-amber-950 text-amber-300 border-amber-600 font-bold"
        : "bg-emerald-950 text-emerald-300 border-emerald-600 font-bold";

    return (
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-xl shadow-black/40 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-300">
              Integrity & Risk Audit Report
            </h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60 font-mono">
            risk_agent
          </span>
        </div>

        {/* Pending Banner */}
        {pendingApproval && (
          <div className="p-3 bg-amber-950/80 border border-amber-500/60 rounded-lg flex items-center justify-between text-xs text-amber-200">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Execution Paused: Awaiting Human Reviewer Approval
            </span>
          </div>
        )}

        {/* Risk Level Badge */}
        <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Assessed Risk Level:</span>
            <span className="text-xs text-gray-300 mt-0.5 block">Category: <strong>{result.category || "General"}</strong></span>
          </div>
          <span className={`px-3 py-1 rounded-lg border text-sm uppercase tracking-wider ${badgeStyle}`}>
            {level} Risk
          </span>
        </div>

        {/* Description & Evidence */}
        <div className="p-3 bg-gray-950/80 border border-gray-800 rounded-lg text-xs space-y-2">
          <div>
            <strong className="text-gray-300 block mb-0.5">Concern Description:</strong>
            <p className="text-gray-200 leading-relaxed">{result.description}</p>
          </div>
          {result.evidence && (
            <div className="pt-2 border-t border-gray-800">
              <strong className="text-gray-300 block mb-0.5">Concrete Evidence:</strong>
              <p className="text-amber-300/90 font-mono text-[11px]">{result.evidence}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Case 5: Team Agent Result
  if (agentType === "team_agent" || result.matched_participants !== undefined) {
    const matched = result.matched_participants || [];

    return (
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-xl shadow-black/40 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
              Team Matching & Skill Recommendation
            </h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
            team_agent
          </span>
        </div>

        {/* Summary */}
        {result.recommendation_summary && (
          <div className="p-3 bg-gray-950/80 border border-gray-800 rounded-lg text-xs text-gray-200 leading-relaxed">
            <strong className="text-emerald-400 block mb-1">Recommendation Overview:</strong>
            {result.recommendation_summary}
          </div>
        )}

        {/* Missing Skills & Roles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-gray-950/80 border border-gray-800 rounded-lg">
            <span className="font-semibold text-gray-300 block mb-2 text-[11px] uppercase tracking-wider">
              Identified Skill Gaps:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {result.missing_skills?.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 rounded text-[11px]">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-gray-950/80 border border-gray-800 rounded-lg">
            <span className="font-semibold text-gray-300 block mb-2 text-[11px] uppercase tracking-wider">
              Recommended Roles:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {result.suggested_roles?.map((r, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 rounded text-[11px]">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Compatibility Reasoning */}
        {result.compatibility_reasoning && (
          <div className="p-3 bg-gray-950/80 border border-gray-800 rounded-lg text-xs text-gray-300 leading-relaxed">
            <strong className="text-gray-400 block mb-1">Compatibility & Composition Rationale:</strong>
            {result.compatibility_reasoning}
          </div>
        )}

        {/* Matched Participants Cards */}
        {matched.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-gray-300 block mb-2 uppercase tracking-wider">
              Candidate Teammates (Matched via ChromaDB Embeddings):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {matched.map((p, idx) => {
                const score = p.similarity_score || 0;
                return (
                  <div key={idx} className="p-3 bg-gray-950/90 border border-gray-800 rounded-lg hover:border-emerald-500/40 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-gray-100">{p.name}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-mono">
                        {(score * 100).toFixed(1)}% Match
                      </span>
                    </div>
                    <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-3">
                      {p.skills_bio}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback generic display
  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-xl shadow-black/40 text-xs">
      <h3 className="font-bold text-gray-200 mb-2">Agent Execution Result</h3>
      <pre className="p-3 bg-gray-950 border border-gray-800 rounded text-gray-300 overflow-x-auto text-[11px]">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

export default AIResultPanel;
