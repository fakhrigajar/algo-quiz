export function edgePoints(data, edge) {
  const point = (id, side) => {
    const node = data.nodes.find(node => node.id === id);
    if (!node) throw new Error(`Unknown flowchart node: ${id}`);
    const { x, y, width = 120, height = 50 } = node;
    return {
      x: x + (side === 'left' ? -width / 2 : side === 'right' ? width / 2 : 0),
      y: y + (side === 'top' ? -height / 2 : side === 'bottom' ? height / 2 : 0),
    };
  };
  const start = point(edge.from, edge.fromSide);
  const end = point(edge.to, edge.toSide);
  let bends = edge.path ?? [];
  if (!edge.path && start.x !== end.x && start.y !== end.y) {
    if (edge.fromSide === 'bottom' && edge.toSide === 'top') {
      const y = (start.y + end.y) / 2;
      bends = [{ x: start.x, y }, { x: end.x, y }];
    } else if (edge.fromSide === 'left' || edge.fromSide === 'right') {
      bends = [{ x: end.x, y: start.y }];
    } else {
      bends = [{ x: start.x, y: end.y }];
    }
  }
  return [start, ...bends, end];
}

export function chartBounds(data) {
  const points = data.nodes.flatMap(({ x, y, width = 120, height = 50 }) => [
    { x: x - width / 2, y: y - height / 2 },
    { x: x + width / 2, y: y + height / 2 },
  ]).concat(data.edges.flatMap(edge => edgePoints(data, edge)));
  const padding = 30;
  const left = Math.min(...points.map(point => point.x)) - padding;
  const top = Math.min(...points.map(point => point.y)) - padding;
  return {
    x: left, y: top,
    width: Math.max(...points.map(point => point.x)) + padding - left,
    height: Math.max(...points.map(point => point.y)) + padding - top,
  };
}
