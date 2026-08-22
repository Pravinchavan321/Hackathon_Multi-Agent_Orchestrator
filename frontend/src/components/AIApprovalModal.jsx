import React, { useState } from "react";
import { submitApproval } from "../api/aiAPI";

const QUICK_NOTES = [
  "Verified bot IP cluster on Grafana. Flag approved.",
  "Confirmed suspicious volume burst from single subnet.",
  "False positive: verified live demo booth showcase.",
  "Reviewed with hackathon lead organizer. Disapproved.",
];

export function AIApprovalModal({ threadId, riskResult, onDecision, visible = false }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!visible || !riskResult) {
    return null;
  }

  const handleAction = async (decision) => {
    if (!note.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await submitApproval(threadId, decision, note.trim());
      if (onDecision) {
        onDecision(decision, note.trim(), response);
      }
    } catch (err) {
      console.error("Failed to submit human approval decision:", err);
      setError(err.message || "Failed to submit decision to server");
    } finally {
      setSubmitting(false);
    }
  };

  const riskLevel = riskResult.risk_level || "HIGH";
  const category = riskResult.category || "Integrity Risk";
  const description = riskResult.description || "Suspicious hackathon activity flagged.";
  const evidence = riskResult.evidence || "";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-rose-600/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-rose-950/60 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
          <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-600/60 flex items-center justify-center text-rose-400 text-xl font-bold shadow-md shadow-rose-950/50 animate-pulse">
            ⚠️
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-100">
              High-Risk Finding — Human Review Required
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              LangGraph execution paused at interrupt gate before destructive action
            </p>
          </div>
        </div>

        {/* Risk Details Card */}
        <div className="bg-gray-950 border border-gray-800/90 rounded-xl p-4 text-xs space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
              Category: <strong className="text-rose-300">{category}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 text-[11px] font-bold">
              {riskLevel} Risk
            </span>
          </div>

          <div>
            <span className="text-gray-400 block mb-0.5 font-medium text-[11px] uppercase tracking-wider">Flagged Concern:</span>
            <p className="text-gray-200 leading-relaxed">{description}</p>
          </div>

          {evidence && (
            <div className="pt-2.5 border-t border-gray-800">
              <span className="text-gray-400 block mb-1 font-medium text-[11px] uppercase tracking-wider">Concrete Evidence:</span>
              <p className="text-amber-300 font-mono text-[11px] bg-black/60 p-2.5 rounded-lg border border-gray-800 leading-relaxed">
                {evidence}
              </p>
            </div>
          )}
        </div>

        {/* Quick Fill Note Templates */}
        <div>
          <span className="block text-[11px] text-gray-400 mb-1.5 font-medium">Quick Note Presets:</span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {QUICK_NOTES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNote(preset)}
                className="text-[10px] px-2 py-1 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 rounded-md text-gray-300 hover:text-white transition cursor-pointer"
              >
                {preset.slice(0, 32)}...
              </button>
            ))}
          </div>

          {/* Reviewer Note Input */}
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Reviewer Audit Note <span className="text-rose-400">* (Required)</span>:
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            placeholder="Type your justification note for the audit log..."
            className="w-full bg-gray-950 border border-gray-700 focus:border-rose-500 rounded-xl p-3 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-sans resize-none transition"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-xl text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => handleAction("reject")}
            disabled={submitting || !note.trim()}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-rose-950/60 hover:text-rose-300 border border-gray-700 hover:border-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 text-xs font-semibold transition cursor-pointer"
          >
            {submitting ? "Processing..." : "Dismiss as False Positive"}
          </button>

          <button
            type="button"
            onClick={() => handleAction("approve")}
            disabled={submitting || !note.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Resuming...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Approve & Continue Graph</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIApprovalModal;
