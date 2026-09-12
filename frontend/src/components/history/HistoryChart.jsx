import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

const MARGIN = { top: 30, right: 20, bottom: 40, left: 50 };
const AMBER = "#F59E0B";
const BLUE = "#3B82F6";
const GRID = "#334155";

export default function HistoryChart({ dailySummary }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dailySummary?.length || !width) return;

    const height = 320;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const parseDate = d3.timeParse("%Y-%m-%d");
    const formatDate = d3.timeFormat("%d %b");
    const dates = dailySummary.map((d) => d.date);

    const x0 = d3.scaleBand().domain(dates).range([0, innerWidth]).padding(0.25);
    const x1 = d3.scaleBand().domain(["generation", "demand"]).range([0, x0.bandwidth()]).padding(0.15);

    const maxValue = d3.max(dailySummary, (d) => Math.max(d.total_kwh, d.demand_kwh ?? 0)) || 0;
    const yScale = d3.scaleLinear().domain([0, maxValue * 1.1 || 1]).range([innerHeight, 0]).nice();

    // Y gridlines
    g.append("g")
      .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(""))
      .selectAll("line")
      .attr("stroke", GRID)
      .attr("stroke-opacity", 0.5);
    g.selectAll(".domain").remove();

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x0).tickFormat((d) => formatDate(parseDate(d))))
      .call((sel) => sel.selectAll("text").attr("fill", "#94A3B8").style("font-size", "11px"))
      .call((sel) => sel.selectAll("line,path").attr("stroke", GRID));

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale))
      .call((sel) => sel.selectAll("text").attr("fill", "#94A3B8").style("font-size", "10px"))
      .call((sel) => sel.selectAll("line,path").attr("stroke", GRID));

    g.append("text")
      .attr("x", -MARGIN.left + 10)
      .attr("y", -12)
      .attr("fill", "#94A3B8")
      .style("font-size", "10px")
      .text("kWh");

    const tooltip = d3.select(tooltipRef.current);

    const dayGroups = g
      .selectAll(".day-group")
      .data(dailySummary)
      .join("g")
      .attr("class", "day-group")
      .attr("transform", (d) => `translate(${x0(d.date)},0)`);

    function showTooltip(event, d) {
      tooltip
        .style("display", "block")
        .style("left", `${event.clientX + 12}px`)
        .style("top", `${event.clientY - 32}px`)
        .html(
          `${formatDate(parseDate(d.date))}<br/>Generation: ${d.total_kwh.toFixed(2)} kWh<br/>Demand: ${(d.demand_kwh ?? 0).toFixed(2)} kWh`
        );
    }
    function hideTooltip() {
      tooltip.style("display", "none");
    }

    dayGroups
      .append("rect")
      .attr("x", x1("generation"))
      .attr("width", x1.bandwidth())
      .attr("y", (d) => yScale(d.total_kwh))
      .attr("height", (d) => innerHeight - yScale(d.total_kwh))
      .attr("fill", AMBER)
      .on("mousemove", showTooltip)
      .on("mouseleave", hideTooltip);

    dayGroups
      .append("rect")
      .attr("x", x1("demand"))
      .attr("width", x1.bandwidth())
      .attr("y", (d) => yScale(d.demand_kwh ?? 0))
      .attr("height", (d) => innerHeight - yScale(d.demand_kwh ?? 0))
      .attr("fill", BLUE)
      .on("mousemove", showTooltip)
      .on("mouseleave", hideTooltip);
  }, [dailySummary, width]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: AMBER }} />
          Generation
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: BLUE }} />
          Demand
        </span>
      </div>
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
