import { useState } from "react";

export default function AIRecommendationCard({ recommendation }) {
  const [expanded, setExpanded] = useState(false);

  if (!recommendation) return null;

  const hasBreakdown =
    recommendation.current_situation ||
    recommendation.forecast_analysis ||
    recommendation.weather_analysis ||
    recommendation.storage_analysis ||
    recommendation.reasoning?.length > 0 ||
    recommendation.knowledge_sources?.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <p
          className="uppercase text-primary"
          style={{ fontSize: "0.75rem", letterSpacing: "0.1em", fontWeight: 600 }}
        >
          GridSight AI Recommendation
        </p>

        {recommendation.risk_level && (
          <span className="text-xs font-medium uppercase text-text-secondary">
            {recommendation.risk_level} Risk
          </span>
        )}
      </div>

      {recommendation.summary && (
        <p className="mb-5 text-text-primary" style={{ fontSize: "1rem", fontWeight: 500 }}>
          {recommendation.summary}
        </p>
      )}

      {recommendation.recommended_actions?.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-text-primary">
            Recommended Actions
          </p>

          <ol className="flex flex-col" style={{ gap: "16px" }}>
            {recommendation.recommended_actions.map((action, index) => (
              <li key={index} className="flex gap-2 text-sm" style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                <span className="text-text-secondary">{index + 1}.</span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {hasBreakdown && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {expanded ? "Hide full breakdown" : "See full breakdown"}
        </button>
      )}

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          {recommendation.current_situation && (
            <div>
              <p className="mb-1 text-sm font-medium text-text-primary">
                Current Situation
              </p>
              <p className="text-sm leading-6 text-text-secondary">
                {recommendation.current_situation}
              </p>
            </div>
          )}

          {recommendation.forecast_analysis && (
            <div>
              <p className="mb-1 text-sm font-medium text-text-primary">
                Forecast Analysis
              </p>
              <p className="text-sm leading-6 text-text-secondary">
                {recommendation.forecast_analysis}
              </p>
            </div>
          )}

          {recommendation.weather_analysis && (
            <div>
              <p className="mb-1 text-sm font-medium text-text-primary">
                Weather Analysis
              </p>
              <p className="text-sm leading-6 text-text-secondary">
                {recommendation.weather_analysis}
              </p>
            </div>
          )}

          {recommendation.storage_analysis && (
            <div>
              <p className="mb-1 text-sm font-medium text-text-primary">
                Storage Analysis
              </p>
              <p className="text-sm leading-6 text-text-secondary">
                {recommendation.storage_analysis}
              </p>
            </div>
          )}

          {recommendation.reasoning?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-text-primary">
                Why this recommendation?
              </p>
              <ul className="space-y-1">
                {recommendation.reasoning.map((reason, index) => (
                  <li key={index} className="text-sm leading-6 text-text-secondary">
                    • {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.knowledge_sources?.length > 0 && (
            <p className="text-xs text-text-secondary">
              Grounded in {recommendation.knowledge_sources.length} energy
              knowledge source
              {recommendation.knowledge_sources.length !== 1 ? "s" : ""}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
