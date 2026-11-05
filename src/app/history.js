// Undo / redo for the editor's working copy ({ places, structures }).
//
// Every change goes through `change(updater, { label, group })`. Typing in one field
// produces many changes; those that share a `group` within GROUP_WINDOW_MS are merged
// into a single undo step, so Undo restores the whole edit of that field at once.

const HISTORY_LIMIT = 100;
const GROUP_WINDOW_MS = 1200;

function historyReducer(state, action) {
  switch (action.type) {
    case "change": {
      const next = action.updater(state.present);
      if (next === state.present) return state;
      const now = Date.now();
      const merge = action.group && state.group === action.group && now - state.at < GROUP_WINDOW_MS;
      return {
        past: merge ? state.past : [...state.past, { doc: state.present, label: action.label }].slice(-HISTORY_LIMIT),
        present: next,
        future: [],
        group: action.group ?? null,
        at: now,
        label: action.label,
      };
    }
    case "undo": {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous.doc,
        future: [{ doc: state.present, label: previous.label }, ...state.future],
        group: null,
        at: 0,
        label: previous.label,
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return {
        past: [...state.past, { doc: state.present, label: next.label }],
        present: next.doc,
        future: rest,
        group: null,
        at: 0,
        label: next.label,
      };
    }
    case "reset":
      return { past: [], present: action.doc, future: [], group: null, at: 0, label: null };
    case "seal":
      return { ...state, group: null };
    default:
      return state;
  }
}

function useEditHistory(initialDoc) {
  const [state, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialDoc,
    future: [],
    group: null,
    at: 0,
    label: null,
  });
  const api = useMemo(
    () => ({
      change: (updater, { label, group } = {}) => dispatch({ type: "change", updater, label, group }),
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
      reset: (doc) => dispatch({ type: "reset", doc }),
      // Ends the current typing group, so the next keystroke starts a new undo step.
      seal: () => dispatch({ type: "seal" }),
    }),
    [],
  );
  return {
    ...api,
    doc: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undoLabel: state.past[state.past.length - 1]?.label ?? null,
    redoLabel: state.future[0]?.label ?? null,
  };
}
