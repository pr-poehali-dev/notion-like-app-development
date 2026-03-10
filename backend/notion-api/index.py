"""
API для управления страницами и блоками рабочего пространства Блокнот.
Поддерживает CRUD операции для страниц и блоков.
"""

import json
import os
import pg8000.native
from urllib.parse import urlparse

SCHEMA = "t_p68193026_notion_like_app_deve"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    "Content-Type": "application/json",
}


def get_conn():
    from urllib.parse import unquote
    url = urlparse(os.environ["DATABASE_URL"])
    return pg8000.native.Connection(
        host=url.hostname,
        port=url.port or 5432,
        database=url.path.lstrip("/"),
        user=unquote(url.username) if url.username else url.username,
        password=unquote(url.password) if url.password else url.password,
        ssl_context=False,
    )


def resp(status, body):
    return {"statusCode": status, "headers": CORS_HEADERS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    action = params.get("action", "")

    conn = get_conn()

    try:
        # ── GET pages ──────────────────────────────────────────────────
        if method == "GET" and action == "get_pages":
            rows = conn.run(f"SELECT id, title, emoji, created_at, updated_at FROM {SCHEMA}.pages ORDER BY created_at ASC")
            pages = []
            for r in rows:
                page_id = r[0]
                blocks_rows = conn.run(
                    f"SELECT id, type, content, checked, position FROM {SCHEMA}.blocks WHERE page_id = :1 ORDER BY position ASC",
                    page_id
                )
                blocks = [
                    {"id": b[0], "type": b[1], "content": b[2], "checked": b[3], "position": b[4]}
                    for b in blocks_rows
                ]
                pages.append({
                    "id": page_id,
                    "title": r[1],
                    "emoji": r[2],
                    "createdAt": r[3].isoformat() if r[3] else None,
                    "updatedAt": r[4].isoformat() if r[4] else None,
                    "blocks": blocks,
                })
            return resp(200, {"pages": pages})

        # ── POST create_page ────────────────────────────────────────────
        if method == "POST" and action == "create_page":
            page_id = body.get("id")
            title = body.get("title", "Без названия")
            emoji = body.get("emoji", "📝")
            blocks = body.get("blocks", [])

            row = conn.run(
                f"INSERT INTO {SCHEMA}.pages (id, title, emoji) VALUES (:1, :2, :3) RETURNING id, title, emoji, created_at",
                page_id, title, emoji
            )

            for i, bl in enumerate(blocks):
                conn.run(
                    f"INSERT INTO {SCHEMA}.blocks (id, page_id, type, content, checked, position) VALUES (:1, :2, :3, :4, :5, :6)",
                    bl["id"], page_id, bl.get("type", "text"), bl.get("content", ""), bl.get("checked", False), i
                )

            r = row[0]
            return resp(201, {
                "id": r[0], "title": r[1], "emoji": r[2],
                "createdAt": r[3].isoformat(), "blocks": blocks
            })

        # ── PUT update_page ─────────────────────────────────────────────
        if method == "PUT" and action == "update_page":
            page_id = body.get("id")
            title = body.get("title")
            emoji = body.get("emoji")
            conn.run(
                f"UPDATE {SCHEMA}.pages SET title = :1, emoji = :2, updated_at = NOW() WHERE id = :3",
                title, emoji, page_id
            )
            return resp(200, {"ok": True})

        # ── DELETE delete_page ──────────────────────────────────────────
        if method == "DELETE" and action == "delete_page":
            page_id = body.get("id")
            conn.run(f"DELETE FROM {SCHEMA}.blocks WHERE page_id = :1", page_id)
            conn.run(f"DELETE FROM {SCHEMA}.pages WHERE id = :1", page_id)
            return resp(200, {"ok": True})

        # ── POST save_blocks ────────────────────────────────────────────
        if method == "POST" and action == "save_blocks":
            page_id = body.get("page_id")
            blocks = body.get("blocks", [])

            conn.run(f"DELETE FROM {SCHEMA}.blocks WHERE page_id = :1", page_id)
            for i, bl in enumerate(blocks):
                conn.run(
                    f"INSERT INTO {SCHEMA}.blocks (id, page_id, type, content, checked, position) VALUES (:1, :2, :3, :4, :5, :6)",
                    bl["id"], page_id, bl.get("type", "text"), bl.get("content", ""), bl.get("checked", False), i
                )
            conn.run(f"UPDATE {SCHEMA}.pages SET updated_at = NOW() WHERE id = :1", page_id)
            return resp(200, {"ok": True})

        return resp(404, {"error": "Unknown action"})

    finally:
        conn.close()