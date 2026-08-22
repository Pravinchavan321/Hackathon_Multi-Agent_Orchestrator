import React from "react";

const RISK_RULES = [
  {
    id: "RULE-01",
    name: "Vote Burst / Subnet Cluster Detection",
    category: "vote_brigading",
    threshold: ">500 votes / 3 min from identical IP subnet",
    action: "Pauses LangGraph -> Human Review Required (HITL)",
    severity: "HIGH",
    severityColor: "bg-rose-950 text-rose-300 border-rose-700",
  },
  {
    id: "RULE-02",
    name: "Code Plagiarism & Semantic Prior Art Match",
    category: "plagiarism",
    threshold: "ChromaDB vector similarity > 0.85 against past hackathon repo",
    action: "Flags novelty risk, attaches matched prior art in report",
    severity: "HIGH",
    severityColor: "bg-rose-950 text-rose-300 border-rose-700",
  },
  {
    id: "RULE-03",
    name: "Scoring Discrepancy & Judge Bias Anomaly",
    category: "scoring_anomaly",
    threshold: "Judge score variance > 3.5 std deviations from track median",
    action: "Highlights score divergence for organizer review",
    severity: "MEDIUM",
    severityColor: "bg-amber-950 text-amber-300 border-amber-700",
  },
  {
    id: "RULE-04",
    name: "Team Multi-Registration & Collusion Alert",
    category: "collusion",
    threshold: "Same GitHub handle or email alias across multiple active teams",
    action: "Prompts team lead clarification check",
    severity: "MEDIUM",
    severityColor: "bg-amber-950 text-amber-300 border-amber-700",
  },
];

export function RiskAuditPanel({ onTestScenario }) {
  return (
    <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/50 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-100">
              Integrity & Risk Audit Engine
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time anomaly detection rules, fraud prevention, and Human-in-the-Loop (HITL) interrupt gate controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-700/50 px-2.5 py-1 rounded-lg">
            Active Rules: 4
          </span>
          <span className="text-[11px] font-mono text-rose-400 bg-rose-950/80 border border-rose-700/50 px-2.5 py-1 rounded-lg">
            HITL Gate: Active
          </span>
        </div>
      </div>

      {/* Interactive Trigger Banner */}
      <div className="p-4 bg-gradient-to-r from-rose-950/40 via-gray-900/60 to-rose-950/40 border border-rose-600/40 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Test Live Risk Interrupt Scenario</span>
          </h3>
          <p className="text-[11px] text-gray-300 mt-0.5">
            Trigger a simulated 800-vote burst anomaly to watch the state graph pause before destructive actions.
          </p>
        </div>
        {onTestScenario && (
          <button
            type="button"
            onClick={() =>
              onTestScenario(
                "Warning: Team Nova received 800 upvotes in 3 minutes from new accounts across 5 different countries simultaneously."
              )
            }
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-950/50 cursor-pointer flex items-center gap-1.5"
          >
            <span>Trigger Anomaly Alert</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Rules Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
          Automated Risk Classification Rules:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {RISK_RULES.map((rule) => (
            <div
              key={rule.id}
              className="p-4 bg-gray-950 border border-gray-800 rounded-xl space-y-2 hover:border-gray-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                  {rule.id}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${rule.severityColor}`}>
                  {rule.severity} RISK
                </span>
              </div>
              <h4 className="text-xs font-bold text-gray-100">{rule.name}</h4>
              <div className="space-y-1 text-[11px] text-gray-400">
                <p>
                  <strong className="text-gray-300">Trigger Threshold:</strong> {rule.threshold}
                </p>
                <p>
                  <strong className="text-gray-300">Autonomous Action:</strong> {rule.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkpointing & HITL Safety Explanation */}
      <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl text-xs space-y-2 text-gray-300">
        <h4 className="font-bold text-gray-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
          <span>🔒</span>
          <span>LangGraph Safety & Checkpointing Architecture</span>
        </h4>
        <p className="leading-relaxed text-gray-400 text-[11px]">
          When a risk assessment produces a <strong className="text-rose-300">HIGH</strong> risk level, LangGraph halts at the{" "}
          <code className="text-indigo-300 bg-gray-900 px-1 py-0.5 rounded border border-gray-800 font-mono">interrupt_before=['human_approval']</code>{" "}
          gate. The thread state is safely checkpointed to MongoDB. Destructive actions (such as disqualification or state alteration) cannot execute until an authorized reviewer explicitly approves via cryptographic REST confirmation.
        </p>
      </div>
    </div>
  );
}

export default RiskAuditPanel;
