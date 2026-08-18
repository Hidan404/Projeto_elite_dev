# NOTAS de Aprendizado

Resumo dos conceitos aprendidos em cada sprint. Serve como material de estudo e como documentação de uso de IA (exigência do desafio).

---

## Sprint 1 — Fundação do backend: banco + autenticação

### Conceitos aprendidos

1. **JWT (JSON Web Token)** — Token assinado com chave secreta do servidor. Carrega `sub` (id do usuário) e `role` (papel). É *stateless*: o servidor não guarda sessão, só verifica a assinatura. Inseguro porém garantido: quem tentar adulterar o token, quebra a assinatura e recebe `401`.

2. **Migrations (Alembic) vs `create_all()`** — `create_all()` cria tabelas mas não evolui schema. Alembic versiona cada mudança (`revision --autogenerate` compara models com o banco e gera um script). Essencial em produção, onde o banco não pode ser recriado do zero.

3. **SQLAlchemy 2 (Mapped/mapped_column)** — Cada classe que herda de `Base` vira uma tabela. `ForeignKey` cria relacionamentos no banco; `relationship()` só existe em Python (permite `event.seats`). `unique=True` em coluna é proteção a nível de banco (ex: `ticket_id` único em validações bloqueia validação dupla).

4. **Hash de senha (bcrypt)** — Nunca guardar senha em texto puro. `bcrypt.hashpw()` gera um hash com salt aleatório; `bcrypt.checkpw()` compara. Limite de 72 bytes por design.

### Erros que valem anotar

- **`ImportError: cannot import name 'verificar_senha'`** — Import e definição precisam ter exatamente o mesmo nome. Erro clássico ao renomear função.
- **passlib × bcrypt 5.0.0** — passlib 1.7.4 está sem manutenção e quebra com bcrypt novo: erro "password cannot be longer than 72 bytes" mesmo com senha curta. Solução: usar `bcrypt` diretamente (menos uma camada).
- **`organizador_id` None no seed** — Objeto só recebe `id` quando o SQLAlchemy *flusha* (`db.flush()`). Com `autoflush=False`, era preciso flush explícito dentro de `criar_usuario`.
- **Pasta com typo `almebic`** — alembic.ini apontava pra pasta errada (`script_location`), falha "Path doesn't exist".

### Erros de ambiente

- **Porta 8000 ocupada** — outra app já usa 8000; a API roda na **8001**.
- **Porta 5432 ocupada** — outro Postgres na máquina; o container usa **5433**.

---

## Sprint 2 — (em andamento)
---

## Sprint 5 — Meus ingressos + Portaria (QR, câmera, validação)

### Conceitos aprendidos

1. **QR Code com HMAC** — O ingresso não é um número, é um payload JSON (`{"share_token": ..., "evento_id": ...}`) assinado com HMAC. A portaria só confia no código se a assinatura bate com a chave secreta (`hmac.compare_digest`). Assim, um código forjado quebra a assinatura → "inválido". Ver: `backend/app/services/ingresso.py`.

2. **`html5-qrcode` e o ciclo de vida da câmera** — A lib precisa que o `<div id="reader">` já exista no DOM antes de `start()`. Bugs clássicos:
   - Iniciar a câmera **no mesmo evento de clique** que monta o div (React ainda não renderizou) → falha. Correto: `useEffect` disparado por `modo === 'camera'`.
   - A lib mantém a câmera ligada mesmo quando a tela muda → precisa parar no `return` do `useEffect` (cleanup) ao sair da página.
   - Para "Ler outro", usar um **contador de sessão** (`sessaoScan`) que força o `useEffect` a reiniciar, em vez de tentar re-setar o mesmo modo.

3. **`selectinload` para N+1** — `/tickets/mine` busca tickets com `selectinload(Ticket.event, Ticket.seat)` para carregar evento e assento numa query só (sem N+1).

4. **`primaryjoin` em relationship** — `Event.tmdb_movie_id == Movie.tmdb_id` liga duas tabelas por chave lógica, sem coluna FK no banco.

### Erros que valem anotar

- **`Html5Qrcode` e a câmera** — achar que "re-setar modo igual" reinicia a câmera. Não reinicia: `useEffect` só dispara quando o valor *muda*. Solução: `sessaoScan` como dependência.
- **Assento pertence a um evento** — num teste, tentar comprar assento do evento A no evento B → 400 "assento não existe neste evento". Cada assento tem `event_id`.

### Fluxo validado na portaria (via API)

`válido` → `ja_utilizado` → `invalido` (forjado) → `evento_errado` (evento_id divergente). Todos com `mensagem` clara em português.
