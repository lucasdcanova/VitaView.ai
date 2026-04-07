# VitaView AI - Instruções para o Claude

## Autonomia

- Aja de forma autônoma. Não peça confirmação para ações rotineiras.
- Execute tarefas completas sem parar para perguntar. Só pergunte quando houver ambiguidade real na intenção do usuário.
- Use todas as ferramentas disponíveis sem hesitar: Bash, browser, MCP, skills.
- Quando encontrar um erro, tente resolver sozinho antes de reportar.

## Git

- Após qualquer modificação de código (VitaView ou Confirma Plantão), faça `git add`, `git commit` com mensagem descritiva, e `git push` automaticamente.
- Não espere o usuário pedir para commitar. Faça após cada bloco de mudanças.
- O usuário não usa IDE, apenas o terminal com Claude Code. O versionamento deve ser constante — cada alteração deve ser commitada e pushada imediatamente.

## Skills disponíveis

Use automaticamente quando relevante:
- `/1password` — buscar credenciais e senhas (vault: Operations)
- `/app-store-connect` — gerenciar apps, builds, versões no App Store Connect
- `/linkedin` — engajamento no LinkedIn
- `/linkedin-post` — publicar posts no LinkedIn
- `/linkedin-chat` — gerenciar mensagens do LinkedIn
- `/vitaview-prospeccao` — prospecção de médicos no LinkedIn
- `/frontend-design` — interfaces de alta qualidade
- `/copywriting` — copy de marketing
- `/saude-livre-marketing` — roteiros de vídeo para Saúde Livre

## Credenciais

- Apple Developer: `lucas.canova@icloud.com` (1Password item ID: 3eeyjqzmfno6fdy4m4l4xsgufm)
- Todas as credenciais estão no 1Password, vault "Operations". Use a skill `/1password` para buscar.

## Projeto

- **Diretório raiz do VitaView:** `/Users/lucascanova/Documents/Projetos/VitaView` — sempre que o usuário pedir alterações no VitaView, usar este caminho diretamente.
- **VitaView** é um sistema de prontuário médico com IA para transcrição de consultas
- Stack: React + TypeScript (frontend), Node.js (backend), Capacitor (mobile iOS/Android)
- Deploy: Render (backend), App Store (iOS), Google Play (Android)
- Banco: PostgreSQL no Neon
- App Store ID: 6759616689, Bundle: `br.com.lucascanova.vitaview`

## Idioma

- Sempre responda em português brasileiro
- Código e termos técnicos permanecem em inglês
- Mensagens de commit em inglês

## Estilo

- Seja direto e conciso. Sem rodeios.
- Não explique o que vai fazer antes de fazer — apenas faça.
- Reporte resultados de forma breve.
- Não adicione comentários, docstrings ou melhorias desnecessárias ao código.
