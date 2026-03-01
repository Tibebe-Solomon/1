import React, { useState, useEffect } from "react";

interface LensProps {
    isOpen: boolean;
    onClose: () => void;
    code: string;
    language: string;
}

export const Lens: React.FC<LensProps> = ({ isOpen, onClose, code, language }) => {
    const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
    const [srcDoc, setSrcDoc] = useState("");

    useEffect(() => {
        if (!code) {
            setSrcDoc("");
            return;
        }
        const lang = language?.toLowerCase() || "";
        if (lang === "html" || lang === "html/css" || lang === "xml" || lang === "svg") {
            setSrcDoc(code);
        } else if (lang === "css") {
            setSrcDoc(`
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: system-ui, sans-serif; padding: 32px; color: #111; background: #fafafa; display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
                    .preview-box { background: white; border: 1px solid #ddd; padding: 24px; border-radius: 12px; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                    ${code}
                  </style>
                </head>
                <body>
                  <div class="preview-box">
                    <h2>CSS Environment Preview</h2>
                    <p>This is a sample layout injected to demonstrate your custom CSS rules.</p>
                    <button class="btn button primary">Sample Button</button>
                    <input type="text" placeholder="Sample Input" class="input card" />
                  </div>
                </body>
                </html>
            `);
        } else if (lang === "javascript" || lang === "js" || lang === "typescript" || lang === "ts" || lang === "jsx" || lang === "tsx") {
            // Encode code safely for the script tag to prevent breaking out of it
            const scriptContent = code.replace(/<\/script>/gi, '<\\/script>');
            setSrcDoc(`
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: system-ui, sans-serif; padding: 20px; color: #333; background: #fff; margin: 0; }
                    pre { background: #f4f4f5; padding: 12px; border-radius: 8px; margin: 0; overflow-x: auto; font-size: 13px; line-height: 1.5; color: #18181b; }
                    .error { color: #ef4444; font-weight: 500; }
                    #output-container { display: flex; flex-direction: column; gap: 8px; }
                  </style>
                </head>
                <body>
                  <div id="output-container"></div>
                  <script>
                    const container = document.getElementById('output-container');
                    const originalLog = console.log;
                    const originalError = console.error;
                    const originalWarn = console.warn;
                    
                    function appendLog(type, args) {
                        const div = document.createElement('pre');
                        if (type === 'error') div.className = 'error';
                        if (type === 'warn') div.style.color = '#eab308';
                        div.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
                        container.appendChild(div);
                    }

                    console.log = function(...args) { appendLog('log', args); originalLog.apply(console, args); };
                    console.error = function(...args) { appendLog('error', args); originalError.apply(console, args); };
                    console.warn = function(...args) { appendLog('warn', args); originalWarn.apply(console, args); };
                    
                    window.onerror = function(msg, url, line) {
                        appendLog('error', ['Uncaught Error:', msg, 'at line', line]);
                        return false;
                    };

                    try {
                        ${scriptContent}
                    } catch(e) {
                        console.error(e.toString());
                    }
                  </script>
                </body>
                </html>
            `);
        } else {
            setSrcDoc(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>body { font-family: system-ui, sans-serif; padding: 20px; color: #333; background: #fff; }</style>
        </head>
        <body>
          <p>Preview not supported for ${language}. This environment executes HTML, CSS, JS, and TS.</p>
        </body>
        </html>
      `);
        }
    }, [code, language]);

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 bottom-0 z-40 w-full sm:w-[480px] lg:w-[600px] border-l border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg)] shadow-[0_0_40px_rgba(0,0,0,0.1)] flex flex-col transition-transform duration-300 transform translate-x-0">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-bw-rainbow text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" /></svg>
                    </div>
                    <span className="text-[14px] font-semibold text-[color:var(--vynthen-fg)]">Lens Workspace</span>
                </div>
                <div className="flex items-center gap-1">
                    {/* Tabs */}
                    <div className="flex bg-[color:var(--vynthen-bg)] rounded-lg p-0.5 border border-[color:var(--vynthen-border)] mr-2">
                        <button type="button" onClick={() => setActiveTab("preview")}
                            className={`px-3 py-1 text-[12px] font-medium rounded-md transition-colors ${activeTab === "preview" ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] shadow-sm" : "text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)]"}`}>
                            Preview
                        </button>
                        <button type="button" onClick={() => setActiveTab("code")}
                            className={`px-3 py-1 text-[12px] font-medium rounded-md transition-colors ${activeTab === "code" ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] shadow-sm" : "text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)]"}`}>
                            Code
                        </button>
                    </div>

                    <button type="button" onClick={onClose} aria-label="Close Lens"
                        className="btn-icon w-8 h-8 rounded-full flex items-center justify-center text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-border)] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white relative overflow-hidden">
                {activeTab === "preview" ? (
                    <iframe
                        title="Lens Preview"
                        srcDoc={srcDoc}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts allow-modals allow-forms allow-popups"
                    />
                ) : (
                    <div className="w-full h-full overflow-auto bg-[color:var(--vynthen-bg)] p-4">
                        <pre className="text-[13px] font-mono text-[color:var(--vynthen-fg)] leading-relaxed"><code className={`language-${language}`}>{code}</code></pre>
                    </div>
                )}
            </div>

        </div>
    );
};
