// Apply the same content rule to questions saved before the math-only update.
export function isMathQuestion(question) {
  const text = [question.title, question.description, ...(question.flowchart?.nodes ?? []).flatMap(node => node.label)].join(' ');
  return !/%|\bremainder\b|\bquotient\b|integer division|\balphabet\b|\bINDEX\(|\bLETTER\(/i.test(text);
}
