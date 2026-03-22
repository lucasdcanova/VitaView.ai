# codex

AI agent code analysis refactoring code generation OpenAI Codex GPT-5.2 CLI tool software engineering

# Codex Skill Guide

## Running a Task

1. Default to `gpt-5.2` model. Ask the user which reasoning effort to use (`xhigh`, `high`, `medium`, or `low`).
2. Select the sandbox mode required for the task; default to `--sandbox read-only` unless edits or network access are necessary.
3. Assemble the command with the appropriate options:

* `-m, --model <MODEL>`
* `--config model_reasoning_effort="<high|medium|low>"`
* `--sandbox <read-only|workspace-write|danger-full-access>`
* `--full-auto`
* `-C, --cd <DIR>`
* `--skip-git-repo-check`

4. Always use `--skip-git-repo-check`.
5. By default, append `2>/dev/null` to suppress thinking tokens.
6. Run the command, capture output, and summarize the result.
7. After completion, inform the user they can resume the session.

---

## Quick Reference

| Use case         | Sandbox mode       | Key flags                                |
| ---------------- | ------------------ | ---------------------------------------- |
| Read-only review | read-only          | --sandbox read-only                      |
| Apply edits      | workspace-write    | --sandbox workspace-write --full-auto    |
| Full access      | danger-full-access | --sandbox danger-full-access --full-auto |
| Resume session   | inherited          | resume --last                            |

---

## Model Options

* `gpt-5.2` (default) → engenharia de software geral
* `gpt-5.2-max` → tarefas muito complexas
* `gpt-5.2-mini` → mais barato
* `gpt-5.1-thinking` → raciocínio profundo

---

## Reasoning Levels

* `xhigh` → problemas muito complexos
* `high` → refatoração, arquitetura
* `medium` → tarefas padrão
* `low` → ajustes simples

---

## Following Up

* Após cada execução, perguntar próximos passos
* Para continuar sessão:

echo "novo prompt" | codex exec --skip-git-repo-check resume --last 2>/dev/null

---

## Error Handling

* Parar se houver erro
* Pedir instruções antes de retry
* Avisar sobre resultados parciais

---

## CLI Version

* Requer Codex CLI ≥ v0.57.0
* Verificar com:

codex --version

---

## When to Use

* Refatoração de código
* Análise de bug