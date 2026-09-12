export default function AIRecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            GridSight AI Recommendation
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            AI analysis based on forecast, weather, system state and energy knowledge
          </p>
        </div>

        {recommendation.risk_level && (
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium uppercase text-text-primary">
            {recommendation.risk_level} Risk
          </span>
        )}
      </div>

      {recommendation.summary && (
        <div className="mb-5">
          <p className="text-base font-semibold text-text-primary">
            {recommendation.summary}
          </p>
        </div>
      )}

      {recommendation.current_situation && (
        <div className="mb-4">
          <p className="mb-1 text-sm font-medium text-text-primary">
            Current Situation
          </p>
          <p className="text-sm leading-6 text-text-secondary">
            {recommendation.current_situation}
          </p>
        </div>
      )}

      {recommendation.forecast_analysis && (
        <div className="mb-4">
          <p className="mb-1 text-sm font-medium text-text-primary">
            Forecast Analysis
          </p>
          <p className="text-sm leading-6 text-text-secondary">
            {recommendation.forecast_analysis}
          </p>
        </div>
      )}

      {recommendation.weather_analysis && (
        <div className="mb-4">
          <p className="mb-1 text-sm font-medium text-text-primary">
            Weather Analysis
          </p>
          <p className="text-sm leading-6 text-text-secondary">
            {recommendation.weather_analysis}
          </p>
        </div>
      )}

      {recommendation.storage_analysis && (
        <div className="mb-5">
          <p className="mb-1 text-sm font-medium text-text-primary">
            Storage Analysis
          </p>
          <p className="text-sm leading-6 text-text-secondary">
            {recommendation.storage_analysis}
          </p>
        </div>
      )}

      {recommendation.recommended_actions?.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-text-primary">
            Recommended Actions
          </p>

          <ol className="space-y-2">
            {recommendation.recommended_actions.map((action, index) => (
              <li
                key={index}
                className="flex gap-3 rounded-lg border border-border p-3 text-sm text-text-secondary"
              >
                <span className="font-semibold text-primary">
                  {index + 1}.
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {recommendation.reasoning?.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">
            Why this recommendation?
          </p>

          <ul className="space-y-1">
            {recommendation.reasoning.map((reason, index) => (
              <li
                key={index}
                className="text-sm leading-6 text-text-secondary"
              >
                • {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendation.knowledge_sources?.length > 0 && (
        <p className="mt-5 text-xs text-text-secondary">
          Grounded in {recommendation.knowledge_sources.length} energy
          knowledge source
          {recommendation.knowledge_sources.length !== 1 ? "s" : ""}.
        </p>
      )}
    </div>
  );
}