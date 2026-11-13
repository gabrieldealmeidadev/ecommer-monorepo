# Instruções para o assistente

- Leia `plan.md`, o plano da fase atual e `docs/progress.md` antes de alterações grandes.
- Trabalhe em pequenas etapas; não implemente fases futuras sem autorização.
- Não use Zod.
- Não crie middleware global de tratamento de erros. Trate erros esperados nos controllers usando `return res.status(...).json(...)`.
- Use TypeScript estrito e evite `any`.
- Não exponha segredos nem inclua `.env` no Git.
- Não afirme que testes passaram sem executá-los.
- Não faça commits ou pushes sem autorização.
- Ao terminar, liste arquivos alterados, comandos/testes executados, resultados e pendências.
