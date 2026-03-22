# VitaView Desktop

Shell Electron para Windows e macOS no mesmo repositório do VitaView. O app desktop carrega a instância publicada em `https://vitaview.ai/auth`, então:

- mudanças web entram para todos os usuários imediatamente;
- o auto-update só precisa atualizar o shell desktop quando ele mudar;
- os instaladores Windows (`.exe`) e macOS (`.dmg`) saem deste pacote, sem empacotar o backend do projeto.

## Estrutura

- `desktop/main.ts`: processo principal do Electron
- `desktop/preload.ts`: bridge segura para o renderer
- `desktop/build/icon.png`: ícone do app empacotado
- `.github/workflows/windows-desktop.yml`: build/release do Windows
- `.github/workflows/mac-desktop.yml`: build/release do macOS

## Comandos

Da raiz do repositório:

```bash
npm run desktop:install
npm run desktop:dev
npm run desktop:dist:win
npm run desktop:dist:mac
```

Ou diretamente dentro de `desktop/`:

```bash
npm install
npm run dev
npm run dist:win
npm run dist:mac
```

## Desenvolvimento local

1. Na raiz, suba a aplicação web: `npm run dev`
2. Em outro terminal, rode o shell desktop: `npm run desktop:dev`

O Electron abrirá `http://localhost:3000/auth`.

## Release e auto-update

Os workflows publicam os instaladores e os metadados de atualização no GitHub Releases:

- Windows: `VitaView-Setup.exe` e `latest.yml`
- macOS: `VitaView-mac.dmg`, `VitaView-mac.zip` e `latest-mac.yml`

O `electron-updater` usa esses metadados para manter o app atualizado tanto no Windows quanto no macOS.

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

Quando a release for publicada, as instalações existentes do VitaView para Windows e macOS passarão a detectar a nova versão automaticamente.

## Assinatura do macOS

Para publicar o build de macOS corretamente via GitHub Actions, configure estes secrets no repositório:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Sem eles, o runner ainda pode gerar artefatos de teste, mas o `.dmg` não ficará assinado/notarizado para distribuição em produção.
