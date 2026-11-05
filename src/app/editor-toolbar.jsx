// The editing toolbar shown under the header while editing the map.

function relativeTime(iso) {
  if (!iso) return "";
  const seconds = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (!Number.isFinite(seconds)) return "";
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function SaveStatus({ save, draft, onRetry }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((value) => value + 1), 30000);
    return () => clearInterval(timer);
  }, []);
  const published = draft && draft.revision === draft.publishedRevision;
  let content;
  if (save.state === "saving")
    content = (
      <>
        <Icon.Loader className="ed-spin" size={16} /> <strong>Saving…</strong>
      </>
    );
  else if (save.state === "failed")
    content = (
      <>
        <Icon.Alert size={16} /> <strong>Save failed</strong>
        <Button size="sm" variant="outline" onClick={onRetry} data-testid="retry-save">
          Retry
        </Button>
      </>
    );
  else if (save.state === "unsaved")
    content = (
      <>
        <span className="ed-dot" aria-hidden="true" /> <strong>Unsaved changes</strong>
      </>
    );
  else
    content = (
      <>
        <Icon.CircleCheck size={16} /> <strong>Saved</strong>
        <span className="ed-status-detail">
          {save.savedAt ? relativeTime(save.savedAt) : ""}
          {draft && (published ? " · same as visitor map" : " · not published yet")}
        </span>
      </>
    );
  return (
    <div className={`ed-save-status is-${save.state}`} role="status" aria-live="polite" data-testid="save-status" data-state={save.state}>
      {content}
      {save.state === "failed" && save.message && <span className="ed-status-message">{save.message}</span>}
    </div>
  );
}

// On phones the toolbar uses `shortLabel`, or only the icon when `compact` is set.
function ToolbarButton({
  icon: IconComponent,
  label,
  shortLabel,
  compact = false,
  onClick,
  disabled,
  pressed,
  variant = "outline",
  testId,
  title,
  className,
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed === undefined ? undefined : pressed}
      aria-label={label}
      title={title ?? label}
      data-testid={testId}
      className={`ed-tool ${compact ? "ed-tool-compact" : ""} ${className ?? ""}`}
    >
      <IconComponent />
      <span className={shortLabel ? "ed-label-long" : "ed-label"}>{label}</span>
      {shortLabel && <span className="ed-label-short">{shortLabel}</span>}
    </Button>
  );
}

function MoreToolsMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (event.type === "keydown" ? event.key === "Escape" : !ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => (document.removeEventListener("pointerdown", close), document.removeEventListener("keydown", close));
  }, [open]);
  return (
    <div className="ed-more" ref={ref}>
      <ToolbarButton icon={Icon.More} label="More" compact pressed={open} onClick={() => setOpen(!open)} testId="more-tools" />
      {open && (
        <div className="ed-more-menu" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.icon && <item.icon size={16} />}
              <span>
                {item.label}
                {item.hint && <small>{item.hint}</small>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditorToolbar({
  tool,
  busy,
  hasSelection,
  history,
  save,
  draft,
  storeLabel,
  moreItems,
  onAddPin,
  onMovePin,
  onSave,
  onRetry,
  onPreview,
  onPublish,
  onExit,
}) {
  const placing = tool === "add" || tool === "move";
  return (
    <div className="ed-toolbar" role="toolbar" aria-label="Map editing tools" data-testid="editor-toolbar">
      <div className="ed-toolbar-mode">
        <Icon.Pencil size={16} />
        <div>
          <strong>Editing map</strong>
          <small>{storeLabel}. Visitors see changes only after you publish.</small>
        </div>
      </div>
      <div className="ed-toolbar-group ed-toolbar-pins">
        <ToolbarButton
          icon={Icon.PinPlus}
          label="Add pin"
          variant={tool === "add" ? "default" : "outline"}
          pressed={tool === "add"}
          disabled={busy || (placing && tool !== "add")}
          onClick={onAddPin}
          testId="tool-add-pin"
        />
        <ToolbarButton
          icon={Icon.Move}
          label="Move pin"
          shortLabel="Move"
          variant={tool === "move" || tool === "pick-move" ? "default" : "outline"}
          pressed={tool === "move" || tool === "pick-move"}
          disabled={busy || (placing && tool !== "move")}
          title={hasSelection ? "Move the selected pin" : "Choose a pin to move"}
          onClick={onMovePin}
          testId="tool-move-pin"
        />
      </div>
      <div className="ed-toolbar-group">
        <ToolbarButton
          icon={Icon.Undo}
          label="Undo"
          compact
          disabled={busy || placing || !history.canUndo}
          title={history.undoLabel ? `Undo: ${history.undoLabel}` : "Nothing to undo"}
          onClick={history.undo}
          testId="tool-undo"
        />
        <ToolbarButton
          icon={Icon.Redo}
          label="Redo"
          compact
          disabled={busy || placing || !history.canRedo}
          title={history.redoLabel ? `Redo: ${history.redoLabel}` : "Nothing to redo"}
          onClick={history.redo}
          testId="tool-redo"
        />
      </div>
      <SaveStatus save={save} draft={draft} onRetry={onRetry} />
      <div className="ed-toolbar-group ed-toolbar-publish">
        <ToolbarButton
          icon={Icon.Save}
          label="Save draft"
          shortLabel="Save"
          variant={save.state === "unsaved" || save.state === "failed" ? "default" : "outline"}
          disabled={busy || placing || save.state === "saving" || save.state === "saved"}
          onClick={onSave}
          testId="tool-save"
        />
        <ToolbarButton icon={Icon.Eye} label="Preview" disabled={busy || placing} onClick={onPreview} testId="tool-preview" />
        <ToolbarButton
          icon={Icon.Earth}
          label="Publish"
          className="ed-publish"
          disabled={busy || placing || save.state === "saving"}
          onClick={onPublish}
          testId="tool-publish"
        />
        <MoreToolsMenu items={moreItems} />
        <ToolbarButton icon={Icon.Exit} label="Exit editing" shortLabel="Exit" variant="ghost" disabled={placing} onClick={onExit} testId="tool-exit" />
      </div>
    </div>
  );
}
