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