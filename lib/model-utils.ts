export function getModelIcon(modelName: string): string {
    const n = modelName.toLowerCase();
    if (n.includes('code'))     return '💻';
    if (n.includes('llama'))    return '🦙';
    if (n.includes('mistral'))  return '🌪️';
    if (n.includes('gemma'))    return '💎';
    if (n.includes('qwen'))     return '🧠';
    if (n.includes('deepseek')) return '🔍';
    if (n.includes('phi'))      return '🔬';
    if (n.includes('falcon'))   return '🦅';
    if (n.includes('vicuna'))   return '🦜';
    if (n.includes('solar'))    return '☀️';
    if (n.includes('wizard'))   return '🧙';
    if (n.includes('neural'))   return '🧩';
    if (n.includes('dolphin'))  return '🐬';
    if (n.includes('orca'))     return '🐋';
    if (n.includes('starcoder') || n.includes('starling')) return '⭐';
    return '🤖';
}
