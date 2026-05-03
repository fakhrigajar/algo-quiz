import React from "react";
import { FlowchartData, FlowNode, FlowEdge } from "../types";

interface FlowchartProps {
  data: FlowchartData;
  className?: string;
}

const Flowchart: React.FC<FlowchartProps> = ({ data, className }) => {
  const renderNode = (node: FlowNode) => {
    const { id, type, label, x, y, width = 120, height = 50 } = node;
    const halfW = width / 2;
    const halfH = height / 2;

    switch (type) {
      case "PROCESS":
        return (
          <g key={id}>
            <rect
              x={x - halfW}
              y={y - halfH}
              width={width}
              height={height}
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            {label.map((line, i) => (
              <text
                key={i}
                x={x}
                y={y - (label.length - 1) * 8 + i * 20}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono text-xs fill-slate-400 font-medium"
              >
                {line}
              </text>
            ))}
          </g>
        );
      case "DECISION":
        const points = `${x},${y - halfH} ${x + halfW},${y} ${x},${y + halfH} ${x - halfW},${y}`;
        return (
          <g key={id}>
            <polygon
              points={points}
              fill="#312e81"
              stroke="#6366f1"
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            {label.map((line, i) => (
              <text
                key={i}
                x={x}
                y={y - (label.length - 1) * 8 + i * 20}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono text-xs fill-white font-bold"
              >
                {line}
              </text>
            ))}
          </g>
        );
      case "START_END":
        return (
          <g key={id}>
            <rect
              x={x - halfW}
              y={y - halfH}
              width={width}
              height={height}
              rx={height / 2}
              fill="#1e293b"
              stroke="#4f46e5"
              strokeWidth="2.5"
              className="drop-shadow-sm"
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-mono text-sm fill-white font-bold uppercase tracking-wider"
            >
              {label[0]}
            </text>
          </g>
        );
      case "OUTPUT":
        const x1 = x - halfW;
        const x2 = x + halfW;
        const y1 = y - halfH;
        const y2 = y + halfH - 10;
        const pathData = `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} Q ${x + halfW / 2} ${y2 + 15} ${x} ${y2} Q ${x - halfW / 2} ${y2 - 15} ${x1} ${y2} Z`;

        return (
          <g key={id}>
            <path
              d={pathData}
              fill="#0f172a"
              stroke="#475569"
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            <text
              x={x}
              y={y - 4}
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-mono text-sm fill-slate-300 font-medium"
            >
              {label[0]}
            </text>
          </g>
        );
      default:
        return null;
    }
  };

  const getPoint = (
    nodeId: string,
    side?: string,
  ): { x: number; y: number } => {
    const node = data.nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const { x, y, width = 120, height = 50 } = node;
    const halfW = width / 2;
    const halfH = height / 2;

    switch (side) {
      case "top":
        return { x, y: y - halfH };
      case "bottom":
        return { x, y: y + halfH };
      case "left":
        return { x: x - halfW, y };
      case "right":
        return { x: x + halfW, y };
      default:
        return { x, y };
    }
  };

  const renderEdge = (edge: FlowEdge, index: number) => {
    const start = getPoint(edge.from, edge.fromSide);
    const end = getPoint(edge.to, edge.toSide);

    let path = `M ${start.x} ${start.y}`;

    if (edge.path) {
      edge.path.forEach((p) => {
        path += ` L ${p.x} ${p.y}`;
      });
      path += ` L ${end.x} ${end.y}`;
    } else {
      // Automatic Orthogonal Routing
      if (edge.fromSide === "bottom" && edge.toSide === "top") {
        if (start.x === end.x) {
          path += ` L ${end.x} ${end.y}`;
        } else {
          const midY = (start.y + end.y) / 2;
          path += ` L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
        }
      } else if (edge.fromSide === "right" && edge.toSide === "top") {
        path += ` L ${end.x} ${start.y} L ${end.x} ${end.y}`;
      } else if (edge.fromSide === "left" && edge.toSide === "top") {
        path += ` L ${end.x} ${start.y} L ${end.x} ${end.y}`;
      } else if (edge.fromSide === "right" && edge.toSide === "left") {
        path += ` L ${end.x} ${start.y} L ${end.x} ${end.y}`;
      } else {
        path += ` L ${end.x} ${end.y}`;
      }
    }

    return (
      <g key={`edge-${index}`}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
          </marker>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="#475569"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        {edge.label && (
          <g>
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

              return (
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  className="fill-indigo-400 text-[11px] font-black font-mono tracking-tighter"
                >
                  {edge.label}
                </text>
              );
            })()}
          </g>
        )}
      </g>
    );
  };

  return (
    <div
      className={`w-full h-full bg-slate-950/50 relative overflow-hidden flex items-center justify-center ${className}`}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#6366f1 0.8px, transparent 0.8px)",
          backgroundSize: "32px 32px",
        }}
      ></div>
      <svg
        viewBox="0 0 500 450"
        preserveAspectRatio="xMidYMid meet"
        className="w-full max-h-full p-4 relative z-10 max-w-lg"
      >
        {data.edges.map((edge, i) => renderEdge(edge, i))}
        {data.nodes.map((node) => renderNode(node))}
      </svg>
    </div>
  );
};

export default Flowchart;
