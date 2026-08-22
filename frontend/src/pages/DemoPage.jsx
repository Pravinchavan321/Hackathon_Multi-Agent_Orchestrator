import React, { useState, useEffect, useRef } from "react";
import { AIStatusBadge } from "../components/AIStatusBadge";
import { AIOrchestrator } from "../components/AIOrchestrator";
import { AIActivityTimeline } from "../components/AIActivityTimeline";
import { AIResultPanel } from "../components/AIResultPanel";
import { AIApprovalModal } from "../components/AIApprovalModal";
import { ArchitectureDiagram } from "../components/ArchitectureDiagram";
import { ChromaKnowledgeExplorer } from "../components/ChromaKnowledgeExplorer";
import { RiskAuditPanel } from "../components/RiskAuditPanel";
import { AgentSpecsOverview } from "../components/AgentSpecsOverview";
import { useAgentStream } from "../hooks/useAgentStream";
import { getPendingStatus } from "../api/aiAPI";

export function DemoPage() {
  const [activeTab, setActiveTab] = useState("orchestrator"); // "orchestrator" | "knowledge" | "risk" | "architecture"
  const [threadId, setThreadId] = useState(null);
  const [agentType, setAgentType] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [riskResult, setRiskResult] = useState(null);

  // Live WebSocket streaming hook
  const { events, streaming, clearEvents } = useAgentStream(threadId);
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

  const handleReset = () => {
    setThreadId(null);
    setAgentType(null);
    setFinalResult(null);
    setPendingApproval(false);
    setRiskResult(null);
    clearEvents();
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
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

  const handleTriggerRiskScenario = () => {
    setActiveTab("orchestrator");
  };

  return (
    <div className="min-h-screen bg-[#080d1a] bg-mesh text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-black/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-900/60 ring-2 ring-white/10 animate-pulse">
            ⬡
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
                Hackathon Multi-Agent Orchestrator
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 font-mono font-semibold hidden md:inline">
                LangGraph StateGraph v2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Semantic Vector Search (ChromaDB) • MongoDB Checkpoints • Human-in-the-Loop Interrupt Gate
            </p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/90 rounded-2xl border border-slate-800/90 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("orchestrator")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "orchestrator"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-950/70"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <span>⚡</span>
            <span>Live Orchestrator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("knowledge")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "knowledge"
                ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-950/70"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <span>🔍</span>
            <span>ChromaDB Explorer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("risk")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "risk"
                ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-950/70"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <span>🛡️</span>
            <span>Integrity & Risk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("architecture")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "architecture"
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-950/70"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <span>📐</span>
            <span>Architecture & Specs</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {threadId && activeTab === "orchestrator" && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-xs font-medium text-gray-300 hover:text-white transition cursor-pointer"
            >
              Reset State
            </button>
          )}

          <AIStatusBadge />
        </div>
      </header>

      {/* Main Content Area Based on Active Tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tab 1: Live Autonomous Orchestrator */}
        {activeTab === "orchestrator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
            {/* Left Column: Orchestrator Input + Live Activity Timeline */}
            <div className="lg:col-span-7 space-y-6">
              <AIOrchestrator
                onTaskStarted={handleTaskStarted}
                onReset={handleReset}
              />
              <AIActivityTimeline
                threadId={threadId}
                events={events}
                streaming={streaming}
                agentType={agentType}
                finalResult={finalResult}
              />
            </div>

            {/* Right Column: Structured Analytical Result Panel */}
            <div className="lg:col-span-5 sticky top-20">
              <AIResultPanel
                result={finalResult}
                agentType={agentType}
                pendingApproval={pendingApproval}
                streaming={streaming}
              />
            </div>
          </div>
        )}

        {/* Tab 2: ChromaDB Vector Knowledge Base */}
        {activeTab === "knowledge" && (
          <div className="animate-fadeIn">
            <ChromaKnowledgeExplorer />
          </div>
        )}

        {/* Tab 3: Risk & Integrity Audit Center */}
        {activeTab === "risk" && (
          <div className="animate-fadeIn">
            <RiskAuditPanel onTestScenario={handleTriggerRiskScenario} />
          </div>
        )}

        {/* Tab 4: System Architecture & Agent Specs */}
        {activeTab === "architecture" && (
          <div className="space-y-6 animate-fadeIn">
            <ArchitectureDiagram />
            <AgentSpecsOverview />
          </div>
        )}
      </main>

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

