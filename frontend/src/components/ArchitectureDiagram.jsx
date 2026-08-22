import React from "react";

export function ArchitectureDiagram() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 overflow-x-auto">
      <h3 className="text-sm font-bold text-gray-300 mb-4 text-center tracking-wide uppercase">
        System Architecture — LangGraph Multi-Agent Orchestrator
      </h3>

      <svg
        viewBox="0 0 960 620"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-4xl mx-auto"
        style={{ minWidth: "700px" }}
      >
        <defs>
          {/* Arrow marker */}
          <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#6b7280" />
          </marker>
          <marker id="arrow-blue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#60a5fa" />
          </marker>
          <marker id="arrow-rose" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#fb7185" />
          </marker>
          <marker id="arrow-emerald" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#34d399" />
          </marker>
        </defs>

        {/* ── TRANSPORT LAYER (gray) ── */}
        <rect x="20" y="10" width="920" height="65" rx="12" fill="#1f2937" stroke="#374151" strokeWidth="1" />
        <text x="480" y="30" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="600" letterSpacing="1.5">TRANSPORT LAYER</text>

        {/* React Frontend */}
        <rect x="40" y="38" width="140" height="28" rx="6" fill="#374151" stroke="#4b5563" strokeWidth="1" />
        <text x="110" y="56" textAnchor="middle" fill="#d1d5db" fontSize="11" fontWeight="600">React + Vite</text>

        {/* REST arrow */}
        <line x1="180" y1="52" x2="310" y2="52" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" strokeDasharray="4,3" />
        <text x="245" y="46" textAnchor="middle" fill="#9ca3af" fontSize="9">REST</text>

        {/* WebSocket arrow */}
        <line x1="180" y1="60" x2="310" y2="60" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" strokeDasharray="4,3" />
        <text x="245" y="70" textAnchor="middle" fill="#9ca3af" fontSize="9">WebSocket</text>

        {/* FastAPI */}
        <rect x="310" y="38" width="160" height="28" rx="6" fill="#374151" stroke="#4b5563" strokeWidth="1" />
        <text x="390" y="56" textAnchor="middle" fill="#d1d5db" fontSize="11" fontWeight="600">FastAPI (port 8080)</text>

        {/* LangSmith (orange) */}
        <rect x="720" y="20" width="200" height="45" rx="10" fill="#7c2d12" stroke="#c2410c" strokeWidth="1.5" />
        <text x="820" y="38" textAnchor="middle" fill="#fdba74" fontSize="10" fontWeight="700" letterSpacing="1">🔭 LANGSMITH</text>
        <text x="820" y="52" textAnchor="middle" fill="#fb923c" fontSize="9">Tracing &amp; Observability</text>

        {/* Dotted line from FastAPI to LangSmith */}
        <line x1="470" y1="45" x2="720" y2="45" stroke="#c2410c" strokeWidth="1" strokeDasharray="3,3" />

        {/* ── ORCHESTRATOR (blue) ── */}
        <rect x="340" y="100" width="200" height="50" rx="12" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />
        <text x="440" y="122" textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="700">Orchestrator Node</text>
        <text x="440" y="138" textAnchor="middle" fill="#60a5fa" fontSize="9">LLM intent classifier</text>

        {/* Arrow from FastAPI down to Orchestrator */}
        <line x1="390" y1="66" x2="440" y2="100" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* ── CONDITIONAL ROUTING DIAMOND ── */}
        <polygon points="440,175 480,195 440,215 400,195" fill="#1e293b" stroke="#60a5fa" strokeWidth="1.5" />
        <text x="440" y="199" textAnchor="middle" fill="#93c5fd" fontSize="8" fontWeight="600">ROUTE</text>

        {/* Arrow from Orchestrator to Diamond */}
        <line x1="440" y1="150" x2="440" y2="175" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />

        {/* ── LEFT: Submission Agent (blue) ── */}
        <rect x="60" y="245" width="180" height="50" rx="12" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />
        <text x="150" y="267" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="700">Submission Agent</text>
        <text x="150" y="283" textAnchor="middle" fill="#60a5fa" fontSize="9">Score + Novelty via ChromaDB</text>

        {/* Arrow from Diamond to Submission */}
        <line x1="400" y1="195" x2="240" y2="265" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="305" y="225" textAnchor="middle" fill="#60a5fa" fontSize="9" fontStyle="italic">submission</text>

        {/* ── CENTER-LEFT: Team Agent (blue) ── */}
        <rect x="280" y="245" width="160" height="50" rx="12" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />
        <text x="360" y="267" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="700">Team Agent</text>
        <text x="360" y="283" textAnchor="middle" fill="#60a5fa" fontSize="9">Skill Match via ChromaDB</text>

        {/* Arrow from Diamond to Team */}
        <line x1="420" y1="210" x2="360" y2="245" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="380" y="230" textAnchor="middle" fill="#60a5fa" fontSize="9" fontStyle="italic">team</text>

        {/* ── CENTER-RIGHT: Risk Agent (blue) ── */}
        <rect x="500" y="245" width="160" height="50" rx="12" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />
        <text x="580" y="267" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="700">Risk Agent</text>
        <text x="580" y="283" textAnchor="middle" fill="#60a5fa" fontSize="9">Anomaly &amp; Integrity Check</text>

        {/* Arrow from Diamond to Risk */}
        <line x1="460" y1="210" x2="580" y2="245" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
        <text x="530" y="225" textAnchor="middle" fill="#60a5fa" fontSize="9" fontStyle="italic">risk</text>

        {/* ── RIGHT: Unclear / END (gray) ── */}
        <rect x="720" y="245" width="140" height="50" rx="12" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" />
        <text x="790" y="267" textAnchor="middle" fill="#9ca3af" fontSize="11" fontWeight="700">END (unclear)</text>
        <text x="790" y="283" textAnchor="middle" fill="#6b7280" fontSize="9">Clarification response</text>

        {/* Arrow from Diamond to Unclear */}
        <line x1="480" y1="195" x2="720" y2="265" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" strokeDasharray="4,3" />
        <text x="620" y="225" textAnchor="middle" fill="#9ca3af" fontSize="9" fontStyle="italic">unclear</text>

        {/* ── NEEDS APPROVAL DIAMOND (from Risk) ── */}
        <polygon points="580,330 620,350 580,370 540,350" fill="#1e293b" stroke="#fb7185" strokeWidth="1.5" />
        <text x="580" y="353" textAnchor="middle" fill="#fda4af" fontSize="7" fontWeight="600">APPROVE?</text>

        {/* Arrow from Risk to Approval Diamond */}
        <line x1="580" y1="295" x2="580" y2="330" stroke="#fb7185" strokeWidth="1.5" markerEnd="url(#arrow-rose)" />

        {/* ── HUMAN APPROVAL NODE (rose/red) ── */}
        <rect x="480" y="390" width="200" height="50" rx="12" fill="#4c0519" stroke="#f43f5e" strokeWidth="2" />
        <text x="580" y="412" textAnchor="middle" fill="#fda4af" fontSize="11" fontWeight="700">⚠ Human Approval</text>
        <text x="580" y="428" textAnchor="middle" fill="#fb7185" fontSize="9">interrupt_before gate</text>

        {/* Arrow from Approval Diamond to Human Approval */}
        <line x1="560" y1="365" x2="560" y2="390" stroke="#f43f5e" strokeWidth="1.5" markerEnd="url(#arrow-rose)" />
        <text x="535" y="382" textAnchor="middle" fill="#fb7185" fontSize="8">HIGH</text>

        {/* Arrow from Approval Diamond to END (auto_complete) */}
        <line x1="620" y1="350" x2="720" y2="480" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" strokeDasharray="4,3" />
        <text x="690" y="410" textAnchor="middle" fill="#34d399" fontSize="8">LOW/MED</text>

        {/* ── END NODE (green) ── */}
        <rect x="350" y="470" width="120" height="40" rx="20" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
        <text x="410" y="495" textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="700">END</text>

        {/* Arrows from agents to END */}
        <line x1="150" y1="295" x2="370" y2="475" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
        <line x1="360" y1="295" x2="400" y2="470" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
        <line x1="580" y1="440" x2="470" y2="480" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />

        {/* ── DATA STORES (purple) ── */}
        <rect x="20" y="530" width="920" height="75" rx="12" fill="#1e1b2e" stroke="#7c3aed" strokeWidth="1" />
        <text x="480" y="548" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="600" letterSpacing="1.5">DATA LAYER</text>

        {/* MongoDB */}
        <rect x="50" y="558" width="200" height="36" rx="8" fill="#2e1065" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="150" y="580" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="600">🗄 MongoDB</text>
        <text x="150" y="590" textAnchor="middle" fill="#a78bfa" fontSize="8">State + Checkpoints</text>

        {/* Redis */}
        <rect x="310" y="558" width="200" height="36" rx="8" fill="#2e1065" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="410" y="580" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="600">⚡ Redis</text>
        <text x="410" y="590" textAnchor="middle" fill="#a78bfa" fontSize="8">Cache + Pub/Sub</text>

        {/* ChromaDB */}
        <rect x="570" y="558" width="200" height="36" rx="8" fill="#2e1065" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="670" y="580" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="600">🔍 ChromaDB</text>
        <text x="670" y="590" textAnchor="middle" fill="#a78bfa" fontSize="8">Vector Embeddings</text>

        {/* structlog label */}
        <rect x="810" y="558" width="110" height="36" rx="8" fill="#431407" stroke="#c2410c" strokeWidth="1.5" />
        <text x="865" y="578" textAnchor="middle" fill="#fdba74" fontSize="10" fontWeight="600">structlog</text>
        <text x="865" y="590" textAnchor="middle" fill="#fb923c" fontSize="8">JSON logs</text>

        {/* Dotted lines from agents down to data stores */}
        <line x1="150" y1="295" x2="150" y2="555" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
        <line x1="360" y1="295" x2="410" y2="555" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
        <line x1="580" y1="295" x2="670" y2="555" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />

        {/* Legend */}
        <rect x="40" y="355" width="12" height="12" rx="3" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
        <text x="58" y="365" fill="#93c5fd" fontSize="9">Agent Nodes</text>

        <rect x="40" y="375" width="12" height="12" rx="3" fill="#2e1065" stroke="#8b5cf6" strokeWidth="1" />
        <text x="58" y="385" fill="#c4b5fd" fontSize="9">Data Stores</text>

        <rect x="40" y="395" width="12" height="12" rx="3" fill="#374151" stroke="#4b5563" strokeWidth="1" />
        <text x="58" y="405" fill="#d1d5db" fontSize="9">Transport</text>

        <rect x="40" y="415" width="12" height="12" rx="3" fill="#7c2d12" stroke="#c2410c" strokeWidth="1" />
        <text x="58" y="425" fill="#fdba74" fontSize="9">Observability</text>

        <rect x="40" y="435" width="12" height="12" rx="3" fill="#4c0519" stroke="#f43f5e" strokeWidth="1" />
        <text x="58" y="445" fill="#fda4af" fontSize="9">Human Gate</text>
      </svg>
    </div>
  );
}

export default ArchitectureDiagram;
