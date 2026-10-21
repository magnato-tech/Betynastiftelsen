import React, { useMemo } from 'react';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

const ALLOWED_TAGS = new Set([
  'P',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'STRIKE',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'A',
  'BR',
  'SPAN',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
]);

function isSafeUrl(url: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  );
}

function domNodeToReact(node: Node, key: string | number): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as HTMLElement;
  const tagName = el.tagName.toUpperCase();

  if (!ALLOWED_TAGS.has(tagName)) {
    return Array.from(el.childNodes).map((child, idx) => domNodeToReact(child, `${key}-${idx}`));
  }

  const children = Array.from(el.childNodes).map((child, idx) => domNodeToReact(child, `${key}-${idx}`));

  switch (tagName) {
    case 'P':
      return <p key={key}>{children}</p>;
    case 'STRONG':
    case 'B':
      return <strong key={key}>{children}</strong>;
    case 'EM':
    case 'I':
      return <em key={key}>{children}</em>;
    case 'U':
      return <u key={key}>{children}</u>;
    case 'S':
    case 'STRIKE':
      return <s key={key}>{children}</s>;
    case 'UL':
      return <ul key={key}>{children}</ul>;
    case 'OL':
      return <ol key={key}>{children}</ol>;
    case 'LI':
      return <li key={key}>{children}</li>;
    case 'BLOCKQUOTE':
      return <blockquote key={key}>{children}</blockquote>;
    case 'A': {
      const href = el.getAttribute('href');
      const safeHref = isSafeUrl(href) ? href! : '#';
      return (
        <a key={key} href={safeHref} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    case 'BR':
      return <br key={key} />;
    case 'SPAN':
      return <span key={key}>{children}</span>;
    case 'H1':
      return <h1 key={key}>{children}</h1>;
    case 'H2':
      return <h2 key={key}>{children}</h2>;
    case 'H3':
      return <h3 key={key}>{children}</h3>;
    case 'H4':
      return <h4 key={key}>{children}</h4>;
    default:
      return <span key={key}>{children}</span>;
  }
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className }) => {
  const renderedContent = useMemo(() => {
    if (!html) return null;
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return html;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const body = doc.body;
      return Array.from(body.childNodes).map((child, idx) => domNodeToReact(child, idx));
    } catch {
      return html;
    }
  }, [html]);

  return <div className={className}>{renderedContent}</div>;
};
