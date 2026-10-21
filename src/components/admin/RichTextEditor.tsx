import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Unlink,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  label?: string;
  sublabel?: string;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  label,
  sublabel,
  placeholder = 'Skriv tekst her...',
  minHeight = '120px',
}) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#4D6B3E] font-medium underline underline-offset-2 hover:text-[#2D4026]',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: `focus:outline-hidden prose prose-sm max-w-none text-stone-900 leading-relaxed font-sans min-h-[${minHeight}] p-3 text-xs sm:text-sm`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes (e.g. section resets or switching items)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const handleSetLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      let finalUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('#') && !finalUrl.startsWith('/')) {
        finalUrl = `https://${finalUrl}`;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-stone-700">
            {label}
          </label>
          <span className="text-[10px] text-stone-500 font-mono">Rik tekst</span>
        </div>
      )}
      {sublabel && (
        <p className="text-[11px] text-stone-500 mb-1">{sublabel}</p>
      )}

      <div className="bg-white border border-stone-300 rounded-lg overflow-hidden shadow-2xs focus-within:border-[#4D6B3E] focus-within:ring-1 focus-within:ring-[#4D6B3E] transition-all">
        {/* Formatting Toolbar */}
        <div className="bg-stone-50 border-b border-stone-200 px-2 py-1.5 flex flex-wrap items-center gap-1 text-stone-600">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bold')
                ? 'bg-[#2D4026] text-white'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="Fet (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('italic')
                ? 'bg-[#2D4026] text-white'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="Kursiv (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('underline')
                ? 'bg-[#2D4026] text-white'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="Understreking (Ctrl+U)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-stone-300 mx-1" />

          <button
            type="button"
            onClick={() => {
              const previousUrl = editor.getAttributes('link').href;
              setLinkUrl(previousUrl || '');
              setShowLinkInput(!showLinkInput);
            }}
            className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
              editor.isActive('link')
                ? 'bg-[#4D6B3E] text-white'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="Sett inn lenke (Ctrl+K)"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1.5 rounded hover:bg-stone-200 text-rose-600 transition-colors"
              title="Fjern lenke"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="w-px h-4 bg-stone-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-[#2D4026] text-white'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="Punktliste"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-[#2D4026] text-white'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="Nummerert liste"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-[#2D4026] text-white'
                : 'hover:bg-stone-200 text-stone-700'
            }`}
            title="Sitatblokk"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-stone-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="p-1.5 rounded hover:bg-stone-200 text-stone-500 transition-colors"
            title="Fjern all formatering"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Link prompt popover */}
        {showLinkInput && (
          <div className="p-2.5 bg-stone-100 border-b border-stone-200 flex items-center gap-2 text-xs animate-in fade-in">
            <span className="text-stone-600 font-medium whitespace-nowrap">Nettadresse:</span>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSetLink();
                }
              }}
              placeholder="https://fadder.betyna.no/info"
              className="flex-1 px-2.5 py-1 bg-white border border-stone-300 rounded text-xs text-stone-900 focus:outline-hidden focus:border-[#4D6B3E]"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSetLink}
              className="px-3 py-1 bg-[#4D6B3E] hover:bg-[#3B522F] text-white rounded font-medium cursor-pointer"
            >
              Lagre lenke
            </button>
            <button
              type="button"
              onClick={() => setShowLinkInput(false)}
              className="px-2 py-1 text-stone-500 hover:text-stone-800"
            >
              Avbryt
            </button>
          </div>
        )}

        {/* Editor editable surface */}
        <div style={{ minHeight }} className="bg-white">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
