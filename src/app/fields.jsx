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
