// The place editing panel (for the selected pin) and the short form for a new pin.

// Fields added after the first published edition count as their defaults when missing.
const PLACE_DEFAULTS = {
  photoCaption: "",
  illustrationEstimated: false,
  rotation: 0,
  mapsUrl: "",
  previewEn: "",
  previewTh: "",
  kind: "place",
  aliases: [],
  related: [],
  sources: [],
  entranceConfirmed: false,
  entranceConfirmedOn: "",
  entranceNote: "",
  researchReviewedOn: "",
  editorNotes: "",
  hoursStatus: "",
  hoursScope: "",
  weeklyHours: {},
  hoursExceptions: [],
  hoursLabelEn: "",
  hoursLabelTh: "",
  hoursNoteEn: "",
  hoursNoteTh: "",
  hoursReports: [],
  otherTimes: [],
  hoursSources: [],
  hoursReviewedOn: "",
  hoursEditorNotes: "",
};

function placeStatus(place, publishedPlace) {
  if (!publishedPlace) return { key: "new", label: "New, not published yet" };
  const current = { ...PLACE_DEFAULTS, ...place };
  const published = { ...PLACE_DEFAULTS, ...publishedPlace };
  const fields = new Set([...Object.keys(current), ...Object.keys(published)]);
  fields.delete("approved");
  const changed = [...fields].some((key) => JSON.stringify(current[key]) !== JSON.stringify(published[key]));
  return changed
    ? { key: "changed", label: "Changed since last publish" }
    : { key: "published", label: "Same as the visitor map" };
}

function PlaceStatusBadges({ place, publishedPlace }) {
  const status = placeStatus(place, publishedPlace);
  return (
    <div className="ed-badges">
      <span className={`ed-badge ed-badge-${status.key}`}>{status.label}</span>
      {!place.approved && <span className="ed-badge ed-badge-hidden">Hidden from visitors</span>}
      {place.verification === "pending" && <span className="ed-badge ed-badge-check">Needs verification</span>}
    </div>
  );
}

function PlacePanel({
  place,
  publishedPlace,
  lang,
  canUploadPhotos,
  issues = {},
  onChange,
  onMove,
  onSetOnNavigationMap,
  onDelete,
  allPlaces = [],
  onClose,
  onUploadingChange,
  footer,
}) {
  const set = (field) => (value) => onChange({ [field]: value }, `${place.id}:${field}`);
  const title = lang === "th" ? place.nameTh || place.nameEn : place.nameEn || place.nameTh;
  const coordinatesSet = hasCoordinates(place);
  return (
    <div className="ed-panel-inner" data-testid="place-panel">
      <header className="ed-panel-head">
        <div>
          <span className="ed-eyebrow">Editing place</span>
          <h2>{title || "Untitled place"}</h2>
          <PlaceStatusBadges place={place} publishedPlace={publishedPlace} />
        </div>
        <button className="ed-icon-button" aria-label="Close place panel" onClick={onClose}>
          <Icon.X size={18} />
        </button>
      </header>

      <div className="ed-panel-actions">
        <Button onClick={onMove} data-testid="panel-move-pin">
          <Icon.Move /> Move pin
        </Button>
        <Button variant="outline" onClick={onSetOnNavigationMap} data-testid="panel-set-location">
          <Icon.Locate /> Set real location
        </Button>
      </div>

      <div className="ed-panel-scroll">
        <PanelSection title="Name">
          <TextField
            label="Name in English"
            name="nameEn"
            required
            value={place.nameEn}
            error={issues.nameEn}
            onChange={set("nameEn")}
          />
          <TextField
            label="Name in Thai"
            name="nameTh"
            required
            lang="th"
            value={place.nameTh}
            error={issues.nameTh}
            hint="If you don't know the Thai name yet, repeat the English name."
            onChange={set("nameTh")}
          />
        </PanelSection>

        <PanelSection title="Category">
          <CategoryPicker
            value={place.category}
            lang={lang}
            hideLabel
            onChange={(value) => onChange({ category: value }, null)}
          />
        </PanelSection>

        <PanelSection title="Photo" testId="photo-section">
          {canUploadPhotos ? (
            <PhotoUploader
              key={place.id}
              hasPhoto={!!place.photoUrl}
              disabled={false}
              onUploadingChange={onUploadingChange}
              onPhotoChange={(url) =>
                onChange(
                  url
                    ? { photoUrl: url, photoSource: "", photoAlt: place.photoAlt || place.nameEn }
                    : { photoUrl: "", photoAlt: "", photoCaption: "", photoCredit: "", photoSource: "" },
                  null,
                )
              }
            >
              <div className="ed-photo-preview">
                <PlacePhoto place={place} />
              </div>
            </PhotoUploader>
          ) : (
            <>
              <div className="ed-photo-preview">
                <PlacePhoto place={place} />
              </div>
              <p className="ed-note">Photo uploads need Editor access to this map.</p>
            </>
          )}
          {place.photoUrl && (
            <>
              <TextField
                label="Caption"
                name="photoCaption"
                value={place.photoCaption}
                onChange={set("photoCaption")}
                hint="Shown under the photo on the place card."
              />
              <TextField
                label="Alt text (photo description)"
                name="photoAlt"
                value={place.photoAlt}
                error={issues.photoAlt}
                onChange={set("photoAlt")}
                hint="Describe what the photo shows, for people using screen readers."
              />
              <TextField
                label="Photo credit"
                name="photoCredit"
                value={place.photoCredit}
                onChange={set("photoCredit")}
                placeholder="Photo by …"
              />
            </>
          )}
          {issues.photoUrl && <p className="ed-error">{issues.photoUrl}</p>}
        </PanelSection>

        <PanelSection title="Guide card" description="What visitors see first on the place card." testId="guide-section">
          <TextField
            label="Card preview in English"
            name="previewEn"
            multiline
            rows={2}
            maxLength={400}
            value={place.previewEn}
            hint="One sentence. Shown before “Read the story”."
            onChange={set("previewEn")}
          />
          <TextField
            label="Card preview in Thai"
            name="previewTh"
            lang="th"
            multiline
            rows={2}
            maxLength={400}
            value={place.previewTh}
            onChange={set("previewTh")}
          />
          <SelectField
            label="Label"
            value={place.kind || "place"}
            items={[
              { value: "place", label: "Place" },
              { value: "field-note", label: "Field note (relies on the field photo)" },
              { value: "area-guide", label: "Area guide (a neighbourhood, never routed)" },
            ]}
            onChange={(value) => onChange({ kind: value }, null)}
          />
          <LinesField
            label="Search aliases"
            name="aliases"
            value={place.aliases}
            hint="One per line. Old titles and other spellings, so searches still find this place."
            onChange={(value) => onChange({ aliases: value }, `${place.id}:aliases`)}
          />
          <RelatedField
            value={place.related}
            places={allPlaces}
            currentId={place.id}
            onChange={(value) => onChange({ related: value }, null)}
          />
          <SourcesField
            value={place.sources}
            error={issues.sources}
            onChange={(value) => onChange({ sources: value }, `${place.id}:sources`)}
          />
          <DateField
            label="Research reviewed on"
            name="researchReviewedOn"
            value={place.researchReviewedOn}
            onChange={(value) => onChange({ researchReviewedOn: value }, null)}
          />
          <TextField
            label="Editor notes"
            name="editorNotes"
            multiline
            rows={6}
            maxLength={4000}
            value={place.editorNotes}
            hint="Only editors see this: matching notes, open questions, leads to check."
            onChange={set("editorNotes")}
          />
        </PanelSection>

        <PanelSection
          title="Opening hours"
          description="Shown to visitors as Today’s hours. Bangkok time."
          collapsible
          defaultOpen={false}
          testId="hours-section"
        >
          <SelectField
            label="Hours status"
            value={place.hoursStatus || "none"}
            items={[
              { value: "published", label: "Published schedule (can show Open/Closed by schedule)" },
              { value: "listed", label: "Listed hours (can show Open/Closed by schedule)" },
              { value: "check", label: "Check before going (sources disagree)" },
              { value: "unknown", label: "Hours unknown" },
              { value: "outdoor", label: "Outdoor stop (no opening hours)" },
              { value: "area", label: "Area guide (no set hours)" },
              { value: "none", label: "Not set" },
            ]}
            onChange={(value) => onChange({ hoursStatus: value === "none" ? "" : value }, null)}
          />
          <SelectField
            label="What the schedule covers"
            value={place.hoursScope || "none"}
            items={[
              { value: "visitor", label: "Visitor access" },
              { value: "worship", label: "Worship area" },
              { value: "shop", label: "Shop" },
              { value: "office", label: "Office" },
              { value: "delivery", label: "Delivery" },
              { value: "event", label: "Special event" },
              { value: "none", label: "Not set" },
            ]}
            onChange={(value) => onChange({ hoursScope: value === "none" ? "" : value }, null)}
          />
          <div className="ed-week" data-testid="weekly-hours">
            <span className="ed-label">Weekly schedule</span>
            <small className="ed-hint">
              09:00-18:00, several ranges with commas, “closed”, or empty for not listed. A close before the open means the
              next day (12:30-01:00).
            </small>
            {DAY_KEYS.map((day) => (
              <label key={day} className="ed-week-row">
                <span>{DAY_NAMES.en[day]}</span>
                <input
                  name={`weekly-${day}`}
                  value={(place.weeklyHours ?? {})[day] ?? ""}
                  placeholder="not listed"
                  onChange={(event) =>
                    onChange({ weeklyHours: { ...(place.weeklyHours ?? {}), [day]: event.target.value } }, `${place.id}:weekly-${day}`)
                  }
                />
              </label>
            ))}
            {issues.weeklyHours && <p className="ed-error">{issues.weeklyHours}</p>}
          </div>
          <div className="ed-field-pair">
            <TextField label="Visit label (English)" name="hoursLabelEn" maxLength={160} value={place.hoursLabelEn} onChange={set("hoursLabelEn")} />
            <TextField label="Visit label (Thai)" name="hoursLabelTh" lang="th" maxLength={160} value={place.hoursLabelTh} onChange={set("hoursLabelTh")} />
          </div>
          <TextField label="Public hours note (English)" name="hoursNoteEn" multiline rows={2} maxLength={600} value={place.hoursNoteEn} onChange={set("hoursNoteEn")} />
          <TextField label="Public hours note (Thai)" name="hoursNoteTh" lang="th" multiline rows={2} maxLength={600} value={place.hoursNoteTh} onChange={set("hoursNoteTh")} />
          <RowsField
            label="Other published listings"
            hint="Shown as indicative, never used for Open/Closed."
            value={place.hoursReports}
            fields={[
              { key: "source", label: "Listing" },
              { key: "url", label: "https://", maxLength: 1500 },
              { key: "text", label: "Hours (English)" },
              { key: "textTh", label: "Hours (Thai)", lang: "th" },
            ]}
            addLabel="Add listing"
            error={issues.hoursReports}
            onChange={(value) => onChange({ hoursReports: value }, `${place.id}:hoursReports`)}
          />
          <RowsField
            label="Service or office times"
            hint="Mass, office hours and similar. Kept separate from visiting status."
            value={place.otherTimes}
            max={6}
            fields={[
              { key: "labelEn", label: "Label (English)" },
              { key: "labelTh", label: "Label (Thai)", lang: "th" },
              { key: "textEn", label: "Times (English)" },
              { key: "textTh", label: "Times (Thai)", lang: "th" },
            ]}
            addLabel="Add times"
            error={issues.otherTimes}
            onChange={(value) => onChange({ otherTimes: value }, `${place.id}:otherTimes`)}
          />
          <RowsField
            label="Special dates"
            hint="Holidays or one-off changes: a date and its hours (or closed). They replace the weekly hours on that day."
            value={place.hoursExceptions}
            max={40}
            fields={[
              { key: "date", label: "Date", type: "date" },
              { key: "hours", label: "09:00-18:00 or closed" },
              { key: "noteEn", label: "Note (English)" },
              { key: "noteTh", label: "Note (Thai)", lang: "th" },
            ]}
            addLabel="Add date"
            error={issues.hoursExceptions}
            onChange={(value) => onChange({ hoursExceptions: value }, `${place.id}:hoursExceptions`)}
          />
          <SourcesField
            label="Hours sources"
            value={place.hoursSources}
            error={issues.hoursSources}
            onChange={(value) => onChange({ hoursSources: value }, `${place.id}:hoursSources`)}
          />
          <DateField
            label="Listings reviewed on"
            name="hoursReviewedOn"
            value={place.hoursReviewedOn}
            onChange={(value) => onChange({ hoursReviewedOn: value }, null)}
          />
          <TextField
            label="Hours notes for editors"
            name="hoursEditorNotes"
            multiline
            rows={4}
            maxLength={4000}
            value={place.hoursEditorNotes}
            hint="The raw comparison, calls to make and which source changed when you update a schedule."
            onChange={set("hoursEditorNotes")}
          />
        </PanelSection>

        <PanelSection title="Read the story">
          <TextField
            label="Story in English"
            name="storyEn"
            multiline
            rows={4}
            maxLength={2000}
            value={place.storyEn}
            error={issues.storyEn}
            onChange={set("storyEn")}
          />
          <TextField
            label="Story in Thai"
            name="storyTh"
            lang="th"
            multiline
            rows={4}
            maxLength={2000}
            value={place.storyTh}
            onChange={set("storyTh")}
          />
        </PanelSection>

        <PanelSection title="When you visit">
          <TextField
            label="Visiting tip in English"
            name="tipEn"
            multiline
            maxLength={2000}
            value={place.tipEn}
            error={issues.tipEn}
            onChange={set("tipEn")}
          />
          <TextField
            label="Visiting tip in Thai"
            name="tipTh"
            lang="th"
            multiline
            maxLength={2000}
            value={place.tipTh}
            onChange={set("tipTh")}
          />
          <TextField
            label="Entrance or how to find it"
            name="location"
            maxLength={500}
            value={place.location}
            error={issues.location}
            onChange={set("location")}
          />
          <div className="ed-field-pair">
            <TextField label="Opening hours" name="hours" maxLength={500} value={place.hours} onChange={set("hours")} />
            <TextField
              label="Price"
              name="price"
              value={place.price}
              onChange={set("price")}
              hint="Leave blank until confirmed."
            />
          </div>
          <MapsLinkField value={place.mapsUrl || ""} onChange={(value) => onChange({ mapsUrl: value }, `${place.id}:mapsUrl`)} />
        </PanelSection>

        <PanelSection
          title="Position"
          description="A place has two separate positions: its pin on the illustrated map, and its real location for navigation and directions."
          testId="position-section"
        >
          <div className="ed-position-card">
            <div className="ed-position-head">
              <strong>Pin on the illustrated map</strong>
              <span>"Illustrated" and "Original" views</span>
            </div>
            <p className="ed-position-value" data-testid="illustration-position">
              {Math.round(place.x)}% across, {Math.round(place.y)}% down
            </p>
            {place.illustrationEstimated && (
              <p className="ed-note ed-note-warning">
                Rough guess from the nearest place. Use Move pin to place it on the illustration.
              </p>
            )}
            <div className="ed-position-actions">
              <Button size="sm" onClick={onMove}>
                <Icon.Move /> Move pin
              </Button>
            </div>
          </div>
          <div className="ed-position-card">
            <div className="ed-position-head">
              <strong>Real location</strong>
              <span>Navigation map and directions</span>
            </div>
            <p className="ed-position-value" data-testid="real-location">
              {Geo.formatLatLng(place)}
            </p>
            <div className="ed-position-actions">
              <Button size="sm" variant="outline" onClick={onSetOnNavigationMap}>
                <Icon.Locate /> Use navigation map
              </Button>
            </div>
            <details className="ed-inline-details">
              <summary>Type coordinates</summary>
              <div className="ed-field-pair">
                <NumberField
                  label="Latitude"
                  name="lat"
                  value={place.lat}
                  min={-90}
                  max={90}
                  onChange={(value) => onChange({ lat: value }, `${place.id}:lat`)}
                />
                <NumberField
                  label="Longitude"
                  name="lng"
                  value={place.lng}
                  min={-180}
                  max={180}
                  onChange={(value) => onChange({ lng: value }, `${place.id}:lng`)}
                />
              </div>
              {issues.lat && <p className="ed-error">{issues.lat}</p>}
            </details>
            {!coordinatesSet && (
              <p className="ed-note">Not set yet. Without it, the place is left out of the navigation map and directions.</p>
            )}
            <div className="ed-directions" data-testid="directions-confirm">
              <Toggle
                label="Entrance confirmed: offer directions"
                name="entranceConfirmed"
                checked={!!place.entranceConfirmed}
                hint={
                  place.kind === "area-guide"
                    ? "Area guides never offer directions, even when this is on."
                    : "Turn on only after checking the actual accessible entrance or a public viewing point on site. Until then visitors see “Location to confirm” and no directions."
                }
                onChange={(value) => onChange({ entranceConfirmed: value }, null)}
              />
              {issues.entranceConfirmed && <p className="ed-error">{issues.entranceConfirmed}</p>}
              <DateField
                label="Confirmed on site on"
                name="entranceConfirmedOn"
                value={place.entranceConfirmedOn}
                onChange={(value) => onChange({ entranceConfirmedOn: value }, null)}
              />
              <TextField
                label="How it was confirmed"
                name="entranceNote"
                multiline
                rows={2}
                maxLength={500}
                value={place.entranceNote}
                hint="Which entrance or viewpoint, and how. Editors only."
                onChange={set("entranceNote")}
              />
            </div>
          </div>
        </PanelSection>

        <PanelSection title="Visibility" testId="visibility-section">
          <Toggle
            label="Show on the visitor map when you publish"
            name="approved"
            checked={place.approved}
            hint={place.approved ? "Visitors will see this place after the next Publish." : "Stays in the draft only."}
            onChange={(value) => onChange({ approved: value }, null)}
          />
          <details className="ed-inline-details">
            <summary>Fact-check details</summary>
            <SelectField
              label="Fact-check status"
              value={place.verification}
              items={[
                { value: "pending", label: "Needs verification" },
                { value: "checked", label: "Checked with a source" },
              ]}
              onChange={(value) => onChange({ verification: value }, null)}
            />
            {issues.verification && <p className="ed-error">{issues.verification}</p>}
            <div className="ed-field">
              <label htmlFor={`${place.id}-checked`}>Last checked</label>
              <input
                id={`${place.id}-checked`}
                type="date"
                value={place.lastChecked}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => onChange({ lastChecked: event.target.value }, `${place.id}:lastChecked`)}
              />
            </div>
            <TextField label="Source or who checked it" name="source" multiline maxLength={2000} value={place.source} onChange={set("source")} />
            <TextField
              label="Public verification note"
              name="verificationNotes"
              multiline
              maxLength={2000}
              value={place.verificationNotes}
              onChange={set("verificationNotes")}
            />
          </details>
        </PanelSection>

        <PanelSection title="Marker style" description="Only used by the flat Illustrated view." collapsible defaultOpen={false}>
          <SelectField
            label="Marker icon"
            value={place.icon}
            items={MARKER_ICONS.map((label, index) => ({ label, value: index === 0 ? "pin" : `icon-${index - 1}` }))}
            onChange={(value) => onChange({ icon: value }, null)}
          />
          <label className="ed-field">
            <span>Size · {place.size}%</span>
            <Slider
              aria-label="Marker size"
              value={[place.size]}
              min={30}
              max={140}
              step={5}
              onValueChange={([value]) => onChange({ size: value }, `${place.id}:size`)}
            />
          </label>
          <label className="ed-field">
            <span>Rotation · {place.rotation || 0}°</span>
            <Slider
              aria-label="Marker rotation"
              value={[place.rotation || 0]}
              min={0}
              max={355}
              step={5}
              onValueChange={([value]) => onChange({ rotation: value }, `${place.id}:rotation`)}
            />
          </label>
        </PanelSection>

        <div className="ed-danger-zone">
          <Button variant="destructive" onClick={onDelete} data-testid="delete-place">
            <Icon.Trash /> Delete place
          </Button>
          <small>You'll be asked to confirm. Visitors keep seeing it until you publish.</small>
        </div>
      </div>
      {footer}
    </div>
  );
}

// Short form shown after a new pin's position is confirmed.
function AddPlaceForm({
  lang,
  canUploadPhotos,
  saving,
  initial,
  positionLabel,
  onSubmit,
  onCancel,
  onUploadingChange,
  onCategoryChange,
}) {
  const [fields, setFields] = useState(() => ({
    nameEn: initial?.nameEn ?? "",
    nameTh: initial?.nameTh ?? "",
    category: initial?.category ?? "Community",
    storyEn: initial?.storyEn ?? "",
    photoUrl: initial?.photoUrl ?? "",
    photoAlt: initial?.photoAlt ?? "",
    photoCredit: initial?.photoCredit ?? "",
    photoSource: initial?.photoSource ?? "",
    approved: true,
  }));
  const [touched, setTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (field) => (value) => setFields((current) => ({ ...current, [field]: value }));
  const nameError = touched && !fields.nameEn.trim() ? "Enter a name for the place." : null;
  const preview = { ...createPlaceRecord("preview"), ...fields, nameEn: fields.nameEn || "New place" };
  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!fields.nameEn.trim() || uploading) return;
    onSubmit({ ...fields, nameEn: fields.nameEn.trim(), nameTh: fields.nameTh.trim() || fields.nameEn.trim() });
  };
  return (
    <form className="ed-panel-inner ed-add-form" onSubmit={submit} data-testid="add-place-form" noValidate>
      <header className="ed-panel-head">
        <div>
          <span className="ed-eyebrow">New place</span>
          <h2>Tell visitors what this is</h2>
          <p className="ed-section-description">Pin position: {positionLabel}. You can add more details after saving.</p>
        </div>
        <button type="button" className="ed-icon-button" aria-label="Cancel new place" onClick={onCancel}>
          <Icon.X size={18} />
        </button>
      </header>
      <div className="ed-panel-scroll">
        <PanelSection title="About the place">
          <TextField
            label="Name in English"
            name="nameEn"
            required
            autoFocus
            value={fields.nameEn}
            error={nameError}
            onChange={set("nameEn")}
            onBlur={() => setTouched(true)}
          />
          <TextField
            label="Name in Thai"
            name="nameTh"
            lang="th"
            value={fields.nameTh}
            hint="Optional for now. The English name is used until you add it."
            onChange={set("nameTh")}
          />
          <CategoryPicker
            value={fields.category}
            lang={lang}
            onChange={(value) => (set("category")(value), onCategoryChange?.(value))}
          />
          <TextField
            label="Short description"
            name="storyEn"
            multiline
            maxLength={2000}
            value={fields.storyEn}
            onChange={set("storyEn")}
          />
        </PanelSection>
        <PanelSection title="Photo (optional)">
          {canUploadPhotos ? (
            <PhotoUploader
              hasPhoto={!!fields.photoUrl}
              disabled={saving}
              onUploadingChange={(value) => (setUploading(value), onUploadingChange?.(value))}
              onPhotoChange={(url) =>
                setFields((current) => ({
                  ...current,
                  photoUrl: url,
                  photoSource: url ? current.photoSource : "",
                  photoAlt: url ? current.photoAlt || current.nameEn : "",
                }))
              }
            >
              <div className="ed-photo-preview">
                <PlacePhoto place={preview} />
              </div>
            </PhotoUploader>
          ) : (
            <p className="ed-note">Photo uploads need Editor access to this map.</p>
          )}
        </PanelSection>
        <PanelSection title="Visibility">
          <Toggle
            label="Show on the visitor map when you publish"
            name="approved"
            checked={fields.approved}
            onChange={set("approved")}
            hint="It will be labelled “Needs verification” until someone checks it."
          />
        </PanelSection>
      </div>
      <footer className="ed-panel-footer">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || uploading} data-testid="add-place-submit">
          {saving ? <Icon.Loader className="ed-spin" /> : <Icon.Save />} Add place and save draft
        </Button>
      </footer>
    </form>
  );
}
