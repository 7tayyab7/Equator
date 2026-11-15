export function WhatsAppSupport({href}:{href:string}) {
  return <a className="whatsapp-support" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with Equator Support on WhatsApp (opens in a new tab)">
    <span className="whatsapp-support-label">Any Questions?</span>
    <span className="whatsapp-support-icon"><svg viewBox="0 0 32 32" width="34" height="34" fill="currentColor" aria-hidden="true"><path d="M16.04 3a12.7 12.7 0 0 0-11 19.05L3.25 28.6l6.7-1.76A12.7 12.7 0 1 0 16.04 3Zm0 23.15a10.4 10.4 0 0 1-5.3-1.45l-.38-.22-3.97 1.04 1.06-3.87-.25-.4a10.45 10.45 0 1 1 8.84 4.9Zm5.74-7.83c-.31-.16-1.85-.91-2.14-1.02-.28-.1-.49-.15-.7.16-.2.31-.8 1.02-.98 1.23-.18.2-.36.23-.67.08-.31-.16-1.32-.49-2.51-1.55-.93-.83-1.56-1.85-1.74-2.17-.18-.31-.02-.48.14-.63.14-.14.31-.36.47-.55.16-.18.21-.31.31-.52.11-.2.05-.39-.02-.54-.08-.16-.71-1.7-.97-2.33-.25-.6-.51-.52-.7-.53h-.6c-.21 0-.55.08-.84.39-.29.31-1.1 1.07-1.1 2.62s1.13 3.05 1.29 3.26c.15.21 2.22 3.39 5.38 4.76.75.32 1.34.52 1.79.66.75.24 1.43.2 1.97.12.6-.09 1.85-.76 2.11-1.49.26-.73.26-1.36.18-1.49-.08-.13-.29-.21-.6-.37Z"/></svg></span>
  </a>;
}
