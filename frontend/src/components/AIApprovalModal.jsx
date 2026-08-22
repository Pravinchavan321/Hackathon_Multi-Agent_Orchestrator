import React, { useState } from "react";
import { submitApproval } from "../api/aiAPI";

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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gray-900 border border-rose-600/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-rose-950/40 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-950 border border-rose-600/50 flex items-center justify-center text-rose-400 text-lg font-bold animate-pulse">
            ⚠️
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-100">
              High-Risk Finding — Human Review Required
            </h3>
            <p className="text-xs text-gray-400">
              LangGraph execution paused at interrupt gate before action
            </p>
          </div>
        </div>

        {/* Risk Details Card */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
              Category: <strong className="text-gray-200">{category}</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 text-[11px] font-bold">
              {riskLevel} Risk
            </span>
          </div>

          <div>
            <span className="text-gray-400 block mb-0.5 font-medium">Flagged Concern:</span>
            <p className="text-gray-200 leading-relaxed">{description}</p>
          </div>

          {evidence && (
            <div className="pt-2 border-t border-gray-800">
              <span className="text-gray-400 block mb-0.5 font-medium">Concrete Evidence:</span>
              <p className="text-amber-300 font-mono text-[11px] bg-gray-900 p-2 rounded border border-gray-800">
                {evidence}
              </p>
            </div>
          )}
        </div>

        {/* Reviewer Note Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Reviewer Audit Note <span className="text-rose-400">* (Required for verification)</span>:
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            placeholder="e.g. Verified bot IP cluster on dashboard. Flag approved. OR False positive: in-person booth showcase."
            className="w-full bg-gray-950 border border-gray-700 focus:border-rose-500 rounded-lg p-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans resize-none"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-600 rounded-lg text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => handleAction("reject")}
            disabled={submitting || !note.trim()}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-rose-950/60 hover:text-rose-300 border border-gray-700 hover:border-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 text-xs font-medium transition"
          >
            {submitting ? "Processing..." : "Dismiss as False Positive"}
          </button>

          <button
            type="button"
            onClick={() => handleAction("approve")}
            disabled={submitting || !note.trim()}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow-md shadow-emerald-950/50 flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resuming...
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Approve & Continue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIApprovalModal;
