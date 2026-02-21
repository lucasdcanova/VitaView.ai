/**
 * Script de pre-render para gerar HTML estático das landing pages.
 *
 * Usa esbuild para compilar os componentes React com mocks do Framer Motion,
 * depois renderiza com ReactDOMServer.renderToString().
 *
 * Output: dist/landing/*.html
 */
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST_LANDING = path.resolve(ROOT, 'dist', 'landing');

// Páginas para pre-renderizar
const PAGES = [
  { route: '/', component: '../client/src/pages/landing-page.tsx', output: 'index.html' },
  { route: '/termos', component: '../client/src/pages/terms-page.tsx', output: 'termos.html' },
  { route: '/privacidade', component: '../client/src/pages/privacy-page.tsx', output: 'privacidade.html' },
  // quick-summary usa useAuth, não pode ser pre-renderizada como HTML estático
];

// Template HTML base
function htmlTemplate(title, description, bodyHtml, cssContent) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no" />

  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  <meta name="keywords" content="exames médicos, análise bioquímica, inteligência artificial, saúde, laboratório, diagnóstico, prontuário eletrônico">
  <meta name="robots" content="index, follow">
  <meta name="language" content="Portuguese">
  <meta name="author" content="VitaView AI">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="/LOGO%20COM%20TEXTO.PNG">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="/LOGO%20COM%20TEXTO.PNG">

  <!-- Theme and Icons -->
  <meta name="theme-color" content="#212121">
  <link rel="icon" type="image/png" href="/logo_rounded.png" />
  <link rel="apple-touch-icon" href="/logo_rounded.png" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">

  <!-- Landing Page CSS (compiled Tailwind) -->
  <style>${cssContent}</style>

  <!-- Landing Animations CSS -->
  <link rel="stylesheet" href="/landing-animations.css">
</head>
<body>
  ${bodyHtml}

  <!-- Landing Animations JS (vanilla, ~3KB) -->
  <script src="/landing-animations.js"></script>
</body>
</html>`;
}

async function prerenderPage(page) {
  const entryFile = path.resolve(__dirname, 'ssr-entry.tsx');

  // Criar entry point temporário que importa e renderiza o componente
  const entryContent = `
import React from 'react';
import { renderToString } from 'react-dom/server';
import Component from '${page.component}';

const html = renderToString(React.createElement(Component));
process.stdout.write(html);
`;

  fs.writeFileSync(entryFile, entryContent);

  try {
    // Compilar com esbuild, substituindo framer-motion pelo mock
    const outfile = path.resolve(__dirname, '_ssr-bundle.cjs');

    await build({
      entryPoints: [entryFile],
      bundle: true,
      outfile,
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      jsx: 'automatic',
      jsxImportSource: 'react',
      alias: {
        'framer-motion': path.resolve(__dirname, 'framer-motion-ssr-mock.ts'),
        '@/components/ui/button': path.resolve(ROOT, 'client/src/components/ui/button.tsx'),
        '@/components/ui/logo': path.resolve(ROOT, 'client/src/components/ui/logo.tsx'),
        '@/lib/utils': path.resolve(ROOT, 'client/src/lib/utils.ts'),
        '@': path.resolve(ROOT, 'client/src'),
        'wouter': path.resolve(__dirname, 'wouter-ssr-mock.ts'),
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.css': 'empty',
      },
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      logLevel: 'warning',
    });

    // Executar o bundle e capturar o HTML
    const html = execSync(`node --experimental-vm-modules "${outfile}"`, {
      encoding: 'utf-8',
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });

    // Limpar
    fs.unlinkSync(outfile);

    return html;
  } finally {
    fs.unlinkSync(entryFile);
  }
}

async function compileTailwindCSS() {
  console.log('  Compilando Tailwind CSS para landing pages...');

  const contentPaths = [
    './client/src/pages/landing-page.tsx',
    './client/src/pages/terms-page.tsx',
    './client/src/pages/privacy-page.tsx',
    './client/src/pages/quick-summary-page.tsx',
    './client/src/components/landing-page/**/*.tsx',
    './client/src/components/ui/button.tsx',
    './client/src/components/ui/logo.tsx',
  ].join(',');

  const outputCss = path.resolve(DIST_LANDING, 'landing.css');

  try {
    execSync(
      `npx tailwindcss -i ./client/src/index.css -o "${outputCss}" --content "${contentPaths}" --minify`,
      { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe' }
    );

    return fs.readFileSync(outputCss, 'utf-8');
  } catch (error) {
    console.error('  Erro ao compilar Tailwind CSS:', error.message);
    // Fallback: usar o CSS já compilado pelo Vite build
    const viteCSS = path.resolve(ROOT, 'dist/public/assets');
    if (fs.existsSync(viteCSS)) {
      const cssFiles = fs.readdirSync(viteCSS).filter(f => f.endsWith('.css'));
      if (cssFiles.length > 0) {
        console.log('  Usando CSS compilado pelo Vite como fallback...');
        return fs.readFileSync(path.resolve(viteCSS, cssFiles[0]), 'utf-8');
      }
    }
    throw error;
  }
}

async function main() {
  console.log('Pre-rendering landing pages...\n');

  // Criar diretório de output
  fs.mkdirSync(DIST_LANDING, { recursive: true });

  // Compilar Tailwind CSS
  const cssContent = await compileTailwindCSS();

  // Pre-renderizar cada página
  for (const page of PAGES) {
    console.log(`  Renderizando ${page.route} -> ${page.output}`);

    try {
      const bodyHtml = await prerenderPage(page);

      const titles = {
        '/': 'VitaView AI — Prontuário Inteligente com IA para Médicos',
        '/termos': 'Termos de Uso - VitaView AI',
        '/privacidade': 'Política de Privacidade - VitaView AI',
        '/quick-summary': 'Resumo Rápido - VitaView AI',
      };

      const descriptions = {
        '/': 'Prontuário inteligente que organiza exames, prescrições e histórico do paciente com IA. Transcrição de voz, análise laboratorial e agenda integrada. LGPD compliant.',
        '/termos': 'Termos de Uso da plataforma VitaView AI.',
        '/privacidade': 'Política de Privacidade da plataforma VitaView AI.',
        '/quick-summary': 'Resumo rápido sobre a plataforma VitaView AI.',
      };

      const html = htmlTemplate(
        titles[page.route],
        descriptions[page.route],
        bodyHtml,
        cssContent
      );

      fs.writeFileSync(path.resolve(DIST_LANDING, page.output), html);
      console.log(`  ✓ ${page.output} gerado com sucesso`);
    } catch (error) {
      console.error(`  ✗ Erro ao renderizar ${page.route}:`, error.message);
      // Não interrompe o build por causa de uma página
    }
  }

  console.log('\nPre-render concluído!');
  console.log(`Output: ${DIST_LANDING}`);
}

main().catch((error) => {
  console.error('Erro fatal no pre-render:', error);
  process.exit(1);
});
