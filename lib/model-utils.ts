export function getModelIcon(modelName: string): string {
    if (modelName.includes('code')) return '💻';
    if (modelName.includes('llama')) return '🦙';
    if (modelName.includes('mistral')) return '🌪️';
    if (modelName.includes('gemma')) return '💎';
    return '🤖';
}
