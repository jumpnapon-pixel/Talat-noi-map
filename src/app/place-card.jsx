// The visitor's place card: photo and credit, labels, a one-line preview, then "Read the
// story", "When you visit", "Related stops" and collapsible "Sources". Directions and
// walking steps appear only for places whose entrance an editor has confirmed (canRoute).
// It reuses the recovered card's layout classes (place-panel, panel-scroll, panel-actions),
// so it keeps the same placement on desktop and the draggable bottom sheet on phones.

function GuidePlaceCard({ place, places, fix, lang, onClose, onSelect, walk = null, onWalkSelect }) {
  const t = (key) => tGuide(lang, key);
  const titleId = useId();
  const titleRef = useRef(null);
  const dragStart = useRef(null);
  const storyRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const thai = lang === "th";
  const title = thai ? place.nameTh || place.nameEn : place.nameEn || place.nameTh;
  const otherName = thai ? place.nameEn : place.nameTh;
  const preview = (thai ? place.previewTh : place.previewEn) || place.previewEn || "";
  const story = (thai ? place.storyTh : place.storyEn) || place.storyEn || "";
  const visit = (thai ? place.tipTh : place.tipEn) || place.tipEn || "";
  const routable = canRoute(place);
  const labels = guideLabels(place);
  const related = (place.related ?? []).map((id) => places.find((item) => item.id === id)).filter(Boolean);
  const sources = place.sources ?? [];
  const business = place.category === "Food & drink" || place.category === "Community";

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && !photoOpen && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photoOpen]);

  // Phone sheet: drag the handle down to collapse (and again to close), up to expand.
  const onHandleDown = (event) => {
    dragStart.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onHandleUp = (event) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (start === null) return;
    const dy = event.clientY - start;
    if (dy > 70) collapsed ? onClose() : setCollapsed(true);
    else if (dy < -40) setCollapsed(false);
    else if (Math.abs(dy) < 8) setCollapsed(!collapsed);
  };

  return (
    <aside
      className={`place-panel guide-card ${collapsed ? "collapsed" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-testid="place-card"
      data-place-id={place.id}
    >
      <button
        className="panel-handle"
        aria-label={collapsed ? t("expand") : t("collapse")}
        aria-expanded={!collapsed}
        onPointerDown={onHandleDown}
        onPointerUp={onHandleUp}
        onClick={(event) => event.detail === 0 && setCollapsed(!collapsed)}
      >
        <span />
      </button>
      <button className="panel-close" aria-label={t("close")} onClick={onClose}>
        <Icon.X />
      </button>
      {collapsed && (
        <button className="panel-peek" onClick={() => setCollapsed(false)}>
          <PlacePhoto place={place} small />
          <span>
            <strong>{title}</strong>
            <CategoryChip category={place.category} lang={lang} />
          </span>
        </button>
      )}

      <div className="panel-scroll" hidden={collapsed}>
        <div className="card-photo">
          {place.photoUrl ? (
            <button className="photo-open" aria-label={t("fullPhoto")} onClick={() => setPhotoOpen(true)}>
              <PlacePhoto place={place} />
              <span className="photo-expand">
                <Icon.View size={16} />
              </span>
            </button>
          ) : (
            <PlacePhoto place={place} />
          )}
        </div>
        {place.photoUrl && (place.photoCaption || place.photoCredit) && (
          <p className="guide-photo-meta">
            {place.photoCaption && <span className="guide-photo-caption">{place.photoCaption}</span>}
            {place.photoCredit &&
              (/^https:\/\//.test(place.photoSource || "") ? (
                <a href={place.photoSource} target="_blank" rel="noopener noreferrer" className="guide-photo-credit">
                  {place.photoCredit}
                </a>
              ) : (
                <span className="guide-photo-credit">{place.photoCredit}</span>
              ))}
          </p>
        )}

        <div className="card-body guide-body">
          <div className="guide-badges">
            <CategoryChip category={place.category} lang={lang} />
            {labels.map((label) => (
              <span key={label.key} className={`guide-label is-${label.key}`} data-testid={`label-${label.key}`}>
                {t(label.text)}
              </span>
            ))}
          </div>
          <h2 id={titleId} ref={titleRef} tabIndex={-1}>
            {title}
          </h2>
          {otherName && otherName !== title && (
            <p className="card-thai" lang={thai ? "en" : "th"}>
              {otherName}
            </p>
          )}
          <TodayHours place={place} lang={lang} />
          {place.location && (
            <p className="guide-location">
              <Icon.MapPin size={15} />
              <span>{place.location}</span>
            </p>
          )}
          {preview && (
            <p className="guide-preview" data-testid="card-preview">
              {preview}
            </p>
          )}
          {!routable && place.kind !== "area-guide" && (
            <p className="guide-uncertain" data-testid="no-directions">
              {t("uncertain")} {t("noDirections")}
            </p>
          )}
          {place.kind === "area-guide" && (
            <p className="guide-area-note" data-testid="no-directions">
              {t("areaNoDirections")}
            </p>
          )}

          {walk && (
            <section className="walk-strip" data-testid="walk-strip">
              <p className="walk-strip-head">
                <Icon.Walk size={15} />
                <span>
                  {t("chapter")} {walk.number} · {walk.chapter.title[thai ? 1 : 0]}
                  {walk.index >= 0 && ` · ${thai ? `จุดที่ ${walk.index + 1} จาก ${walk.total}` : `stop ${walk.index + 1} of ${walk.total}`}`}
                </span>
              </p>
              {walk.next && (
                <button className="walk-next" onClick={() => onWalkSelect(walk.next.id)} data-testid="walk-next">
                  <span>
                    <small>{t("nextStop")}</small>
                    <strong>{thai ? walk.next.nameTh || walk.next.nameEn : walk.next.nameEn}</strong>
                  </span>
                  <Icon.ChevronRight size={18} />
                </button>
              )}
              {walk.alternatives.length > 0 && (
                <div className="walk-alts">
                  <small>{t("alternatives")}</small>
                  {walk.alternatives.map((item) => (
                    <button key={item.id} onClick={() => onWalkSelect(item.id)} data-walk-alt={item.id}>
                      {thai ? item.nameTh || item.nameEn : item.nameEn}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {story && (
            <details className="guide-section guide-story" data-testid="read-story" ref={storyRef}>
              <summary>
                <Icon.Book size={18} />
                {t("readStory")}
              </summary>
              <GuideText text={story} lang={thai && place.storyTh ? "th" : "en"} />
            </details>
          )}

          <section className="guide-section guide-visit" data-testid="when-you-visit">
            <h3>
              <Icon.Info size={18} />
              {t("whenVisit")}
            </h3>
            {visit && <GuideText text={visit} lang={thai && place.tipTh ? "th" : "en"} />}
            {place.price && (
              <dl className="guide-facts">
                <div>
                  <dt>{t("price")}</dt>
                  <dd>{place.price}</dd>
                </div>
              </dl>
            )}
            {business && <p className="guide-day-note">{t("dayChange")}</p>}
            {routable && <WalkingSteps place={place} fix={fix} lang={lang} />}
          </section>

          {related.length > 0 && (
            <section className="guide-section guide-related" data-testid="related-stops">
              <h3>{t("related")}</h3>
              <div className="guide-related-list">
                {related.map((item) => (
                  <button key={item.id} onClick={() => onSelect(item.id)} data-related-id={item.id}>
                    <PlacePhoto place={item} small />
                    <span>
                      <strong>{thai ? item.nameTh || item.nameEn : item.nameEn}</strong>
                      <CategoryChip category={item.category} lang={lang} />
                    </span>
                    <Icon.ChevronRight size={16} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {sources.length > 0 && (
            <details className="guide-section guide-sources" data-testid="sources">
              <summary>
                {t("sources")} ({sources.length})
              </summary>
              <ol>
                {sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.title}
                      <span className="sr-only"> ({t("opensNewTab")})</span>
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          )}

          <p className="guide-dates">
            {place.researchReviewedOn && (
              <span>
                {t("researchReviewed")}: {formatGuideDate(place.researchReviewedOn, lang)}
              </span>
            )}
            {place.kind !== "area-guide" && (
              <span>
                {t("siteConfirmed")}:{" "}
                {place.entranceConfirmed ? formatGuideDate(place.entranceConfirmedOn, lang) || "✓" : t("notYet")}
              </span>
            )}
          </p>
        </div>
      </div>

      {!collapsed && (
        <div className="panel-actions">
          {routable && <DirectionsButton place={place} fix={fix} lang={lang} />}
          {story && (
            <Button
              variant={routable ? "outline" : "default"}
              className="read-story-action"
              onClick={() => {
                const details = storyRef.current;
                if (!details) return;
                details.open = true;
                details.scrollIntoView({ block: "start", behavior: "smooth" });
              }}
              data-testid="read-story-action"
            >
              <Icon.Book /> {t("readStory")}
            </Button>
          )}
          {!routable && (
            <Button variant="outline" onClick={onClose}>
              {t("backToMap")}
            </Button>
          )}
        </div>
      )}
      {photoOpen && <PhotoViewer place={place} lang={lang} onClose={() => setPhotoOpen(false)} />}
    </aside>
  );
}

// "Plan your walk": three browsable chapters. Opening a stop keeps the visitor's search,
// filters and map position; nothing here routes, and unconfirmed stops say so.
function WalkGuide({ places, lang, selectedId, onOpen }) {
  const t = (key) => tGuide(lang, key);
  const pick = (pair) => pair[lang === "th" ? 1 : 0];
  const byId = (id) => places.find((place) => place.id === id);
  const [open, setOpen] = useState(() => new Set(["river"]));
  const toggle = (id) =>
    setOpen((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const stopButton = (place, index, ordered, chapterId) => (
    <button
      key={place.id}
      className={`walk-stop ${selectedId === place.id ? "selected" : ""}`}
      onClick={() => onOpen(place.id, chapterId)}
      data-walk-stop={place.id}
    >
      {ordered && <span className="walk-step">{index + 1}</span>}
      <PlacePhoto place={place} small />
      <span className="walk-stop-copy">
        <strong>{lang === "th" ? place.nameTh || place.nameEn : place.nameEn}</strong>
        <span className="walk-stop-labels">
          {guideLabels(place).map((label) => (
            <span key={label.key} className={`guide-label is-${label.key}`}>
              {t(label.text)}
            </span>
          ))}
        </span>
      </span>
      <Icon.ChevronRight size={16} />
    </button>
  );
  return (
    <div className="walk-guide" data-testid="walk-guide">
      <p className="walk-welcome">{pick(WALK.welcome)}</p>
      {WALK.chapters.map((chapter, number) => {
        const stops = chapter.stops.map(byId).filter(Boolean);
        const also = chapter.also.map(byId).filter(Boolean);
        const isOpen = open.has(chapter.id);
        return (
          <section key={chapter.id} className={`walk-chapter ${isOpen ? "open" : ""}`} data-chapter={chapter.id}>
            <button className="walk-chapter-head" aria-expanded={isOpen} onClick={() => toggle(chapter.id)}>
              <span className="walk-chapter-number">{number + 1}</span>
              <span>
                <small>
                  {t("chapter")} {number + 1}
                </small>
                <strong>{pick(chapter.title)}</strong>
              </span>
              <Icon.ChevronRight size={18} className="walk-chevron" />
            </button>
            {isOpen && (
              <div className="walk-chapter-body">
                <p>{pick(chapter.copy)}</p>
                <div className="walk-stops">{stops.map((place, index) => stopButton(place, index, chapter.ordered, chapter.id))}</div>
                {also.length > 0 && (
                  <>
                    <h4>{t("alsoHere")}</h4>
                    <div className="walk-stops walk-also">{also.map((place) => stopButton(place, 0, false, chapter.id))}</div>
                  </>
                )}
              </div>
            )}
          </section>
        );
      })}
      <div className="walk-tips">
        <p>{pick(WALK.shortVisit)}</p>
        <p>{pick(WALK.longVisit)}</p>
        <p className="walk-note">
          <Icon.Info size={15} />
          {t("walkNote")}
        </p>
      </div>
    </div>
  );
}

// Re-render once a minute so Open/Closed by schedule follows the clock while a card is open.
function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

// "Today's hours": status or visit label, today's times; tap for the week, notes, other
// listings, service/office times (never used for status) and the sources.
function TodayHours({ place, lang }) {
  const now = useMinuteClock();
  const state = scheduleState(place, now);
  const label = hoursLabel(place, state, lang);
  const timed = (place.hoursStatus === "published" || place.hoursStatus === "listed") && hasSchedule(place);
  const own = lang === "th" ? place.hoursLabelTh || place.hoursLabelEn : place.hoursLabelEn;
  const note = lang === "th" ? place.hoursNoteTh || place.hoursNoteEn : place.hoursNoteEn;
  const reports = place.hoursReports ?? [];
  const other = place.otherTimes ?? [];
  const sources = place.hoursSources ?? [];
  const upcoming = (place.hoursExceptions ?? []).filter((item) => item.date >= state.clock.date).slice(0, 4);
  const thai = lang === "th";
  return (
    <details className={`today-hours is-${state.kind}`} data-testid="today-hours" data-state={state.kind}>
      <summary>
        <span className="today-hours-title">
          <Icon.Clock size={15} />
          {tHours(lang, "today")}
        </span>
        <span className="today-hours-line">
          <span className={`hours-badge is-${state.kind}`} data-testid="hours-badge">
            {label}
          </span>
          {timed && (
            <span className="today-hours-time" data-testid="today-hours-time">
              {DAY_NAMES[thai ? "th" : "en"][state.clock.day]} {formatDayHours(state.today, lang)}
            </span>
          )}
        </span>
        {timed && (state.kind === "open" || state.kind === "closed") && (
          <small className="today-hours-meta">
            {own}
            {place.hoursReviewedOn && ` · ${tHours(lang, "reviewed")} ${formatGuideDate(place.hoursReviewedOn, lang)}`}
          </small>
        )}
      </summary>
      <div className="today-hours-body">
        {state.reason === "stale" && <p className="hours-warning">{tHours(lang, "stale")}</p>}
        {state.reason === "not-today" && <p className="hours-warning">{tHours(lang, "notToday")}</p>}
        {note && <p>{note}</p>}
        {timed && (
          <>
            <h4>{tHours(lang, "week")}</h4>
            <table className="hours-week">
              <tbody>
                {DAY_KEYS.map((day) => (
                  <tr key={day} className={day === state.clock.day ? "is-today" : ""}>
                    <th scope="row">{DAY_NAMES[thai ? "th" : "en"][day]}</th>
                    <td>{formatDayHours(parseHours((place.weeklyHours ?? {})[day]), lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hours-fine">{tHours(lang, "scheduleNote")}</p>
          </>
        )}
        {upcoming.length > 0 && (
          <>
            <h4>{tHours(lang, "exceptions")}</h4>
            <ul className="hours-list">
              {upcoming.map((item) => (
                <li key={item.date}>
                  <strong>{formatGuideDate(item.date, lang)}</strong>: {formatDayHours(parseHours(item.hours), lang)}
                  {(thai ? item.noteTh || item.noteEn : item.noteEn) && ` · ${thai ? item.noteTh || item.noteEn : item.noteEn}`}
                </li>
              ))}
            </ul>
          </>
        )}
        {reports.length > 0 && (
          <>
            <h4>{tHours(lang, "otherListings")}</h4>
            <ul className="hours-list" data-testid="hours-reports">
              {reports.map((report, index) => (
                <li key={index}>
                  {report.url ? (
                    <a href={report.url} target="_blank" rel="noopener noreferrer">
                      {report.source}
                    </a>
                  ) : (
                    report.source
                  )}
                  : {thai ? report.textTh || report.text : report.text}
                </li>
              ))}
            </ul>
          </>
        )}
        {other.map((item, index) => (
          <div key={index} className="hours-other" data-testid="other-times">
            <h4>{thai ? item.labelTh || item.labelEn : item.labelEn}</h4>
            <p>{thai ? item.textTh || item.textEn : item.textEn}</p>
          </div>
        ))}
        {sources.length > 0 && (
          <>
            <h4>{tHours(lang, "hoursSources")}</h4>
            <ol className="hours-sources">
              {sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.title}
                  </a>
                </li>
              ))}
            </ol>
          </>
        )}
        {place.hoursReviewedOn && (
          <p className="hours-fine">
            {tHours(lang, "reviewed")} {formatGuideDate(place.hoursReviewedOn, lang)}
          </p>
        )}
      </div>
    </details>
  );
}

// Short hours chip for list rows.
function HoursChip({ place, lang }) {
  const state = scheduleState(place);
  if (state.kind === "area") return null;
  const short = state.kind === "open" || state.kind === "closed" ? tHours(lang, state.kind) : tHours(lang, state.kind === "check" ? "check" : state.kind);
  return (
    <span className={`hours-badge is-${state.kind} is-small`} data-testid="hours-chip">
      {short}
    </span>
  );
}
