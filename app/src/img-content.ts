export async function svgData(path: string): Promise<string> {
    try {
        const res = await fetch(path);
        if(!res.ok) throw new Error(`Failed: ${res.statusText}`);

        const text = await res.text();
        
        if(text.includes('React.createElement')) {
            const svgContent = extractSvg(text);
            if(svgContent) return svgContent;
            throw new Error('Could not extract svg');
        }

        return text;
    } catch(e) {
        console.error(e);
        throw e;
    }
}

function extractSvg(componentCode: string): string | null {
    try {
        const propsMatch = componentCode.match(/_\w+\s*\(\s*{\s*([^}]+)\s*}/);
        if(!propsMatch) return null;

        const pathMatch = componentCode.match(/d:\s*"([^"]+)"/);
        if(!pathMatch) return null;

        return `<svg ${propsMatch[1].replace(/\s+/g, ' ').trim()}><path d="${pathMatch[1]}"/></svg>`;
    } catch(e) {
        return null;
    }
}