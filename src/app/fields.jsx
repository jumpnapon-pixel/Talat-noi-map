// Small, labelled form controls for the place panel and the new-place form.

function TextField({
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  required = false,
  multiline = false,
  rows = 3,
  maxLength = 180,
  placeholder,
  lang,
  autoFocus,
  name,
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    name,
    value: value ?? "",
    maxLength,
    placeholder,
    lang,
    autoFocus,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": required || undefined,
    onChange: (event) => onChange(event.target.value),
    onBlur,
  };
  return (
    <div className={`ed-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="ed-required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {multiline ? <textarea rows={rows} {...common} /> : <input type="text" {...common} />}
      {hint && (
        <small id={`${id}-hint`} className="ed-hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={`${id}-error`} className="ed-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

// A number input that lets people type freely ("13.7", "-") and only reports complete numbers.
function NumberField({ label, value, onChange, onBlur, hint, min, max, step = "any", allowEmpty = true, name }) {
  const id = useId();
  const [text, setText] = useState(value === null || value === undefined ? "" : String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(value === null || value === undefined ? "" : String(value));
  }, [value]);
  const commit = (raw) => {
    setText(raw);
    if (raw.trim() === "") return allowEmpty && onChange(null);
    const number = Number(raw);
    if (!Number.isFinite(number)) return;
    if ((min !== undefined && number < min) || (max !== undefined && number > max)) return;
    onChange(number);
  };
  return (
    <div className="ed-field ed-field-number">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        value={text}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          setText(value === null || value === undefined ? "" : String(value));
          onBlur?.();
        }}
        onChange={(event) => commit(event.target.value)}
        step={step}
      />
      {hint && (
        <small id={`${id}-hint`} className="ed-hint">
          {hint}
        </small>
      )}
    </div>
  );
}

function CategoryPicker({ value, onChange, lang = "en", label = "Category", hideLabel = false }) {
  const name = useId();
  return (
    <fieldset className="ed-field ed-category-picker">
      <legend className={hideLabel ? "sr-only" : undefined}>{label}</legend>
      <div className="ed-category-options">
        {CATEGORIES.map((category) => {
          const style = CATEGORY_STYLE[category];
          return (
            <label
              key={category}
              className={`ed-category-option ${value === category ? "is-selected" : ""}`}
              style={{ "--chip-tint": style.tint, "--chip-text": style.text, "--pin": style.color }}
            >
              <input
                type="radio"
                name={name}
                value={category}
                checked={value === category}
                onChange={() => onChange(category)}
              />
              <CategoryIcon category={category} size={16} />
              <span>{categoryLabel(category, lang)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Toggle({ checked, onChange, label, hint, name }) {
  const id = useId();
  return (
    <div className="ed-toggle">
      <input
        id={id}
        name={name}
        type="checkbox"
        role="switch"
        checked={!!checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id}>
        <span>{label}</span>
        {hint && <small id={`${id}-hint`}>{hint}</small>}
      </label>
    </div>
  );
}

function PanelSection({ title, description, children, collapsible = false, defaultOpen = true, testId }) {
  if (collapsible)
    return (
      <details className="ed-section ed-section-collapsible" open={defaultOpen} data-testid={testId}>
        <summary>
          <span>{title}</span>
          {description && <small>{description}</small>}
        </summary>
        <div className="ed-section-body">{children}</div>
      </details>
    );
  return (
    <section className="ed-section" data-testid={testId}>
      <h3>{title}</h3>
      {description && <p className="ed-section-description">{description}</p>}
      <div className="ed-section-body">{children}</div>
    </section>
  );
}

function SelectField({ label, value, items, onChange }) {
  return (
    <label className="ed-field">
      <span>{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

// One entry per line (search aliases). Keeps the typed text, blank lines included, while
// the place stores only the non-empty lines.
function LinesField({ label, hint, value, onChange, name, maxLength = 2000 }) {
  const id = useId();
  const joined = (value ?? []).join("\n");
  const [text, setText] = useState(joined);
  useEffect(() => {
    if (text.split("\n").map((line) => line.trim()).filter(Boolean).join("\n") !== joined) setText(joined);
  }, [joined]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="ed-field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        name={name}
        rows={3}
        maxLength={maxLength}
        value={text}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => {
          setText(event.target.value);
          onChange(event.target.value.split("\n").map((line) => line.trim()).filter(Boolean));
        }}
      />
      {hint && (
        <small id={`${id}-hint`} className="ed-hint">
          {hint}
        </small>
      )}
    </div>
  );
}

// Pick related stops from the other places.
function RelatedField({ value, places, currentId, onChange }) {
  const chosen = new Set(value ?? []);
  const others = places.filter((place) => place.id !== currentId);
  return (
    <fieldset className="ed-field ed-related" data-testid="related-field">
      <legend>Related stops</legend>
      <div className="ed-related-list">
        {others.map((place) => (
          <label key={place.id} className={chosen.has(place.id) ? "is-on" : ""}>
            <input
              type="checkbox"
              checked={chosen.has(place.id)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...(value ?? []), place.id].slice(0, 8)
                    : (value ?? []).filter((id) => id !== place.id),
                )
              }
            />
            {place.nameEn}
          </label>
        ))}
      </div>
      <small className="ed-hint">Up to 8. Shown on the card as buttons that open those places.</small>
    </fieldset>
  );
}

// Source links shown on the card under "Sources".
function SourcesField({ value, onChange, error }) {
  const sources = value ?? [];
  const update = (index, patch) => onChange(sources.map((source, i) => (i === index ? { ...source, ...patch } : source)));
  return (
    <div className="ed-field ed-sources" data-testid="sources-field">
      <span className="ed-label">Sources</span>
      {sources.map((source, index) => (
        <div key={index} className="ed-source-row">
          <input
            aria-label={`Source ${index + 1} title`}
            placeholder="Publisher, title"
            value={source.title}
            maxLength={300}
            onChange={(event) => update(index, { title: event.target.value })}
          />
          <input
            aria-label={`Source ${index + 1} link`}
            placeholder="https://"
            value={source.url}
            maxLength={1500}
            onChange={(event) => update(index, { url: event.target.value.trim() })}
          />
          <button
            type="button"
            className="ed-icon-button"
            aria-label={`Remove source ${index + 1}`}
            onClick={() => onChange(sources.filter((_, i) => i !== index))}
          >
            <Icon.X size={16} />
          </button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...sources, { id: "", title: "", url: "" }])}
        disabled={sources.length >= 20}
      >
        <Icon.Plus /> Add source
      </Button>
      {error && <small className="ed-error">{error}</small>}
    </div>
  );
}

function DateField({ label, value, onChange, name, testId }) {
  const id = useId();
  return (
    <div className="ed-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type="date"
        value={value || ""}
        max={new Date().toISOString().slice(0, 10)}
        onChange={(event) => onChange(event.target.value)}
        data-testid={testId}
      />
    </div>
  );
}
