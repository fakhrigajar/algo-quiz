export type NodeType = 'START_END' | 'PROCESS' | 'DECISION' | 'OUTPUT';

export interface FlowNode {
  id: string;
  type: NodeType;
  label: string[];
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string; // e.g., '+', '-', 'Yes', 'No'
  fromSide?: 'top' | 'bottom' | 'left' | 'right';
  toSide?: 'top' | 'bottom' | 'left' | 'right';
  path?: { x: number; y: number }[]; // optional manual path
}

export interface FlowchartData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface QuizQuestion {
  id: number;
  title: string;
  description: string;
  flowchart: FlowchartData;
  options: string[];
  correctAnswer: number; // index in options
}
