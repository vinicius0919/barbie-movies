# Recuperação de senha do MiqFlix

## Arquitetura auditada

- `barbie-movies`: frontend público React 19, Vite, React Router, Axios com cookies, CSS convencional. Login/cadastro em `src/pages/AuthPage.jsx`, rotas em `src/App.jsx`, sessão em `src/contexts/AuthContext.jsx`, cliente em `src/services/api.js`.
- `movies-api`: Express/CommonJS e MongoDB/Mongoose. `models/User.js` é dono de nome, e-mail, `passwordHash`, papel e favoritos. `controllers/authController.js`, `routes/auth.js` e `middlewares/authenticate.js` implementam cadastro/login/JWT HS256 em cookie HttpOnly `miqflix_session`, válido por sete dias. Senhas: bcryptjs, custo 12, mínimo de 8 caracteres e máximo de 72 bytes UTF-8.
- `miqflix-subscriptions-mvp`: servidor Express/ESM para planos, pagamentos e assinaturas (`server/src/models/{Plan,Payment,Subscription}.js`); integra pelo ID do usuário e chave interna. Cliente separado para checkout. Não gerencia credenciais nem precisa de alterações.
- Não havia recuperação de senha, refresh tokens ou provedor de e-mail. Nenhum AGENTS.md foi encontrado nos três projetos. Alterações preexistentes em package.json/package-lock.json dos projetos foram preservadas; diretório Microsoft/ preexistente não foi alterado.

## Endpoints

- `POST /api/auth/forgot-password`: `{ "email": "usuario@exemplo.com" }`. E-mail normalizado e validado. Resposta 202 genérica para contas existentes, inexistentes ou limitadas por conta; não confirma entrega. Configuração indisponível retorna 503 igualmente para qualquer conta. E-mail inválido retorna 400. Limite por IP retorna 429.
- `POST /api/auth/reset-password`: `{ "token": "64 caracteres heinválido retorna 400. Limite por IP retorna 429.
- `POST /api/auth/reset-password`: `{ "token": "64 caracteres hexadecimais", "password": "nova senha" }`. Retorna 200; token inválido/expirado/consumido ou senha inválida retorna 400. Limite por IP retorna 429. Falha operacional retorna 503.

Token: crypto.randomBytes(32), apenas SHA-256 persistido no User, validade de 30 minutos, cada solicitação substitui o anterior. Verificação de expiração, troca da senha, remoção do token e incremento de sessionVersion ocorrem em uma atualização MongoDB atômica. Não exige replica set/transação. Papéis, favoritos, ID e assinaturas são preservados.

Sessões: JWTs novos carregam `sv`; authenticate compara com sessionVersion no banco. JWTs anteriores sem `sv` continuam válidos como versão zero até a primeira redefinição. Depois da redefinição, todos os cookies antigos são rejeitados. Não há refresh tokens nesta arquitetura.

Limites compartilhados no MongoDB: 10 solicitações por IP, 3 por e-mail e 20 tentativas de redefinição por IP, por janela fixa de 30 minutos. A chave do contador é SHA-256 e a coleção `recoveryratelimits` possui índice TTL. Contadores expiram após até duas janelas; a validade lógica não depende da remoção TTL. Falha no armazenamento bloqueia a requisição. O limite por conta mantém resposta genérica.

## Variáveis e SMTP

Configure `movies-api/.env` conforme `movies-api/.env.example`; não sobrescreva os valores existentes:

| Variável | Valor esperado |
| --- | --- |
| PASSWORD_RESET_ORIGIN | Origem do frontend sem caminho/query/fragmento. HTTPS obrigatório em produção. Ex.: https://seu-dominio |
| SMTP_HOST | Host fornecido pelo provedor SMTP |
| SMTP_PORT | 465 para TLS direto ou 587 para STARTTLS, conforme o provedor |
| SMTP_SECURE | true para TLS direto; false para STARTTLS ou SMTP local |
| SMTP_USER / SMTP_PASS | Credenciais do provedor; ambos juntos. Vazios somente quando o servidor permite envio sem autenticação |
| SMTP_FROM | Remetente autorizado pelo provedor, por exemplo MiqFlix <no-reply@seu-dominio> |
| FRONTEND_URL | Origem do frontend já utilizada no CORS |
| TRUST_PROXY | IPs/CIDRs exatos dos proxies confiáveis separados por vírgula; vazio na execução direta |

Mantenha `MONGODB_URI`, `JWT_SECRET`, `SUBSCRIPTIONS_API_URL` e `INTERNAL_API_KEY` existentes. No frontend, `VITE_API_URL` continua apontando para a API (com `/api`) ou usa o proxy `/api`; nenhuma credencial SMTP vai ao frontend.

O e-mail tem versões HTML e texto, identidade MiqFlix, prazo e orientação de ignorar solicitações não reconhecidas. O backend constrói o link da origem configurada, nunca do Host recebido. TLS é obrigatório para SMTP em produção. Logs de SMTP estão desativados. Falha de entrega gera mensagem operacional fixa e revoga somente o token correspondente; não registra e-mail, token ou erro bruto do provedor.

O envio acontece no processo após responder 202, evitando revelar existência por tempo de entrega SMTP. Não há promessa de entrega no HTTP. Se o processo morrer durante o envio, o usuário deve solicitar outro link; para hospedagem serverless, use um worker com fila segura e ciclo de vida garantido antes de publicar. O deployment atual usa servidor Node persistente. Monitore os erros fixos `[PASSWORD RECOVERY]`.

## Testar localmente

1. Execute MongoDB local e um capturador SMTP, por exemplo Mailpit (SMTP 1025, interface 8025). Use apenas contas de teste.
2. Configure `PASSWORD_RESET_ORIGIN=http://localhost:5173`, `SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025`, `SMTP_SECURE=false`, `SMTP_FROM=MiqFlix <no-reply@example.com>`, usuário/senha SMTP vazios no Mailpit. Configure o JWT_SECRET existente (mínimo 32 caracteres).
3. Em `movies-api`, execute `npm ci` e `npm run dev`. Em `barbie-movies`, execute `npm ci` e `npm run dev`. Confira o proxy Vite ou VITE_API_URL e CORS.
4. Cadastre uma conta, entre em `/login` e clique em **Esqueci minha senha**. Envie o e-mail e abra a mensagem no capturador local. Abra o link na mesma origem configurada.
5. Verifique que `#token=...` desaparece da barra; defina e confirme a senha. Faça login com a senha nova. A senha antiga e sessões abertas anteriormente devem falhar.
6. Tente usar o link outra vez, peça outro link e verifique que o antigo falha. Teste e-mail inexistente, ausência de SMTP e o limite de solicitações.

O link usa fragmento, que não é enviado ao servidor web nem no Referer. O documento aplica `no-referrer`. O token é capturado antes dos providers React e removido por replaceState; fica apenas em memória, nunca em localStorage/sessionStorage. Recarregar a página após a remoção exige abrir novamente o link do e-mail. O backend também responde com Cache-Control no-store. Não configure analytics que capturem URLs/corpos de recuperação.

## Verificação automatizada

- Backend: `npm test` — integração HTTP com aplicação Express real e MongoDB temporário independente do banco de desenvolvimento. O primeiro uso pode baixar o binário MongoDB. Inclui transporte SMTP real contra servidor local de testes, sem envio externo.
- Frontend: `npm test` — Vitest, Testing Library e jsdom, com API simulada para verificar estados, validação, navegação, token e acessibilidade semântica.
- Frontend: `npx eslint src/App.jsx src/main.jsx src/pages/AuthPage.jsx src/pages/PasswordRecoveryPage.jsx src/services/api.js src/utils/recoveryToken.js tests vitest.config.js`.
- Frontend: `npm run build` e `npm run lint`. O lint global tem problemas fora desta alteração; não foram feitas refatorações alheias ao escopo. Backend e serviço de assinaturas não tinham scripts de lint/build/test, exceto o novo test no backend.

## Produção

Configure origem HTTPS, remetente verificado, SMTP real, autenticação/TLS e DNS SPF/DKIM/DMARC. Configure os proxies confiáveis corretamente para limitar pelo IP real; não use confiança irrestrita em X-Forwarded-For. Garanta permissões de índices MongoDB (User.passwordResetHash e TTL de RecoveryRateLimit), saída SMTP e processo persistente. Faça um teste de entrega real e de sessões no domínio publicado. Valide os avisos de npm audit existentes antes de liberar; não foram aplicadas atualizações amplas fora do escopo.

## Arquivos

Backend criados: `.env.example`, `controllers/passwordRecoveryController.js`, `models/RecoveryRateLimit.js`, `services/recoveryEmailService.js`, `services/recoveryRateLimit.js`, `tests/passwordRecovery.test.js`, `tests/recoveryEmail.test.js`.

Backend modificados: `controllers/authController.js`, `middlewares/authenticate.js`, `models/User.js`, `routes/auth.js`, `index.js`, `package.json`, `package-lock.json`.

Frontend criados: `src/pages/PasswordRecoveryPage.jsx`, `src/utils/recoveryToken.js`, `vitest.config.js`, `tests/setup.js`, `tests/passwordRecovery.test.jsx`, `PASSWORD_RECOVERY.md`.

Frontend modificados: `src/pages/AuthPage.jsx`, `src/pages/AuthPage.css`, `src/services/api.js`, `src/App.jsx`, `src/main.jsx`, `index.html`, `package.json`, `package-lock.json`.

Commit sugerido: `feat(auth): implement secure password recovery with SMTP and session revocation`

## Resultados executados

- Backend: 17 testes aprovados, com MongoDB isolado, aplicação real, envio/rejeição SMTP, concorrência, revogação de sessões, regressão de cadastro/logout, CORS e proteção dos logs.
- Frontend: 9 testes aprovados; build Vite aprovado; lint dos arquivos alterados aprovado.
- Lint global: 26 erros e 5 avisos. Comparação pelo ESLint com os arquivos em HEAD confirmou exatamente os mesmos 26 erros e 5 avisos no código anterior.
- `git diff --check` e verificação de sintaxe Node dos módulos novos e entrada do backend aprovados.
- `npm audit`: backend com 9 alertas (3 moderados, 5 altos, 1 crítico); frontend com 17 (1 baixo, 5 moderados, 11 altos). No backend, o crítico reportado é proxy-addr; os demais incluem axios, body-parser, brace-expansion, follow-redirects, minimatch, nodemon, qs e undici. A instalação não recebeu correções amplas automáticas. Esses alertas devem ser revisados antes da produção.
- Entrega de e-mail externo com credenciais reais e validação visual em navegador/dispositivos reais não executadas.
