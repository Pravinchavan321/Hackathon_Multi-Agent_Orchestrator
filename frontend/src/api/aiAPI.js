const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:8080";
};

export const checkHealth = async () => {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Health check failed (${response.status}): ${errText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const orchestrate = async (message, threadId = null, hackathonId = null) => {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/ai/orchestrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        goal: message,
        thread_id: threadId,
        hackathon_id: hackathonId,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const detail = errData?.detail ? (typeof errData.detail === 'object' ? JSON.stringify(errData.detail) : errData.detail) : await response.text().catch(() => "");
      throw new Error(`Orchestration failed (${response.status}): ${detail}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const getPendingStatus = async (threadId) => {
  if (!threadId) throw new Error("threadId is required for getPendingStatus");
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/ai/tasks/${threadId}/pending`);
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const detail = errData?.detail ? (typeof errData.detail === 'object' ? JSON.stringify(errData.detail) : errData.detail) : await response.text().catch(() => "");
      throw new Error(`Get pending status failed (${response.status}): ${detail}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const submitApproval = async (threadId, decision, note = "") => {
  if (!threadId) throw new Error("threadId is required for submitApproval");
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/ai/tasks/${threadId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        decision,
        note,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const detail = errData?.detail ? (typeof errData.detail === 'object' ? JSON.stringify(errData.detail) : errData.detail) : await response.text().catch(() => "");
      throw new Error(`Approval submission failed (${response.status}): ${detail}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const getSubmissionsKnowledge = async () => {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/ai/knowledge/submissions`);
    if (!response.ok) throw new Error("Failed to fetch submissions knowledge");
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const getParticipantsKnowledge = async () => {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/ai/knowledge/participants`);
    if (!response.ok) throw new Error("Failed to fetch participants knowledge");
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const searchKnowledge = async (query, targetType = "submissions", nResults = 4) => {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/ai/knowledge/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, target_type: targetType, n_results: nResults }),
    });
    if (!response.ok) throw new Error("Failed to perform vector search");
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const getSystemOverview = async () => {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/ai/system/overview`);
    if (!response.ok) throw new Error("Failed to fetch system overview");
    return await response.json();
  } catch (error) {
    throw error;
  }
};

