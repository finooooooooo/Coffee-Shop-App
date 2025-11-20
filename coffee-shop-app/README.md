# Cashier System (Latihan)

This workspace contains a starter setup to connect a PostgreSQL database to VS Code using the SQLTools extension.

What I created for you
- `.vscode/sqltools.json` — a SQLTools workspace connection prefilled for local development:
  - name: `dev-postgres-cashier`
  - server: `localhost`
  - port: `5432`
  - database: `latihan_db`
  - username: `postgres`
  - password: not saved (you will be prompted)

Quick next steps
1. Install the VS Code extensions (I installed them for you; if you prefer to do it yourself run the commands below in PowerShell):

```powershell
code --install-extension mtxr.sqltools
code --install-extension mtxr.sqltools-driver-pg
```

2. Open VS Code in this folder (`d:\Latihan`).
3. Open the SQLTools sidebar. You should see the `dev-postgres-cashier` connection.
4. Click the connection and it will prompt you for the password. Enter your Postgres password (if you haven't set one locally, you may need to create the `postgres` user password or create the `latihan_db` database first).
5. Run a quick verification query after connecting:

```sql
SELECT version();
```

If your Postgres server is remote or uses different credentials
- Edit `.vscode/sqltools.json` and change `server`, `port`, `database`, `username`, and `ssl` as needed.
- If you require SSH tunneling, create a local tunnel first and point `server` to `localhost` and `port` to the forwarded port.

Optional: start a local Postgres using Docker (if you use Docker):

```powershell
# pull and run a local Postgres for development (password = example)
docker run --rm --name latihan-postgres -e POSTGRES_PASSWORD=example -e POSTGRES_DB=latihan_db -p 5432:5432 -d postgres:15
```

Security note
- I did not save any password in the connection file. Enter passwords in VS Code when prompted, or set `savePassword` to `true` in `.vscode/sqltools.json` if you prefer (not recommended for shared machines).

If you want, I can:
- Create the `latihan_db` database for you (if Postgres is local and you want me to run a command here).
- Configure an SSH tunnel command if your DB is remote behind a bastion.

Tell me if you want me to: create the DB locally, change the connection values, or configure SSH tunneling.