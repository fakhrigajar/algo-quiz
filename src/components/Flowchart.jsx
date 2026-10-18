import React, { useId } from "react";
import { edgePoints, chartBounds } from "../flowchartGeometry.js";
const Flowchart = ({
  data,
  className = ""
}) => {
  const markerId = useId().replaceAll(":", "");
  const bounds = chartBounds(data);
  const renderNode = node => {
    const {
      id,
      type,
      label,
      x,
      y,
      width = 120,
      height = 50
    } = node;
    const halfW = width / 2;
    const halfH = height / 2;
    switch (type) {
      case "PROCESS":
        return <g key={id}>
            <rect x={x - halfW} y={y - halfH} width={width} height={height} fill="#15120f" stroke="#6d6258" strokeWidth="2" className="drop-shadow-sm" />
            {label.map((line, i) => <text key={i} x={x} y={y - (label.length - 1) * 10 + i * 20} textAnchor="middle" dominantBaseline="middle" className="font-mono text-xs fill-slate-400 font-medium">
                {line}
              </text>)}
          </g>;
      case "DECISION":
        const points = `${x},${y - halfH} ${x + halfW},${y} ${x},${y + halfH} ${x - halfW},${y}`;
        return <g key={id}>
            <polygon points={points} fill="#321707" stroke="#ff9500" strokeWidth="2" className="drop-shadow-sm" />
            {label.map((line, i) => <text key={i} x={x} y={y - (label.length - 1) * 10 + i * 20} textAnchor="middle" dominantBaseline="middle" className="font-mono text-xs fill-white font-bold">
                {line}
              </text>)}
          </g>;
      case "START_END":
        return <g key={id}>
            <rect x={x - halfW} y={y - halfH} width={width} height={height} rx={height / 2} fill="#21180f" stroke="#ff7900" strokeWidth="2.5" className="drop-shadow-sm" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="font-mono text-sm fill-white font-bold uppercase tracking-wider">
              {label[0]}
            </text>
          </g>;
      case "OUTPUT":
        const x1 = x - halfW;
        const x2 = x + halfW;
        const y1 = y - halfH;
        const y2 = y + halfH - 10;
        const pathData = `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} Q ${x + halfW / 2} ${y2 + 15} ${x} ${y2} Q ${x - halfW / 2} ${y2 - 15} ${x1} ${y2} Z`;
        return <g key={id}>
            <path d={pathData} fill="#15120f" stroke="#a88b70" strokeWidth="2" className="drop-shadow-sm" />
            <text x={x} y={y - 4} textAnchor="middle" dominantBaseline="middle" className="font-mono text-sm fill-slate-300 font-medium">
              {label[0]}
            </text>
          </g>;
      default:
        return null;
    }
  };
  const renderEdge = (edge, index) => {
    const points = edgePoints(data, edge);
    const start = points[0];
    const path = points.map((point, i) => `${i ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
    return <g key={`edge-${index}`}>
        <defs>
          <marker id={markerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#a88b70" />
          </marker>
        </defs>
        <path d={path} fill="none" stroke="#a88b70" strokeWidth="2" markerEnd={`url(#${markerId})`} />
        {edge.label && <g>
            {(() => {
          // Heuristic for label placement
          let lx = start.x;
          let ly = start.y;
          if (edge.fromSide === "right") {
            lx += 25;
            ly -= 10;
          }
          if (edge.fromSide === "bottom") {
            lx += 10;
            ly += 25;
          }
          if (edge.fromSide === "left") {
            lx -= 25;
            ly -= 10;
          }
          return <text x={lx} y={ly} textAnchor="middle" className="fill-brand-400 text-[11px] font-black font-mono tracking-tighter">
                  {edge.label}
                </text>;
        })()}
          </g>}
      </g>;
  };
  return <div className={`w-full h-full bg-slate-950/50 relative overflow-hidden flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 opacity-10" style={{
      backgroundImage: "radial-gradient(#ff9500 0.8px, transparent 0.8px)",
      backgroundSize: "32px 32px"
    }}></div>
      <svg viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`} role="img" aria-label="Algorithm flowchart" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full p-4 z-10">
        {data.edges.map((edge, i) => renderEdge(edge, i))}
        {data.nodes.map(node => renderNode(node))}
      </svg>
    </div>;
};
export default Flowchart;
