import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/9732620a-9c97-49db-afb6-4d6a02bd71f2";

type BlockType = "heading1" | "heading2" | "text" | "todo" | "divider" | "quote" | "callout";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

interface Page {
  id: string;
  title: string;
  emoji: string;
  blocks: Block[];
  createdAt: Date;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: string; desc: string }[] = [
  { type: "heading1", label: "Заголовок 1", icon: "Heading1", desc: "Крупный заголовок" },
  { type: "heading2", label: "Заголовок 2", icon: "Heading2", desc: "Средний заголовок" },
  { type: "text", label: "Текст", icon: "AlignLeft", desc: "Обычный абзац" },
  { type: "todo", label: "Задача", icon: "CheckSquare", desc: "Чекбокс с текстом" },
  { type: "quote", label: "Цитата", icon: "Quote", desc: "Выделенная цитата" },
  { type: "callout", label: "Выноска", icon: "Lightbulb", desc: "Блок с акцентом" },
  { type: "divider", label: "Разделитель", icon: "Minus", desc: "Горизонтальная линия" },
];

const EMOJIS = ["📝", "🚀", "💡", "🎯", "📌", "🔥", "⭐", "🌊", "🎨", "🧠", "📊", "🌿"];

const generateId = () => Math.random().toString(36).slice(2, 9);

// ── API helpers ──────────────────────────────────────────────────────────────

async function apiGet(action: string) {
  const res = await fetch(`${API_URL}?action=${action}`);
  return res.json();
}

async function apiPost(action: string, body: object) {
  const res = await fetch(`${API_URL}?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiPut(action: string, body: object) {
  const res = await fetch(`${API_URL}?action=${action}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiDelete(action: string, body: object) {
  const res = await fetch(`${API_URL}?action=${action}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Sub-components ───────────────────────────────────────────────────────────

function BlockRenderer({
  block,
  onUpdate,
  onDelete,
  onAddAfter,
}: {
  block: Block;
  onUpdate: (id: string, data: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onAddAfter: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + "px";
    }
  }, [block.content]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAddAfter(block.id);
    }
    if (e.key === "Backspace" && block.content === "") {
      e.preventDefault();
      onDelete(block.id);
    }
  };

  if (block.type === "divider") {
    return (
      <div
        className="group relative py-3"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
        {hovered && (
          <button
            onClick={() => onDelete(block.id)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-all animate-scale-in"
          >
            <Icon name="X" size={12} />
          </button>
        )}
      </div>
    );
  }

  const textClass =
    block.type === "heading1"
      ? "text-3xl font-bold font-montserrat text-white"
      : block.type === "heading2"
      ? "text-xl font-semibold font-montserrat text-white/90"
      : block.type === "quote"
      ? "text-base italic text-white/70"
      : "text-base text-white/80 leading-relaxed";

  const wrapClass =
    block.type === "quote"
      ? "border-l-2 border-purple-400/60 pl-4 py-1"
      : block.type === "callout"
      ? "rounded-xl px-4 py-3 text-sm text-white/85"
      : "";

  const wrapStyle =
    block.type === "callout"
      ? {
          background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(34,211,238,0.08))",
          border: "1px solid rgba(167,139,250,0.2)",
        }
      : {};

  return (
    <div
      className={`group relative flex gap-2 py-0.5 ${block.type === "todo" ? "items-center" : "items-start"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`flex-shrink-0 flex items-center gap-1 pt-1 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}>
        <button
          onClick={() => onDelete(block.id)}
          className="w-5 h-5 flex items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Icon name="Trash2" size={12} />
        </button>
        <div className="w-5 h-5 flex items-center justify-center text-white/20 cursor-grab">
          <Icon name="GripVertical" size={12} />
        </div>
      </div>

      {block.type === "todo" && (
        <button
          onClick={() => onUpdate(block.id, { checked: !block.checked })}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
            block.checked ? "bg-purple-500 border-purple-500" : "border-white/30 hover:border-purple-400"
          }`}
        >
          {block.checked && <Icon name="Check" size={11} />}
        </button>
      )}

      <div className={`flex-1 min-w-0 ${wrapClass}`} style={wrapStyle}>
        <textarea
          ref={inputRef}
          value={block.content}
          onChange={(e) => onUpdate(block.id, { content: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder={
            block.type === "heading1" ? "Заголовок..."
            : block.type === "heading2" ? "Подзаголовок..."
            : block.type === "quote" ? "Цитата..."
            : block.type === "callout" ? "Выноска..."
            : block.type === "todo" ? "Задача..."
            : "Начни писать..."
          }
          rows={1}
          className={`w-full bg-transparent resize-none outline-none placeholder:text-white/20 ${textClass} ${
            block.type === "todo" && block.checked ? "line-through text-white/30" : ""
          }`}
          style={{ overflow: "hidden" }}
        />
      </div>
    </div>
  );
}

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div
      className="absolute top-10 left-0 z-50 p-3 rounded-2xl shadow-2xl animate-scale-in"
      style={{ minWidth: 220, background: "hsl(230,18%,12%)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div className="grid grid-cols-6 gap-1">
        {EMOJIS.map((e) => (
          <button key={e} onClick={() => { onSelect(e); onClose(); }} className="text-xl p-1.5 rounded-lg hover:bg-white/10 transition-all">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockTypePicker({ onSelect, onClose }: { onSelect: (t: BlockType) => void; onClose: () => void }) {
  return (
    <div
      className="absolute bottom-full left-0 mb-2 z-50 p-2 rounded-2xl shadow-2xl animate-scale-in w-64"
      style={{ background: "hsl(230,18%,12%)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <p className="text-xs text-white/40 px-2 py-1 mb-1 font-montserrat uppercase tracking-wider">Тип блока</p>
      {BLOCK_TYPES.map((bt) => (
        <button
          key={bt.type}
          onClick={() => { onSelect(bt.type); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/8 transition-all text-left"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(167,139,250,0.15)" }}>
            <Icon name={bt.icon} fallback="AlignLeft" size={16} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/85">{bt.label}</p>
            <p className="text-xs text-white/35">{bt.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Index() {
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load pages on mount ──
  useEffect(() => {
    apiGet("get_pages").then((data) => {
      const loaded: Page[] = (data.pages || []).map((p: Record<string, unknown>) => ({
        ...p,
        createdAt: new Date(p.createdAt || Date.now()),
      }));
      setPages(loaded);
      if (loaded.length > 0) setActivePageId(loaded[0].id);
      setLoading(false);
    });
  }, []);

  const activePage = pages.find((p) => p.id === activePageId);

  // ── Auto-save blocks with debounce ──
  const scheduleBlocksSave = useCallback((pageId: string, blocks: Block[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      await apiPost("save_blocks", { page_id: pageId, blocks });
      setSaving(false);
    }, 1000);
  }, []);

  const updatePage = async (id: string, data: Partial<Page>) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    if (data.title !== undefined || data.emoji !== undefined) {
      const page = pages.find((p) => p.id === id)!;
      await apiPut("update_page", {
        id,
        title: data.title ?? page.title,
        emoji: data.emoji ?? page.emoji,
      });
    }
  };

  const createPage = async () => {
    const newPage: Page = {
      id: generateId(),
      title: "Без названия",
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      createdAt: new Date(),
      blocks: [{ id: generateId(), type: "text", content: "" }],
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    await apiPost("create_page", {
      id: newPage.id,
      title: newPage.title,
      emoji: newPage.emoji,
      blocks: newPage.blocks,
    });
  };

  const deletePage = async (id: string) => {
    if (pages.length === 1) return;
    const remaining = pages.filter((p) => p.id !== id);
    setPages(remaining);
    if (activePageId === id) setActivePageId(remaining[0].id);
    await apiDelete("delete_page", { id });
  };

  const addBlock = (type: BlockType, afterId?: string) => {
    const newBlock: Block = { id: generateId(), type, content: "" };
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== activePageId) return p;
        let newBlocks: Block[];
        if (!afterId) {
          newBlocks = [...p.blocks, newBlock];
        } else {
          const idx = p.blocks.findIndex((b) => b.id === afterId);
          newBlocks = [...p.blocks];
          newBlocks.splice(idx + 1, 0, newBlock);
        }
        scheduleBlocksSave(p.id, newBlocks);
        return { ...p, blocks: newBlocks };
      })
    );
  };

  const updateBlock = (blockId: string, data: Partial<Block>) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== activePageId) return p;
        const newBlocks = p.blocks.map((b) => (b.id === blockId ? { ...b, ...data } : b));
        scheduleBlocksSave(p.id, newBlocks);
        return { ...p, blocks: newBlocks };
      })
    );
  };

  const deleteBlock = (blockId: string) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== activePageId) return p;
        const newBlocks = p.blocks.filter((b) => b.id !== blockId);
        scheduleBlocksSave(p.id, newBlocks);
        return { ...p, blocks: newBlocks };
      })
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "hsl(230,20%,7%)" }}>
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center pulse-glow"
            style={{ background: "linear-gradient(135deg, #a78bfa, #22d3ee)" }}
          >
            <Icon name="Sparkles" size={22} className="text-white" />
          </div>
          <p className="text-white/40 text-sm">Загружаю заметки...</p>
        </div>
      </div>
    );
  }

  if (!activePage) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "hsl(230,20%,7%)" }}>
        <div className="text-center animate-fade-in">
          <p className="text-white/40 mb-4">Нет страниц</p>
          <button
            onClick={createPage}
            className="px-6 py-3 rounded-xl text-white text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #a78bfa, #22d3ee)" }}
          >
            Создать первую страницу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(230,20%,7%)" }}>
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 flex flex-col transition-all duration-300 border-r border-white/5 ${
          sidebarCollapsed ? "w-0 overflow-hidden" : "w-64"
        }`}
        style={{ background: "hsl(230,22%,5%)" }}
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-white/5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a78bfa, #22d3ee)" }}>
            <Icon name="Sparkles" size={14} className="text-white" />
          </div>
          <span className="font-montserrat font-bold text-white/90 text-sm tracking-wide">Блокнот</span>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2">
          <p className="text-xs text-white/25 px-2 py-1 mb-1 font-montserrat uppercase tracking-widest">Страницы</p>
          <div className="space-y-0.5">
            {pages.map((page) => (
              <div key={page.id} className="group relative">
                <button
                  onClick={() => setActivePageId(page.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                    activePageId === page.id ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/4"
                  }`}
                  style={
                    activePageId === page.id
                      ? { background: "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(34,211,238,0.08))", boxShadow: "inset 0 0 0 1px rgba(167,139,250,0.2)" }
                      : {}
                  }
                >
                  <span className="text-base leading-none">{page.emoji}</span>
                  <span className="text-sm font-medium truncate flex-1">{page.title}</span>
                </button>
                {pages.length > 1 && (
                  <button
                    onClick={() => deletePage(page.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Icon name="X" size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-2 pb-4">
          <button
            onClick={createPage}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <Icon name="Plus" size={16} />
            <span className="text-sm">Новая страница</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 flex-shrink-0" style={{ background: "rgba(0,0,0,0.2)" }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
          >
            <Icon name={sidebarCollapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={18} />
          </button>
          <div className="flex items-center gap-1 text-white/25 text-sm flex-1">
            <span>Блокнот</span>
            <Icon name="ChevronRight" size={14} />
            <span className="text-white/60">{activePage.emoji} {activePage.title}</span>
          </div>
          {saving && (
            <div className="flex items-center gap-1.5 text-xs text-white/30 animate-fade-in">
              <Icon name="Cloud" size={13} />
              <span>Сохраняю...</span>
            </div>
          )}
          {!saving && (
            <div className="flex items-center gap-1.5 text-xs text-white/20">
              <Icon name="CloudCheck" fallback="Check" size={13} />
              <span>Сохранено</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-12">
            {/* Page header */}
            <div className="mb-8">
              <div className="relative inline-block mb-4">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-5xl hover:scale-110 transition-transform leading-none"
                >
                  {activePage.emoji}
                </button>
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={(e) => { updatePage(activePageId!, { emoji: e }); setShowEmojiPicker(false); }}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>

              <input
                value={activePage.title}
                onChange={(e) => updatePage(activePageId!, { title: e.target.value })}
                placeholder="Без названия"
                className="w-full bg-transparent outline-none text-4xl font-bold font-montserrat text-white placeholder:text-white/15 mb-1"
              />
              <p className="text-xs text-white/20">
                {activePage.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Blocks */}
            <div className="space-y-1">
              {activePage.blocks.map((block) => (
                <div key={block.id} className="animate-fade-in">
                  <BlockRenderer
                    block={block}
                    onUpdate={updateBlock}
                    onDelete={deleteBlock}
                    onAddAfter={(id) => addBlock("text", id)}
                  />
                </div>
              ))}
            </div>

            {/* Add block */}
            <div className="relative mt-6">
              <button
                onClick={() => setShowBlockPicker(!showBlockPicker)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/30 hover:text-white/70 transition-all border border-dashed border-white/10 hover:border-purple-400/40 w-full justify-center"
                style={showBlockPicker ? { background: "rgba(167,139,250,0.06)" } : {}}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(167,139,250,0.2)" }}>
                  <Icon name="Plus" size={12} className="text-purple-400" />
                </div>
                <span className="text-sm">Добавить блок</span>
              </button>

              {showBlockPicker && (
                <BlockTypePicker
                  onSelect={(type) => { addBlock(type); setShowBlockPicker(false); }}
                  onClose={() => setShowBlockPicker(false)}
                />
              )}
            </div>

            {/* Footer stats */}
            <div className="mt-12 pt-6 border-t border-white/5 flex items-center gap-6 text-xs text-white/20">
              <span>{activePage.blocks.length} блоков</span>
              <span>
                {activePage.blocks.filter((b) => b.type === "todo" && b.checked).length} /{" "}
                {activePage.blocks.filter((b) => b.type === "todo").length} задач
              </span>
              <span>
                {activePage.blocks.reduce((acc, b) => acc + b.content.split(" ").filter(Boolean).length, 0)} слов
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}