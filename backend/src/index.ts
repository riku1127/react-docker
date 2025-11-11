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
})
//追加(POST)
app.post('/api/todos', async (c) => {
    try {
        const userId = c.req.header('x-user-id') ?? c.req.header('X-User-Id')
        if (!userId) {
            return c.json({ ok: false, error: 'x-user=id header is required' }, 400)
        }
        const body = await c.req.json()
        const title = body.title
        if (!title) {
            return c.json({ ok: false, error: 'title is required' }, 400)
        }
        await pool.query('INSERT INTO todos (user_id,title) VALUES (?,?)', [userId, title])
        return c.json({ ok: true })
    } catch (err) {
        console.error(err)
        return c.json({ ok: false, error: (err as Error).message }, 500)
    }
})

serve({
    fetch: app.fetch,
    port: 8787,
})
console.log('🚀 Server running at http://localhost:8787')
