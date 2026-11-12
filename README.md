# Team Board

A small shared task board for a team. Each task has a title, a status
(`todo`, `doing` or `done`) and an owner, the person responsible for it.

Plain JavaScript on Node.js, no dependencies, no build step. Tasks are stored
in `data/tasks.json`.

## Run

Requires Node.js 18 or later.

```sh
npm start          # serves the board on http://localhost:3000
PORT=8080 npm start
npm test           # runs the test suite with node --test
```

Set `DATA_FILE` to use a different JSON file for storage.

## Project layout

```
src/server.js     starts the HTTP server
src/app.js        wires the store and the routes together
src/routes.js     HTTP routes and static file serving
src/store.js      reads and writes data/tasks.json
src/validate.js   request body validation
src/csv.js        CSV export
public/           the board page (HTML, JS, CSS)
data/tasks.json   seed data
test/             tests (node:test)
```

## API

All bodies are JSON. Errors return `{ "error": "message" }` with a 4xx status.

### Task object

| Field    | Type   | Notes                                   |
|----------|--------|-----------------------------------------|
| `id`     | number | Assigned by the server                  |
| `title`  | string | Required, at most 120 characters        |
| `status` | string | `todo`, `doing` or `done`; default `todo` |
| `owner`  | string | Required, the person responsible        |

### `GET /api/tasks`

Lists tasks. Optional query parameters:

- `status`: only tasks with this status
- `owner`: only tasks for this person (case-insensitive)
- `sort`: one of `id`, `title`, `status`, `owner` (default `id`)

Example: `GET /api/tasks?owner=Priya&sort=status`

### `GET /api/tasks/:id`

Returns one task, or 404.

### `POST /api/tasks`

Creates a task.

```json
{ "title": "Book venue", "owner": "Elena" }
```

Returns 201 with the new task. Unknown fields are rejected with 400.

### `PATCH /api/tasks/:id`

Updates any of `title`, `status`, `owner`. Returns the updated task.

```json
{ "status": "doing" }
```

### `DELETE /api/tasks/:id`

Deletes a task. Returns 204.

### `GET /api/tasks.csv`

Downloads the task list as CSV with the columns `ID,Title,Status,Owner`.
Accepts the same `status`, `owner` and `sort` parameters as `GET /api/tasks`.

### `GET /api/summary`

Counts tasks per status and per owner:

```json
{
  "total": 7,
  "byStatus": { "todo": 3, "doing": 2, "done": 2 },
  "byOwner": { "Priya": { "todo": 1, "doing": 0, "done": 1 } }
}
```

## License

MIT
