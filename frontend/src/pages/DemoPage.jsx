import React, { useState, useEffect, useRef } from "react";
import { AIStatusBadge } from "../components/AIStatusBadge";
import { AIOrchestrator } from "../components/AIOrchestrator";
import { AIActivityTimeline } from "../components/AIActivityTimeline";
import { AIResultPanel } from "../components/AIResultPanel";
import { AIApprovalModal } from "../components/AIApprovalModal";
import { ArchitectureDiagram } from "../components/ArchitectureDiagram";
import { useAgentStream } from "../hooks/useAgentStream";
import { getPendingStatus } from "../api/aiAPI";

export function DemoPage() {
  const [threadId, setThreadId] = useState(null);
  const [agentType, setAgentType] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [riskResult, setRiskResult] = useState(null);
  const [showArchitecture, setShowArchitecture] = useState(false);

  // Live WebSocket streaming hook
  const { events, streaming } = useAgentStream(threadId);
  const pollIntervalRef = useRef(null);

  // Check pending status on backend for interrupt gates
  const syncTaskStatus = async (targetThreadId) => {
    if (!targetThreadId) return;
    try {
      const statusData = await getPendingStatus(targetThreadId);
      if (statusData) {
        if (statusData.current_agent) {
          setAgentType(statusData.current_agent);
        }
        if (statusData.final_result) {
          setFinalResult(statusData.final_result);
        }

        if (statusData.pending_approval) {
          setPendingApproval(true);
          setRiskResult(statusData.final_result);
        } else {
          setPendingApproval(false);
        }
      }
    } catch (err) {
      console.warn("Could not sync task status:", err);
    }
  };

  // Called when AIOrchestrator initiates a task
  const handleTaskStarted = (newThreadId, userMessage, initialResult) => {
    setThreadId(newThreadId);
    setPendingApproval(false);
    setRiskResult(null);

    if (initialResult) {
      setAgentType(initialResult.current_agent || initialResult.task_type);
      setFinalResult(initialResult.final_result);

      if (initialResult.requires_human_approval && initialResult.final_result) {
        setPendingApproval(true);
        setRiskResult(initialResult.final_result);
      }
    }

    // Clear any existing poll
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Start background sync poll every 2 seconds
    pollIntervalRef.current = setInterval(() => {
      syncTaskStatus(newThreadId);
    }, 2000);
  };

  // Stop polling when streaming completes and do one final check
  useEffect(() => {
    if (!streaming && threadId) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      syncTaskStatus(threadId);
    }
  }, [streaming, threadId]);

  // Clean up poll on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Handle decision from Human Approval Modal
  const handleApprovalDecision = async (decision, note, response) => {
    setPendingApproval(false);
    if (response) {
      setAgentType(response.current_agent || "human_approval");
      if (response.final_result) {
        setFinalResult(response.final_result);
      }
    }
    // Final sync
    setTimeout(() => {
      syncTaskStatus(threadId);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-900/50">
            ⬡
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-100 tracking-tight">
              Hackathon Multi-Agent Orchestrator
            </h1>
            <p className="text-[11px] text-gray-400">
              LangGraph StateGraph • ChromaDB Embeddings • Human-in-the-Loop Interrupt Gate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowArchitecture((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs font-medium text-gray-300 transition"
          >
            {showArchitecture ? "Hide Architecture" : "Show Architecture"}
          </button>
          <AIStatusBadge />
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Orchestrator Input + Live Activity Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <AIOrchestrator onTaskStarted={handleTaskStarted} />
          <AIActivityTimeline threadId={threadId} events={events} streaming={streaming} />
        </div>

        {/* Right Column: Structured Analytical Result Panel */}
        <div className="lg:col-span-5 sticky top-20">
          <AIResultPanel result={finalResult} agentType={agentType} pendingApproval={pendingApproval} />
        </div>
      </main>

      {/* Architecture Diagram (toggle) */}
      {showArchitecture && (
        <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 pb-6">
          <ArchitectureDiagram />
        </section>
      )}

      {/* Human-in-the-Loop Interrupt Approval Modal */}
      <AIApprovalModal
        threadId={threadId}
        riskResult={riskResult}
        visible={pendingApproval}
        onDecision={handleApprovalDecision}
      />
    </div>
  );
}

export default DemoPage;

