import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

const MARGIN = { top: 20, right: 30, bottom: 50, left: 50 };
const AMBER = "#F59E0B";
const GRID = "#334155";

export default function ForecastChart({ forecast, noForecast }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!forecast?.hourly?.length || !width) return;

    const hourly = forecast.hourly;
    const height = 380;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const parsedData = hourly.map((d) => ({
      timestamp: new Date(d.timestamp),
      kw: d.predicted_ac_power_kw,
    }));

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(parsedData, (d) => d.timestamp))
      .range([0, innerWidth]);

    const maxKw = d3.max(parsedData, (d) => d.kw) || 0;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxKw * 1.1 || 1])
      .range([innerHeight, 0])
      .nice();

    // Y gridlines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(""))
      .selectAll("line")
      .attr("stroke", GRID)
      .attr("stroke-opacity", 0.5);
    g.select(".grid .domain").remove();

    // X axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeHour.every(6))
      .tickFormat(d3.timeFormat("%H:%M"));
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((sel) => sel.selectAll("text").attr("fill", "#94A3B8").style("font-size", "10px"))
      .call((sel) => sel.selectAll("line,path").attr("stroke", GRID));

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale))
      .call((sel) => sel.selectAll("text").attr("fill", "#94A3B8").style("font-size", "10px"))
      .call((sel) => sel.selectAll("line,path").attr("stroke", GRID));

    g.append("text")
      .attr("x", -MARGIN.left + 10)
      .attr("y", -8)
      .attr("fill", "#94A3B8")
      .style("font-size", "10px")
      .text("kW");

    // Day boundary markers at hour index 24 and 48
    [
      { index: 24, label: "Day 2" },
      { index: 48, label: "Day 3" },
    ].forEach(({ index, label }) => {
      if (!parsedData[index]) return;
      const x = xScale(parsedData[index].timestamp);
      g.append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", GRID)
        .attr("stroke-dasharray", "4,4");
      g.append("text")
        .attr("x", x)
        .attr("y", -8)
        .attr("fill", "#94A3B8")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(label);
    });

    // Current time marker — closest timestamp to now
    const now = new Date();
    let closest = parsedData[0];
    let closestDiff = Math.abs(closest.timestamp - now);
    for (const d of parsedData) {
      const diff = Math.abs(d.timestamp - now);
      if (diff < closestDiff) {
        closest = d;
        closestDiff = diff;
      }
    }
    const nowX = xScale(closest.timestamp);
    g.append("line")
      .attr("x1", nowX)
      .attr("x2", nowX)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", AMBER)
      .attr("stroke-width", 2);

    // Line
    const line = d3
      .line()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.kw))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", AMBER)
      .attr("stroke-width", 2)
      .attr("d", line);

    // Tooltip interaction
    const tooltip = d3.select(tooltipRef.current);
    const bisect = d3.bisector((d) => d.timestamp).left;

    const focusDot = g
      .append("circle")
      .attr("r", 4)
      .attr("fill", AMBER)
      .style("display", "none");

    const overlay = g
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    overlay
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const x0 = xScale.invert(mx);
        let idx = bisect(parsedData, x0, 1);
        idx = Math.min(idx, parsedData.length - 1);
        const d0 = parsedData[idx - 1];
        const d1 = parsedData[idx];
        const d = !d0 ? d1 : x0 - d0.timestamp > d1.timestamp - x0 ? d1 : d0;

        focusDot
          .style("display", null)
          .attr("cx", xScale(d.timestamp))
          .attr("cy", yScale(d.kw));

        tooltip
          .style("display", "block")
          .style("left", `${event.clientX + 12}px`)
          .style("top", `${event.clientY - 24}px`)
          .html(`${d3.timeFormat("%d %b %H:%M")(d.timestamp)}<br/>${d.kw.toFixed(2)} kW`);
      })
      .on("mouseleave", () => {
        focusDot.style("display", "none");
        tooltip.style("display", "none");
      });
  }, [forecast, width]);

  if (!forecast || noForecast) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p
        className="mb-2 text-text-primary"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 600 }}
      >
        72-Hour Forecast
      </p>
      <div ref={containerRef} className="relative w-full">
        <svg ref={svgRef} style={{ background: "transparent" }} />
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-50 rounded-md border border-border bg-card px-2 py-1 text-xs text-text-primary shadow-lg"
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
