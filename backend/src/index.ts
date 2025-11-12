import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { pool } from './db.ts'
import { error } from 'console'

const app = new Hono()

app.get('/', (c) => c.text('Hello from Hono!'))
app.get('/api/hello', (c) => c.json({ message: 'こんにちは Hono！' }))
app.use('/api/*', async (c, next) => {
    await next()
    c.header('Content-Type', 'application/json; charset=utf-8')
})

//一覧取得(GET)
app.get('/api/todos', async (c) => {
    const userId = c.req.header('x-user-id')
    try {
        const [rows] = await pool.query("SELECT * FROM todos ORDER BY created_at DESC", [userId])
        return c.json(rows)
    } catch (err) {
        console.error(err)
        return c.json(
            { ok: false, error: (err as Error).message }, 500)
    }
});
//追加(POST)
app.post('/api/todos', async (c) => {
    try {
        const userId = c.req.header('x-user-id') ?? c.req.header('X-User-Id')
        if (!userId) {
            return c.json({ ok: false, error: 'x-user=id header is required' }, 400);
        }
        const body = await c.req.json()
        const title = body.title
        if (!title) {
            return c.json({ ok: false, error: 'title is required' }, 400);
        }
        await pool.query('INSERT INTO todos (user_id,title) VALUES (?,?)', [userId, title])
        return c.json({ ok: true });
    } catch (err) {
        console.error(err);
        return c.json({ ok: false, error: (err as Error).message }, 500);
    }
});
//削除(DELETE)
app.delete('/api/todos/:id', async (c) => {
    const userId = c.req.header('x-user-id') ?? c.req.header('X-User-Id');
    if (!userId) {
        return c.json({ ok: false, error: 'x-user-id header is required' }, 400);
    }
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id)) {
        return c.json({ ok: false, error: 'invalid id' }, 400);
    }
    try {
        const [result] = await pool.query(
            'DELETE FROM todos WHERE id = ? AND user_id = ?', [id, userId]
        );
        const affected = (result as any).affectedRows ?? 0;
        if (affected === 0) {
            return c.json({ ok: false, error: 'notfound' }, 404);
        }
        return c.json({ ok: true });
    } catch (err) {
        console.error(err);
        return c.json({ ok: false, error: (err as Error).message }, 500);
    }
});
//編集(PATCH)
app.patch('/api/todos/:id', async (c) => {
    const userId = c.req.header('x-user-id') ?? c.req.header('X-User-Id');
    if (!userId) return c.json({ ok: false, error: 'x-user-id header is required' }, 400);

    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id)) return c.json({ ok: false, error: 'invalid id' }, 400);
    try {
        const body = await c.req.json();
        const title = body.title;
        if (!title) return c.json({ ok: false, error: 'title is requires' }, 400);

        const [result] = await pool.query(
            'UPDATE todos SET title = ? WHERE id = ? AND user_id = ?', [title, id, userId]
        );
        const affected = (result as any).affectedRows ?? 0;
        if (affected === 0) return c.json({ ok: false, error: 'notfound' }, 404);

        return c.json({ ok: true });
    } catch (err) {
        console.error(err);
        return c.json({ ok: false, error: (err as Error).message }, 500);
    }
});

serve({
    fetch: app.fetch,
    port: 8787,
})
console.log('🚀 Server running at http://localhost:8787')
