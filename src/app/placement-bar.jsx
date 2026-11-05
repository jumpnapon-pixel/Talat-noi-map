// The bar shown while a pin is being placed: live position, small adjustment arrows,
// the top-down view, and Confirm / Cancel.

const ADJUSTMENT_MESSAGES = {
  building: "Moved to the nearest open ground. Pins can't sit on a roof.",
  structure: "Moved off a 3D landmark model to the open ground beside it.",
  boundary: "Kept inside the red project boundary.",
};

function PlacementBar({
  placement,
  placeName,
  info,
  step,
  topView,
  onStepChange,
  onNudge,
  onTopView,
  onConfirm,
  onCancel,
}) {
  const adding = placement.kind === "add";
  const hasPosition = !!info;
  const canConfirm = hasPosition && (adding || info.moved);
  const nudge = (forward, right, label) => (
    <button
      type="button"
      className="ed-nudge"
      disabled={!hasPosition}
      aria-label={`Nudge ${label} by ${step} m`}
      title={`Nudge ${label} by ${step} m`}
      onClick={() => onNudge(forward, right)}
    >
      {forward > 0 ? <Icon.ArrowUp /> : forward < 0 ? <Icon.ArrowDown /> : right < 0 ? <Icon.ArrowLeft /> : <Icon.ArrowRight />}
    </button>
  );
  return (
    <div className="ed-placement-bar" role="region" aria-label="Pin placement" data-testid="placement-bar">
      <div className="ed-placement-text">
        <strong>{adding ? "Adding a new place" : `Moving “${placeName}”`}</strong>
        <p role="status" aria-live="polite">
          {!hasPosition
            ? "Tap the map where the place is."
            : info.adjusted
              ? ADJUSTMENT_MESSAGES[info.adjusted]
              : adding
                ? "Drag the new pin, or tap another spot. Use the arrows for small steps."
                : info.moved
                  ? "New position shown with the blue ring. Confirm to keep it."
                  : "Drag the pin, or tap where it should go."}
        </p>
        {hasPosition && (
          <small className="ed-placement-coords" data-testid="pending-coordinates">
            {info.lat.toFixed(6)}, {info.lng.toFixed(6)}
          </small>
        )}
      </div>
      <div className="ed-placement-tools">
        <div className="ed-nudge-pad" aria-label="Fine adjustment">
          <span />
          {nudge(1, 0, "up")}
          <span />
          {nudge(0, -1, "left")}
          <button
            type="button"
            className="ed-nudge-step"
            onClick={() => onStepChange(step === 1 ? 5 : 1)}
            aria-label={`Step size ${step} metres. Change step size`}
            title="Change step size"
          >
            {step} m
          </button>
          {nudge(0, 1, "right")}
          <span />
          {nudge(-1, 0, "down")}
          <span />
        </div>
        <Button variant={topView ? "default" : "outline"} size="sm" aria-pressed={topView} onClick={onTopView} data-testid="top-view">
          <Icon.TopDown /> {topView ? "Back to 3D view" : "Top-down view"}
        </Button>
      </div>
      <div className="ed-placement-actions">
        <Button variant="outline" onClick={onCancel} data-testid="placement-cancel">
          <Icon.X /> Cancel
        </Button>
        <Button onClick={onConfirm} disabled={!canConfirm} data-testid="placement-confirm">
          <Icon.Check /> Confirm position
        </Button>
      </div>
    </div>
  );
}
