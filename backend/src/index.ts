import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => c.text('Hello from Hono!'))
app.get('/api/hello', (c) => c.json({ message: 'こんにちは Hono！' }))

serve({
    fetch: app.fetch,
    port: 8787,
})
console.log('🚀 Server running at http://localhost:8787')
