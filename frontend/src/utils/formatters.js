function timeGreeting(currentHour) {
  if (currentHour >= 5 && currentHour < 12) return "Good morning";
  if (currentHour >= 12 && currentHour < 18) return "Good afternoon";
  return "Good evening";
}

export function generateGreeting(hourly, currentHour = new Date().getHours()) {
  if (!hourly?.length) {
    return "Welcome to GridSight. Run your first forecast to see predictions.";
  }

  let peakEntry = hourly[0];
  let peakIndex = 0;
  hourly.forEach((entry, index) => {
    if (entry.predicted_ac_power_kw > peakEntry.predicted_ac_power_kw) {
      peakEntry = entry;
      peakIndex = index;
    }
  });

  const peakKw = peakEntry.predicted_ac_power_kw.toFixed(1);
  const peakTime = new Date(peakEntry.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (currentHour >= 22 || currentHour < 5) {
    return `Panels resting. Tomorrow's peak: ${peakKw} kW at ${peakTime}.`;
  }

  const greeting = timeGreeting(currentHour);

  if (peakIndex > 0 && new Date(peakEntry.timestamp) > new Date()) {
    return `${greeting}. Your panels peak at ${peakTime} today — ${peakKw} kW expected.`;
  }

  return `${greeting}. Today's peak was ${peakKw} kW at ${peakTime}.`;
}

export function generateHistoryInsight(dailySummary) {
  if (!dailySummary?.length) return null;

  if (dailySummary.length === 1) {
    const day = dailySummary[0];
    const ratio = day.demand_kwh > 0 ? day.total_kwh / day.demand_kwh : 0;
    if (ratio > 1) {
      return `Yesterday you generated ${ratio.toFixed(1)}× your daily demand.`;
    }
    return `Yesterday's generation covered ${Math.round(ratio * 100)}% of your demand.`;
  }

  const totalGen = dailySummary.reduce((sum, d) => sum + d.total_kwh, 0);
  const totalDemand = dailySummary.reduce((sum, d) => sum + (d.demand_kwh ?? 0), 0);
  const ratio = totalDemand > 0 ? totalGen / totalDemand : 0;

  const bestDay = dailySummary.reduce(
    (best, d) => (d.total_kwh > best.total_kwh ? d : best),
    dailySummary[0]
  );
  const worstDay = dailySummary.reduce(
    (worst, d) => (d.total_kwh < worst.total_kwh ? d : worst),
    dailySummary[0]
  );

  if (ratio > 2) {
    return `This week you generated ${ratio.toFixed(1)}× your total demand. Strong performance.`;
  }
  if (ratio > 1) {
    return `Surplus week. Best day was ${bestDay.date} with ${bestDay.total_kwh} kWh generated.`;
  }
  return `Generation covered ${Math.round(ratio * 100)}% of demand this week. ${worstDay.date} was the weakest day.`;
}
