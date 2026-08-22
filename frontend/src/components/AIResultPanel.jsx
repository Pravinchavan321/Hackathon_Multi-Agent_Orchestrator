import React, { useState } from "react";

export function AIResultPanel({ result, agentType, pendingApproval = false, streaming = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result && streaming) {
    return (
      <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 text-center flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-950/60 animate-pulse">
          <svg className="animate-spin h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-200">Autonomous Specialist Active</h3>
        <p className="text-xs text-gray-400 max-w-sm mt-2 leading-relaxed">
          Evaluating task with ChromaDB semantic search and LangGraph state checkpointing...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 text-center flex flex-col items-center justify-center min-h-[500px] transition">
        <div className="w-14 h-14 rounded-2xl bg-gray-800/80 border border-gray-700/80 flex items-center justify-center text-gray-400 mb-4 shadow-inner">
          <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-200">Awaiting Agent Results</h3>
        <p className="text-xs text-gray-400 max-w-sm mt-2 leading-relaxed">
          When the autonomous specialist finishes evaluating your task, structured analytical reports, scoring metrics, and vector matches will appear here.
        </p>
      </div>
    );
  }

  const status = result.status;

  // Case 1: Rejected by Human in HITL gate
  if (status === "rejected_by_human" || agentType === "human_approval_rejected") {
    return (
      <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/50 space-y-4 animate-fadeIn">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm pb-3 border-b border-gray-800">
          <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
          <span>Dismissed by Reviewer (False Positive)</span>
        </div>
        <div className="p-4 bg-rose-950/40 border border-rose-600/40 rounded-xl text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-rose-200 font-semibold">Human Decision:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-900/80 text-rose-200 border border-rose-600 font-mono text-[11px]">
              {result.decision || "Rejected"}
            </span>
          </div>
          {result.note && (
            <div className="p-3 bg-black/40 rounded-lg border border-rose-900/40 text-gray-200 leading-relaxed">
              <strong className="text-rose-300 block mb-1">Reviewer Note:</strong>
              {result.note}
            </div>
          )}
          {result.original_risk && (
            <div className="mt-3 pt-3 border-t border-rose-800/40 text-gray-300">
              <span className="text-[11px] font-semibold uppercase text-rose-300 block mb-1">
                Original Flagged Concern:
              </span>
              <p className="text-xs leading-relaxed">{result.original_risk.description || JSON.stringify(result.original_risk)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Case 2: Unclear / Ambiguous Request
  if (status === "unclear" || agentType === "unclear" || agentType === "unclear_handler") {
    return (
      <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/50 space-y-4 animate-fadeIn">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm pb-3 border-b border-gray-800">
          <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
          <span>Clarification Requested</span>
        </div>
        <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs space-y-3">
          <p className="text-amber-200 font-medium text-xs leading-relaxed">
            {result.message || "Your request is too vague or does not match a specialist domain."}
          </p>
          {result.reasoning && (
            <p className="text-gray-300 leading-relaxed p-2.5 bg-black/40 rounded-lg border border-amber-900/30">
              <strong className="text-amber-300 block mb-0.5">Orchestrator Reasoning:</strong>
              {result.reasoning}
            </p>
          )}
          <div className="mt-3 pt-3 border-t border-amber-700/30 text-gray-300">
            <span className="font-semibold text-amber-300 block mb-2">Recommended Prompts:</span>
            <ul className="list-disc list-inside space-y-1.5 text-gray-300 text-[11px]">
              <li>Evaluate project submission: "Please analyze our legal assistant project..."</li>
              <li>Report integrity concern: "Warning: Spike in votes for team Alpha..."</li>
              <li>Seek teammates: "Looking for a React developer with Web3 experience..."</li>
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
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/60 space-y-4 animate-fadeIn backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-blue-300">
              Submission Evaluation Report
            </h2>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono font-semibold">
            submission_agent
          </span>
        </div>

        {/* Executive Summary */}
        {result.summary && (
          <div className="p-4 bg-slate-950/90 border border-slate-800/90 rounded-xl text-xs text-slate-200 leading-relaxed shadow-inner space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="font-display text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
                Executive Summary:
              </strong>
              <button
                type="button"
                onClick={() => handleCopy(result.summary)}
                className="text-[10px] font-mono text-slate-400 hover:text-slate-200 transition cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans">{result.summary}</p>
          </div>
        )}

        {/* Score Meters */}
        <div className="p-4 bg-slate-950/90 border border-slate-800/90 rounded-xl space-y-3.5 text-xs shadow-inner">
          <span className="font-display font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
            Evaluation Scoring (0 - 10):
          </span>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span className="font-display text-xs">Innovation & Novelty</span>
              <span className="font-display font-bold text-blue-400 text-xs">{result.innovation_score} / 10</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-700 shadow-glow-indigo"
                style={{ width: getScoreWidth(result.innovation_score) }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span className="font-display text-xs">Technical Complexity</span>
              <span className="font-display font-bold text-indigo-400 text-xs">{result.technical_score} / 10</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400 rounded-full transition-all duration-700 shadow-glow-indigo"
                style={{ width: getScoreWidth(result.technical_score) }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span className="font-display text-xs">Completeness & Polish</span>
              <span className="font-display font-bold text-emerald-400 text-xs">{result.completeness_score} / 10</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 rounded-full transition-all duration-700 shadow-glow-emerald"
                style={{ width: getScoreWidth(result.completeness_score) }}
              />
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/30 rounded-xl space-y-2">
            <span className="font-display font-bold text-emerald-400 block flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <span>✓</span> Key Strengths:
            </span>
            <ul className="space-y-1.5 text-slate-300 leading-relaxed font-sans">
              {result.strengths?.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 bg-rose-950/20 border border-rose-800/30 rounded-xl space-y-2">
            <span className="font-display font-bold text-rose-400 block flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <span>✕</span> Areas for Improvement:
            </span>
            <ul className="space-y-1.5 text-slate-300 leading-relaxed font-sans">
              {result.weaknesses?.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Novelty Assessment */}
        {result.novelty_assessment && (
          <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-slate-200 leading-relaxed space-y-1">
            <strong className="font-display text-indigo-300 block text-[11px] uppercase tracking-wider">
              ChromaDB Prior Art & Novelty Analysis:
            </strong>
            <p className="text-slate-300 leading-relaxed font-sans">{result.novelty_assessment}</p>
          </div>
        )}

        {/* Similar Submissions Table */}
        {similar.length > 0 && (
          <div className="space-y-2">
            <span className="font-display text-xs font-bold text-slate-300 block uppercase tracking-wider">
              Semantically Similar Submissions (ChromaDB Vector Retrieval):
            </span>
            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs shadow-inner">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-display text-[11px]">
                  <tr>
                    <th className="p-2.5 font-semibold">Project Title</th>
                    <th className="p-2.5 font-semibold">Similarity</th>
                    <th className="p-2.5 font-semibold">Description Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {similar.map((item, idx) => {
                    const score = item.similarity_score || 0;
                    const badgeColor =
                      score > 0.5
                        ? "bg-rose-950/80 text-rose-300 border-rose-800"
                        : score >= 0.3
                        ? "bg-amber-950/80 text-amber-300 border-amber-800"
                        : "bg-emerald-950/80 text-emerald-300 border-emerald-800";

                    return (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-2.5 font-display font-semibold text-slate-100 whitespace-nowrap">{item.title}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-mono font-bold ${badgeColor}`}>
                            {(score * 100).toFixed(1)}% Match
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400 max-w-xs truncate font-sans">{item.description}</td>
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
        ? "bg-rose-950 text-rose-300 border-rose-600 animate-pulse font-bold shadow-glow-rose"
        : level === "MEDIUM"
        ? "bg-amber-950 text-amber-300 border-amber-600 font-bold"
        : "bg-emerald-950 text-emerald-300 border-emerald-600 font-bold shadow-glow-emerald";

    return (
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/60 space-y-4 animate-fadeIn backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-rose-300">
              Integrity & Risk Audit Report
            </h2>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 font-mono font-semibold">
            risk_agent
          </span>
        </div>

        {/* Pending Banner */}
        {pendingApproval && (
          <div className="p-4 bg-amber-950/80 border border-amber-500/60 rounded-xl flex items-center justify-between text-xs text-amber-200 shadow-lg shadow-amber-950/40">
            <span className="font-display font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              Execution Paused: Awaiting Human Reviewer Approval (HITL Gate)
            </span>
          </div>
        )}

        {/* Approved by Human Banner */}
        {!pendingApproval && (agentType === "human_approval" || result.decision === "approve" || result.status === "approved") && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-xl flex items-center justify-between text-xs text-emerald-200 shadow-lg shadow-emerald-950/40">
            <span className="font-display font-semibold flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-sm">✓</span>
              Human Review Verified & Approved for Execution
            </span>
          </div>
        )}

        {/* Risk Level Badge */}
        <div className="p-4 bg-slate-950/90 border border-slate-800/90 rounded-xl flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold font-display">Assessed Risk Level:</span>
            <span className="text-xs text-slate-200 mt-1 block font-sans">Category: <strong className="text-rose-300 font-semibold">{result.category || "General"}</strong></span>
          </div>
          <span className={`px-4 py-1.5 rounded-xl border text-xs uppercase tracking-wider font-display font-bold ${badgeStyle}`}>
            {level} Risk
          </span>
        </div>

        {/* Description & Evidence */}
        <div className="p-4 bg-slate-950/90 border border-slate-800/90 rounded-xl text-xs space-y-3 shadow-inner">
          <div>
            <strong className="font-display text-slate-300 block mb-1 text-[11px] uppercase tracking-wider">Concern Description:</strong>
            <p className="text-slate-200 leading-relaxed font-sans">{result.description}</p>
          </div>
          {result.evidence && (
            <div className="pt-3 border-t border-slate-800/80">
              <strong className="font-display text-slate-300 block mb-1 text-[11px] uppercase tracking-wider">Concrete Evidence:</strong>
              <p className="text-amber-300/90 font-mono text-[11px] bg-black/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {result.evidence}
              </p>
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
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/60 space-y-4 animate-fadeIn backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-emerald-300">
              Team Matching & Skill Recommendations
            </h2>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono font-semibold">
            team_agent
          </span>
        </div>

        {/* Overview */}
        {result.recommendation_summary && (
          <div className="p-4 bg-slate-950/90 border border-slate-800/90 rounded-xl text-xs text-slate-200 leading-relaxed shadow-inner space-y-1">
            <strong className="font-display text-emerald-400 block text-[11px] uppercase tracking-wider">Overview:</strong>
            <p className="text-slate-300 leading-relaxed font-sans">{result.recommendation_summary}</p>
          </div>
        )}

        {/* Missing Skills & Roles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-950/90 border border-slate-800/90 rounded-xl space-y-2 shadow-inner">
            <span className="font-display font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
              Identified Skill Gaps:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {result.missing_skills?.map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 rounded-lg text-[10px] font-mono font-semibold">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/90 border border-slate-800/90 rounded-xl space-y-2 shadow-inner">
            <span className="font-display font-bold text-slate-300 block text-[11px] uppercase tracking-wider">
              Recommended Roles:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {result.suggested_roles?.map((r, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 rounded-lg text-[10px] font-mono font-semibold">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Compatibility Reasoning */}
        {result.compatibility_reasoning && (
          <div className="p-3.5 bg-slate-950/90 border border-slate-800/90 rounded-xl text-xs text-slate-300 leading-relaxed space-y-1 shadow-inner">
            <strong className="font-display text-slate-400 block text-[11px] uppercase tracking-wider">Team Composition Rationale:</strong>
            <p className="text-slate-300 leading-relaxed font-sans">{result.compatibility_reasoning}</p>
          </div>
        )}

        {/* Matched Participants Cards */}
        {matched.length > 0 && (
          <div className="space-y-2.5">
            <span className="font-display text-xs font-bold text-slate-300 block uppercase tracking-wider">
              Candidate Teammates (ChromaDB Vector Embeddings Match):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {matched.map((p, idx) => {
                const score = p.similarity_score || 0;
                const initials = p.name ? p.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "??";

                return (
                  <div key={idx} className="p-3.5 bg-slate-950/90 border border-slate-800/90 rounded-xl hover:border-emerald-500/50 transition-all duration-200 shadow-sm hover:shadow-glow-emerald">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-300 flex items-center justify-center font-display font-bold text-xs shadow-sm">
                          {initials}
                        </div>
                        <span className="font-display font-bold text-slate-100 text-xs">{p.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-mono font-bold">
                        {(score * 100).toFixed(1)}% Match
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3 font-sans">
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
    <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800/90 rounded-2xl p-5 shadow-2xl shadow-black/50 text-xs space-y-3">
      <h3 className="font-bold text-gray-200">Agent Execution Payload</h3>
      <pre className="p-3 bg-gray-950 border border-gray-800 rounded-xl text-gray-300 overflow-x-auto text-[11px] font-mono">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

export default AIResultPanel;
