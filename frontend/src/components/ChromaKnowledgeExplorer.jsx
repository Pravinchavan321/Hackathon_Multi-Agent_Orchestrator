import React, { useState, useEffect } from "react";
import { getSubmissionsKnowledge, getParticipantsKnowledge, searchKnowledge } from "../api/aiAPI";

export function ChromaKnowledgeExplorer() {
  const [activeTab, setActiveTab] = useState("submissions"); // "submissions" | "participants"
  const [submissions, setSubmissions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subData, partData] = await Promise.all([
        getSubmissionsKnowledge().catch(() => ({ items: [] })),
        getParticipantsKnowledge().catch(() => ({ items: [] })),
      ]);
      setSubmissions(subData.items || []);
      setParticipants(partData.items || []);
    } catch (err) {
      setError("Failed to load knowledge base from ChromaDB");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim() || searching) return;

    setSearching(true);
    setError(null);
    try {
      const data = await searchKnowledge(searchQuery.trim(), activeTab, 4);
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err.message || "Vector search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  return (
    <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 border border-gray-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/50 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-100">
              ChromaDB Vector Knowledge Base Explorer
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Browse dense vector embeddings, test semantic similarity queries, and explore prior art & talent pools.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-gray-950 rounded-xl border border-gray-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("submissions");
              setSearchResults(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "submissions"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            📄 Projects ({submissions.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("participants");
              setSearchResults(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === "participants"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            👥 Talent Profiles ({participants.length})
          </button>
        </div>
      </div>

      {/* Semantic Search Box */}
      <form onSubmit={handleSearch} className="bg-gray-950/80 border border-gray-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="font-semibold text-gray-300">
            Test Vector Similarity Search ({activeTab === "submissions" ? "Submissions Collection" : "Participant Skills Collection"}):
          </span>
          {searchResults && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-[11px] text-gray-500 hover:text-gray-300 underline cursor-pointer"
            >
              Reset search
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "submissions"
                ? "e.g. 'smart contract auditing bot' or 'AI flashcards and study guides'..."
                : "e.g. 'Looking for a senior React and TypeScript frontend developer'..."
            }
            className="flex-1 bg-gray-900 border border-gray-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            {searching ? (
              <span>Searching...</span>
            ) : (
              <>
                <span>🔍</span>
                <span>Vector Search</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-xl text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Search Results Display */}
      {searchResults && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Semantic Search Matches ({searchResults.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
              ChromaDB Cosine / L2 Nearest Neighbor
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {searchResults.map((item, idx) => {
              const score = item.similarity_score || 0;
              const isHigh = score >= 0.45;
              const title = item.title || item.name || "Match";
              const desc = item.description || item.skills_bio || "";

              return (
                <div
                  key={idx}
                  className="p-3.5 bg-gray-950 border border-indigo-500/40 rounded-xl space-y-1.5 shadow-md shadow-indigo-950/20"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-100">{title}</h4>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                        isHigh
                          ? "bg-rose-950 text-rose-300 border-rose-800"
                          : "bg-emerald-950 text-emerald-300 border-emerald-800"
                      }`}
                    >
                      {(score * 100).toFixed(1)}% Match
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-3">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid Collection */}
      {!searchResults && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Indexed {activeTab === "submissions" ? "Projects" : "Talent Profiles"} in Collection:
            </h3>
            <span className="text-[11px] text-gray-500">
              {activeTab === "submissions" ? submissions.length : participants.length} items loaded
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading vector knowledge base...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {activeTab === "submissions"
                ? submissions.map((sub, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-gray-950/70 hover:bg-gray-900/80 border border-gray-800 hover:border-indigo-500/50 rounded-xl transition duration-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
                          <span>📄</span>
                          <span>{sub.title}</span>
                        </h4>
                        <span className="text-[9px] font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                          #{idx + 1}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">{sub.description}</p>
                    </div>
                  ))
                : participants.map((part, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-gray-950/70 hover:bg-gray-900/80 border border-gray-800 hover:border-emerald-500/50 rounded-xl transition duration-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                            {part.name.slice(0, 1)}
                          </span>
                          <span>{part.name}</span>
                        </h4>
                        <span className="text-[9px] font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                          #{idx + 1}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">{part.skills_bio}</p>
                    </div>
                  ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChromaKnowledgeExplorer;
