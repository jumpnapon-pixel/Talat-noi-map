// The visitor's place card: photo and credit, labels, a one-line preview, then "Read the
// story", "When you visit", "Related stops" and collapsible "Sources". Directions and
// walking steps appear only for places whose entrance an editor has confirmed (canRoute).
// It reuses the recovered card's layout classes (place-panel, panel-scroll, panel-actions),
// so it keeps the same placement on desktop and the draggable bottom sheet on phones.

function GuidePlaceCard({ place, places, fix, lang, onClose, onSelect }) {
  const t = (key) => tGuide(lang, key);
  const titleId = useId();
  const titleRef = useRef(null);
  const dragStart = useRef(null);
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
          {!routable && place.kind !== "area-guide" && <p className="guide-uncertain">{t("uncertain")}</p>}

          {story && (
            <details className="guide-section guide-story" data-testid="read-story">
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
            {place.kind !== "area-guide" && (
              <dl className="guide-facts">
                <div>
                  <dt>{place.hours ? t("hours") : t("hoursAccess")}</dt>
                  <dd>{place.hours || t("checkBefore")}</dd>
                </div>
                {place.price && (
                  <div>
                    <dt>{t("price")}</dt>
                    <dd>{place.price}</dd>
                  </div>
                )}
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
          {routable ? (
            <DirectionsButton place={place} fix={fix} lang={lang} />
          ) : (
            <p className="guide-no-directions" data-testid="no-directions">
              {place.kind === "area-guide" ? t("areaNoDirections") : t("noDirections")}
            </p>
          )}
          <Button variant="outline" onClick={onClose}>
            {t("backToMap")}
          </Button>
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
  const stopButton = (place, index, ordered) => (
    <button
      key={place.id}
      className={`walk-stop ${selectedId === place.id ? "selected" : ""}`}
      onClick={() => onOpen(place.id)}
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
                <div className="walk-stops">{stops.map((place, index) => stopButton(place, index, chapter.ordered))}</div>
                {also.length > 0 && (
                  <>
                    <h4>{t("alsoHere")}</h4>
                    <div className="walk-stops walk-also">{also.map((place) => stopButton(place, 0, false))}</div>
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
