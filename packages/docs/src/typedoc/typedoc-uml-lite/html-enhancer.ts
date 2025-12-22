import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Application } from 'typedoc';

/**
 * HTML Enhancer - Adds interactive Mermaid.js rendering to HTML output
 *
 * This class runs as a postMarkdownRenderAsyncJob and:
 * - Injects Mermaid.js CDN script into HTML pages
 * - Adds theme-aware CSS for light/dark mode support
 * - Sets up MutationObserver for dynamic theme switching
 */
export class HtmlEnhancer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Main enhancement entry point (async job callback)
   * Called after all markdown files are generated
   *
   * @param event - Markdown renderer event (unused but required by signature)
   */
  public async enhance(_event: any): Promise<void> {
    console.log('[UML Plugin] Enhancing HTML output with Mermaid.js');

    const htmlDir = this.findHtmlOutputDir();
    if (!htmlDir) {
      console.warn('[UML Plugin] HTML output directory not found');
      return;
    }

    // Find all HTML files containing mermaid diagrams
    const htmlFiles = this.findHtmlFilesWithMermaid(htmlDir);
    console.log(
      `[UML Plugin] Found ${htmlFiles.length} HTML files with diagrams`,
    );

    if (htmlFiles.length === 0) {
      console.log('[UML Plugin] No diagrams to enhance, skipping');
      return;
    }

    // Inject Mermaid.js script into each file
    for (const file of htmlFiles) {
      await this.injectMermaidScript(file);
    }

    // Create theme CSS file
    await this.createThemeCSS(htmlDir);

    console.log('[UML Plugin] HTML enhancement complete');
  }

  /**
   * Finds the HTML output directory from TypeDoc options
   *
   * @returns Absolute path to HTML output directory, or null if not found
   */
  private findHtmlOutputDir(): string | null {
    const outputs = this.app.options.getValue('outputs') as any[];
    if (!outputs || !Array.isArray(outputs)) {
      return null;
    }

    const htmlOutput = outputs.find((out: any) => out.name === 'html');
    if (!htmlOutput || !htmlOutput.path) {
      return null;
    }

    return path.resolve(htmlOutput.path);
  }

  /**
   * Recursively finds all HTML files containing mermaid class diagrams
   *
   * @param dir - Directory to search
   * @returns Array of absolute file paths
   */
  private findHtmlFilesWithMermaid(dir: string): string[] {
    const files: string[] = [];

    const walk = (currentDir: string): void => {
      let entries;
      try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true });
      } catch (error) {
        console.warn(`[UML Plugin] Cannot read directory: ${currentDir}`);
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith('.html')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            // Look for TypeDoc's code blocks with mermaid class
            if (content.includes('class="mermaid"')) {
              files.push(fullPath);
            }
          } catch (error) {
            console.warn(`[UML Plugin] Cannot read file: ${fullPath}`);
          }
        }
      }
    };

    walk(dir);
    return files;
  }

  /**
   * Injects Mermaid.js CDN script and converts code blocks to Mermaid format
   *
   * @param filePath - Absolute path to HTML file
   */
  private async injectMermaidScript(filePath: string): Promise<void> {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip if already injected
    if (content.includes('mermaid.initialize')) {
      return;
    }

    // Convert TypeDoc's <pre><code class="mermaid"> to simple Mermaid format
    // Pattern: <pre><code class="mermaid">MERMAID_CODE</code>...optional button...</pre>
    const codeBlockPattern = /<pre><code class="mermaid">([\s\S]*?)<\/code>.*?<\/pre>/g;

    content = content.replace(codeBlockPattern, (_match, mermaidCode) => {
      // Keep HTML entities for < and > to prevent HTML parsing issues
      // Mermaid.js will read textContent, and the browser will automatically decode entities
      // Only decode quotes and ampersands that are safe in HTML context
      const decoded = mermaidCode
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');

      // Simple single-block format (like minimal test)
      return `<pre class="mermaid">\n${decoded}\n</pre>`;
    });

    // CRITICAL: Also handle <pre class="mermaid"> blocks (when comment injection is used)
    // TypeDoc may output <pre class="mermaid"> directly without proper escaping
    const directMermaidPattern = /<pre class="mermaid">([\s\S]*?)<\/pre>/g;

    content = content.replace(directMermaidPattern, (_match, mermaidCode) => {
      // Escape < and > to prevent HTML parsing issues with <<stereotype>>
      // Fix TypeDoc's broken &lg; entity for << (if present)
      // Keep already-encoded entities and encode raw < >
      const escaped = mermaidCode
        .replace(/&lg;/g, '&lt;&lt;')       // Fix TypeDoc's broken entity for <<
        .replace(/&lt;/g, '___LT___')      // Temporarily mark already-escaped <
        .replace(/&gt;/g, '___GT___')      // Temporarily mark already-escaped >
        .replace(/</g, '&lt;')             // Escape raw <
        .replace(/>/g, '&gt;')             // Escape raw >
        .replace(/___LT___/g, '&lt;')      // Restore marked <
        .replace(/___GT___/g, '&gt;')      // Restore marked >
        .replace(/&quot;/g, '"')            // Decode quotes (safe in this context)
        .replace(/&#39;/g, "'")             // Decode single quotes
        .replace(/&amp;/g, '&');            // Decode ampersands

      // Return mermaid block with < and > properly escaped
      return `<pre class="mermaid">\n${escaped}\n</pre>`;
    });

    // Calculate relative path to CSS file
    const htmlDir = this.findHtmlOutputDir();
    if (!htmlDir) {
      return;
    }

    const relativePath = path.relative(
      path.dirname(filePath),
      path.join(htmlDir, 'assets'),
    );
    const cssPath = path
      .join(relativePath, 'uml-theme.css')
      .replace(/\\/g, '/');

    const mermaidScript = `
<!-- UML Plugin: Mermaid loader (body末尾配置) -->
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: document.documentElement.dataset.theme === "dark"
      ? "dark"
      : "default",
  });

  // TypeDoc が DOM を構築し終わった後に実行
  requestAnimationFrame(() => {
    mermaid.run({
      querySelector: ".mermaid"
    });
  });

  // テーマ変更時に再レンダリング
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        const newTheme = document.documentElement.dataset.theme;
        const newMermaidTheme = newTheme === 'dark' ? 'dark' : 'default';

        mermaid.initialize({
          startOnLoad: false,
          theme: newMermaidTheme,
          securityLevel: "loose",
        });

        // 元のコンテンツを保持して再レンダリング
        const elements = document.querySelectorAll('.mermaid');
        elements.forEach((el) => {
          if (!el.dataset.mermaidOriginal) {
            el.dataset.mermaidOriginal = el.textContent || '';
          }
          el.textContent = el.dataset.mermaidOriginal;
        });

        requestAnimationFrame(() => {
          mermaid.run({ querySelector: ".mermaid" });
        });
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
</script>
`;

    const cssLink = `<link rel="stylesheet" href="${cssPath}"/>`;

    // Inject CSS before </head>
    content = content.replace('</head>', `${cssLink}\n</head>`);

    // Inject Mermaid script before </body>
    content = content.replace('</body>', `${mermaidScript}\n</body>`);

    // Write back
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Creates theme-aware CSS file for Mermaid diagrams
   *
   * @param htmlDir - HTML output directory
   */
  private async createThemeCSS(htmlDir: string): Promise<void> {
    const assetsDir = path.join(htmlDir, 'assets');

    // Create assets directory if it doesn't exist
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const cssPath = path.join(assetsDir, 'uml-theme.css');

    const css = `
/* UML Plugin: Theme-aware Mermaid diagram styling (Minimal Format) */

/* Mermaid pre element - simple container */
pre.mermaid {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  padding: 1rem;
  background: var(--color-background-secondary, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--color-accent, #dee2e6);
  overflow-x: auto;
}

/* Light theme specifics */
[data-theme="light"] pre.mermaid {
  background: #f8f9fa;
  border-color: #dee2e6;
}

/* Dark theme specifics */
[data-theme="dark"] pre.mermaid {
  background: #1a1d1e;
  border-color: #373b3d;
}

/* SVG sizing and responsiveness */
pre.mermaid svg {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

/* Make diagrams responsive on mobile */
@media (max-width: 768px) {
  pre.mermaid {
    padding: 0.5rem;
    margin: 1rem 0;
    font-size: 0.875rem;
  }
}

/* Smooth transitions when theme changes */
pre.mermaid {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
`;

    fs.writeFileSync(cssPath, css, 'utf-8');
    console.log('[UML Plugin] Created theme CSS at', cssPath);
  }
}
