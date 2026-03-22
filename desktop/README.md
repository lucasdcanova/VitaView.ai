# VitaView Desktop

Shell Electron para Windows no mesmo repositório do VitaView. O app desktop carrega a instância publicada em `https://vitaview.ai/auth`, então:

- mudanças web entram para todos os usuários imediatamente;
- o auto-update só precisa atualizar o shell desktop quando ele mudar;
- o instalador Windows (`.exe`) sai deste pacote, sem empacotar o backend do projeto.

## Estrutura

- `desktop/main.ts`: processo principal do Electron
- `desktop/preload.ts`: bridge segura para o renderer
- `desktop/build/icon.png`: ícone do app empacotado
- `.github/workflows/windows-desktop.yml`: build/release do Windows

## Comandos

Da raiz do repositório:

```bash
npm run desktop:install
npm run desktop:dev
npm run desktop:dist:win
```

Ou diretamente dentro de `desktop/`:

```bash
npm install
npm run dev
npm run dist:win
```

## Desenvolvimento local

1. Na raiz, suba a aplicação web: `npm run dev`
2. Em outro terminal, rode o shell desktop: `npm run desktop:dev`

O Electron abrirá `http://localhost:3000/auth`.

## Release e auto-update

O workflow publica o instalador NSIS e os metadados (`latest.yml`) no GitHub Releases. O `electron-updater` usa esses metadados para manter o app atualizado.

Fluxo recomendado:

1. Atualize `desktop/package.json` com a nova versão.
2. Faça commit.
3. Crie a tag `desktop-vX.Y.Z`.
4. Envie commit e tag para o GitHub.

Exemplo:

```bash
git tag desktop-v1.0.1
git push origin main --tags
```

Quando a release for publicada, as instalações existentes do VitaView para Windows passarão a detectar a nova versão automaticamente.
