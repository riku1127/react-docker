import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { pool } from './db.ts'
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';


const app = new Hono()
app.use('/api/*', async (c, next) => {
    await next()
    c.header('Content-Type', 'application/json; charset=utf-8')
})

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

//一覧取得(GET)
app.get('/api/todos', async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ ok: false, error: 'x-user-id header is required' }, 400);
    try {
        const [rows] = await pool.query("SELECT id, title, completed, created_at FROM todos WHERE user_id = ? ORDER BY created_at DESC", [userId])
        return c.json(rows);
    } catch (err) {
        console.error(err);
        return c.json(
            { ok: false, error: (err as Error).message }, 500);
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
// ログインAPI
app.post('/api/login', async (c) => {
    try {
        const body = await c.req.json<{ email: string; password: string }>().catch(() => null);

        if (!body || !body.email || !body.password) {
            return c.json({ message: 'メールアドレスとパスワードを入力してください' }, 400);
        }
        const { email, password } = body;

        // usersテーブルからユーザ取得
        const [rows] = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = ?', [email]);

        const user = Array.isArray(rows) ? (rows as any[])[0] : null;

        if (!user) {
            return c.json({ message: 'メールアドレスまたはパスワードが違います' }, 401);
        }

        // パスワード照合
        const ok = await bcrypt.compare(password, (user as any).password_hash);
        if (!ok) {
            return c.json({ message: 'メールアドレスまたはパスワードが違います' }, 401);
        }


        // JWT発行
        const payload = {
            userId: user.id,
            name: user.name,
            email: user.email,
        };

        const jwtOptions: SignOptions = {
            expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as any,
        };

        const token = jwt.sign(payload, JWT_SECRET, jwtOptions);

        return c.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (err) {
        console.error('login error:', err);
        return c.json(
            {
                message: 'ログイン処理中にエラーが発生しました',
                error: String(err),  // ← これ追加！
            },
            500
        );
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

// 追加・削除・編集の部分はそのままでOK

// サーバー起動
serve({ fetch: app.fetch, port: 8787 })
console.log('🚀 Server running at http://localhost:8787')