# expo-template

Template Expo (React Native + Expo Router) em TypeScript com configuração de qualidade pronta: ESLint, Prettier, Lefthook + lint-staged e release automático com semantic-release. Use este repositório como ponto de partida para apps Expo (suporte web incluso via expo).

---

## Primeiros passos (após clonar)

Ao clonar este repositório como template, o projeto ainda terá o nome, versão e histórico do template. Siga um dos fluxos abaixo.

### Opção 1: Script automático (recomendado)

Execute **uma vez** após clonar. O script:

- Define o **nome** do projeto no `package.json` com o nome do repositório (extraído do `git remote origin`)
- Zera a **versão** para `0.0.0`
- **Remove** o `CHANGELOG.md` do template
- Atualiza o **primeiro commit** com a mensagem `chore: first commit` (incluindo essas alterações)

```bash
git clone <URL_DO_SEU_REPO>
cd <nome-do-repo>

npm run init
```

Depois:

```bash
npm install
npm run prepare   # instala os git hooks (lefthook)
npm run start
```

> **Importante:** o script usa o nome do repositório a partir de `git remote get-url origin`. Configure o remote antes de rodar `npm run init` se você clonou por outro meio.

### Opção 2: Passos manuais

1. **Altere o nome e a versão** em `package.json`:
   - `name`: nome do seu projeto (recomendado: mesmo nome do repositório)
   - `version`: `0.0.0`

2. **Remova o changelog do template:** apague o arquivo `CHANGELOG.md` (o semantic-release criará um novo ao fazer releases).

3. **Padronize o primeiro commit** (opcional):

   ```bash
   git add -A
   git commit --amend -m "chore: first commit"
   ```

   > Modificar o último commit reescreve o histórico. Se já tiver enviado ao remoto, será necessário `git push --force-with-lease origin <branch>` (use com cuidado).

4. **Instale dependências e prepare os hooks:**

   ```bash
   npm install
   npm run prepare
   npm run start
   ```

---

## Tecnologias principais

- Expo + Expo Router (navegação baseada em filesystem)
- React Native (suporte web via expo)
- TypeScript
- ESLint + Prettier
- Lefthook + lint-staged (hooks pre-commit)
- GitHub Actions + semantic-release (controle de versão)

- **Node:** `>=20.9.0` (definido em `engines` no `package.json`).

---

## Qualidade e boas práticas

- **Sempre** rode antes de commitar:
  - `npm run format` — formata o código
  - `npm run lint` — verifica regras de lint
  - `npm run start` — inicia o app em desenvolvimento (verifica que o projeto roda)

- **Git hooks (Lefthook):** o `prepare` instala hooks que rodam Prettier e ESLint nos arquivos staged. Mantenha `npm run prepare` após clonar.

- **Commits:** prefira mensagens no padrão [Conventional Commits](https://www.conventionalcommits.org/) (ex.: `feat:`, `fix:`, `chore:`) para o semantic-release gerar changelog e versões corretamente.

- **Componentes:**
  - Use os componentes em `components/ui` como base; para novos componentes reutilizáveis, crie-os em `components/`.
  - Prefira composição e wrappers em vez de duplicar comportamento.

- **i18n:** não configurado por padrão neste template.

---

## Comandos úteis

```bash
# Desenvolvimento
npm run start        # Expo Dev (Metro)
npm run web          # expo web (dev)

# Emuladores / devices
npm run ios
npm run android

# Qualidade
npm run format
npm run lint
npx lefthook run pre-commit

# Template helpers
npm run init         # ajusta name/version, remove CHANGELOG, atualiza primeiro commit
npm run reset-project
```

---

## Releases automatizados

O repositório usa **semantic-release** na CI: a cada push em `main` (após o workflow de CI passar), o job de release pode criar tags, GitHub Release e atualizar o `CHANGELOG.md`. A publicação no npm está **desativada** por padrão (`release.config.js`).

- **Tokens:** o workflow usa `GITHUB_TOKEN`; se precisar de permissões extras (ex.: branch protection), crie um Personal Access Token com escopo `repo` e defina o secret `SEMANTIC_RELEASE_TOKEN`.
- **Branch protection:** em repositórios com proteção em `main`, pode ser necessário permitir que o GitHub Actions faça push (ou usar o token acima).

O workflow de release está em `.github/workflows/release.yml` e depende do CI (`.github/workflows/ci.yml`).

---

Se precisar de ajuda com algo específico, abra uma issue ou envie uma PR. Obrigado por usar o template.
