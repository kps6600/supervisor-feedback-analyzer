"use client";
import { useState } from "react";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">
        🧠 Trinethra Analyzer
      </h1>

      <div className="grid grid-cols-2 gap-6">

        {/* LEFT INPUT */}
        <div>
          <textarea
            className="w-full h-[500px] p-3 bg-[#1e293b] rounded"
            placeholder="Paste supervisor transcript..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />

          <button
            onClick={runAnalysis}
            className="mt-4 px-5 py-2 bg-blue-600 rounded"
          >
            {loading ? "Analyzing..." : "Run Analysis"}
          </button>

          {error && (
            <p className="text-red-400 mt-3">{error}</p>
          )}
        </div>

        {/* RIGHT OUTPUT */}
        <div className="space-y-4">

          {!result && (
            <p className="text-gray-400">
              Results will appear here...
            </p>
          )}

          {result && (
            <>
              {/* SCORE */}
              <div className="bg-[#1e293b] p-4 rounded border border-gray-700">
                <h2 className="text-xl font-bold">
                  Score: {result.score?.value}/10
                </h2>
                <p className="text-sm text-gray-300 mt-2">
                  {result.score?.justification}
                </p>

                <p className="text-yellow-400 text-xs mt-2">
                  ⚠ AI suggestion — requires human review
                </p>
              </div>

              {/* EVIDENCE */}
              <div className="bg-[#1e293b] p-4 rounded">
                <h3 className="font-bold mb-2">Evidence</h3>

                {result.evidence?.map((e: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => setSelectedQuote(e.quote)}
                    className="border p-2 mb-2 cursor-pointer hover:bg-[#0f172a]"
                  >
                    <p className="italic">"{e.quote}"</p>
                    <p className="text-xs text-gray-400">
                      {e.signal} | {e.dimension}
                    </p>
                  </div>
                ))}
              </div>

              {/* KPI */}
              <div className="bg-[#1e293b] p-4 rounded">
                <h3 className="font-bold mb-2">KPIs</h3>
                {result.kpis?.map((k: any, i: number) => (
                  <p key={i}>
                    {k.name} — {k.reason}
                  </p>
                ))}
              </div>

              {/* GAPS */}
              <div className="bg-[#1e293b] p-4 rounded">
                <h3 className="font-bold mb-2">Gaps</h3>
                {result.gaps?.map((g: any, i: number) => (
                  <p key={i}>
                    {g.dimension} — {g.detail}
                  </p>
                ))}
              </div>

              {/* QUESTIONS */}
              <div className="bg-[#1e293b] p-4 rounded">
                <h3 className="font-bold mb-2">Follow-ups</h3>
                {result.questions?.map((q: any, i: number) => (
                  <div key={i}>
                    <p>{q.question}</p>
                    <p className="text-xs text-gray-400">
                      {q.purpose}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* INSPECTOR */}
      {selectedQuote && (
        <div className="fixed bottom-4 right-4 bg-black border p-3">
          <p className="italic">"{selectedQuote}"</p>
          <button onClick={() => setSelectedQuote(null)}>
            close
          </button>
        </div>
      )}
    </div>
  );
}