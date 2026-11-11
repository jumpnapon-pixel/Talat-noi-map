// Part 2: Talat Noi app components (schema, maps, place cards, editors)
// Recovered from the compiled Talat Noi Map bundle (esbuild output, formatted with Prettier).
// This file is concatenated inside one IIFE by scripts/build.mjs; its identifiers are the
// original minified names. See docs/ARCHITECTURE.md for a map of the important ones.
  // Uploaded photos: the original server (/api/photos/<uuid>.jpg), the artifact's durable
  // asset store (/_blob/<id>), and photos kept in this browser by the local preview store
  // (stored as local-photo:<id>, shown through blob: URLs while the page is open).
  var TN =
    /^(\/api\/photos\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)|\/_blob\/[A-Za-z0-9_-]{8,64}|local-photo:[0-9a-f-]{36}|blob:(https?:\/\/[^\s/]+|null)\/[0-9a-f-]{36})$/i;
  var q1 = ["Heritage", "Belief", "Art & craft", "Food & drink", "Community"],
    kg = Yt.string().trim().max(180),
    sp = Yt.string().trim().max(2e3),
    CN = Yt.string()
      .max(1500)
      .refine(
        (t) => !t || /^https:\/\/[^\s]+$/i.test(t) || /^\/?assets\/[a-z0-9_./-]+$/i.test(t),
        "Use an https photo/source URL or a map asset.",
      ),
    gW = Yt.object({
      id: Yt.string().regex(/^[a-z0-9-]{1,80}$/),
      nameEn: kg.min(1, "An English name is required."),
      nameTh: kg.min(1, "A Thai name is required."),
      category: Yt.enum(q1),
      photoUrl: Yt.string()
        .max(1500)
        .refine(
          (t) => TN.test(t) || CN.safeParse(t).success,
          "Choose an uploaded photo or a valid photo link.",
        ),
      photoAlt: kg,
      photoCredit: kg,
      photoSource: CN,
      storyEn: sp,
      storyTh: sp,
      tipEn: sp,
      tipTh: sp,
      location: Yt.string().trim().max(500),
      lat: Yt.number().min(-90).max(90).nullable(),
      lng: Yt.number().min(-180).max(180).nullable(),
      mapsUrl: Yt.string()
        .trim()
        .max(4096)
        .refine((t) => !t || !!iu(t), j1)
        .default(""),
      price: kg,
      hours: Yt.string().trim().max(500),
      lastChecked: Yt.string().refine(
        (t) =>
          !t ||
          (/^\d{4}-\d{2}-\d{2}$/.test(t) &&
            !Number.isNaN(Date.parse(t)) &&
            new Date(t).toISOString().slice(0, 10) === t &&
            t <= new Date().toISOString().slice(0, 10)),
        "Use a real date, today or earlier.",
      ),
      verification: Yt.enum(["pending", "checked"]),
      verificationNotes: sp,
      source: sp,
      approved: Yt.boolean(),
      x: Yt.number().min(2).max(98),
      y: Yt.number().min(2).max(98),
      size: Yt.number().int().min(30).max(140),
      icon: Yt.string().regex(/^(pin|icon-[0-9])$/),
      rotation: Yt.number().int().min(0).max(359).default(0),
      // Talat Noi editor additions (older records default to these values).
      photoCaption: kg.default(""),
      illustrationEstimated: Yt.boolean().default(!1),
      // Talat Noi editor: guide content. previewEn/Th is the one-line card preview; kind
      // labels field notes and area guides; aliases keep old titles searchable; related
      // holds place ids; sources are the links shown on the card. Directions are offered
      // only once an editor confirms the entrance (entranceConfirmed).
      previewEn: Yt.string().trim().max(400).default(""),
      previewTh: Yt.string().trim().max(400).default(""),
      kind: Yt.enum(["place", "field-note", "area-guide"]).default("place"),
      aliases: Yt.array(Yt.string().trim().min(1).max(120)).max(20).default([]),
      related: Yt.array(Yt.string().regex(/^[a-z0-9-]{1,80}$/)).max(8).default([]),
      sources: Yt.array(
        Yt.object({
          id: Yt.string().trim().max(12).default(""),
          title: Yt.string().trim().min(1, "Give each source a title.").max(300),
          url: Yt.string()
            .trim()
            .max(1500)
            .regex(/^https:\/\/[^\s]+$/i, "Use an https link for each source."),
        }),
      )
        .max(20)
        .default([]),
      entranceConfirmed: Yt.boolean().default(!1),
      entranceConfirmedOn: Yt.string()
        .refine(
          (t) => !t || (/^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(t))),
          "Use a real date (YYYY-MM-DD).",
        )
        .default(""),
      entranceNote: Yt.string().trim().max(500).default(""),
      researchReviewedOn: Yt.string()
        .refine(
          (t) => !t || (/^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(t))),
          "Use a real date (YYYY-MM-DD).",
        )
        .default(""),
      editorNotes: Yt.string().trim().max(4000).default(""),
    }).superRefine((t, e) => {
      ((t.lat === null) != (t.lng === null) &&
        e.addIssue({
          code: "custom",
          message: "Enter both latitude and longitude, or leave both blank.",
          path: ["lat"],
        }),
        // Talat Noi editor: directions need the confirmed entrance's coordinates.
        t.entranceConfirmed &&
          (t.lat === null || t.lng === null) &&
          e.addIssue({
            code: "custom",
            message: "Set the real location before confirming the entrance for directions.",
            path: ["entranceConfirmed"],
          }),
        t.verification === "checked" &&
          (!t.lastChecked || !t.source || !t.storyEn || !t.tipEn || !t.location) &&
          e.addIssue({
            code: "custom",
            message: "Checked places need a date, source, story, visiting tip and location.",
            path: ["verification"],
          }));
    }),
    W1 = Yt.array(gW)
      .max(100)
      .refine((t) => new Set(t.map((e) => e.id)).size === t.length, "Each place needs a unique ID."),
    LN = [
      "Pinpoint",
      "Chinese gateway",
      "Heritage shophouse",
      "Thai-Chinese shrine",
      "Warehouse",
      "Riverside mansion",
      "Art gallery",
      "Pier pavilion",
      "Clock tower",
      "Covered market",
      "Community museum",
    ];
  function Ng(t = `place-${crypto.randomUUID()}`) {
    return {
      id: t,
      nameEn: "New place",
      nameTh: "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E43\u0E2B\u0E21\u0E48",
      category: "Community",
      photoUrl: "",
      photoAlt: "",
      photoCredit: "",
      photoSource: "",
      storyEn: "",
      storyTh: "",
      tipEn: "",
      tipTh: "",
      location: "",
      lat: null,
      lng: null,
      mapsUrl: "",
      price: "",
      hours: "",
      lastChecked: "",
      verification: "pending",
      verificationNotes: "Details and map position need verification.",
      source: "",
      approved: !1,
      x: 50,
      y: 48,
      size: 60,
      icon: "pin",
      rotation: 0,
      photoCaption: "",
      illustrationEstimated: !1,
    };
  }
  function EN(t) {
    return t
      ? new Date(t.slice(0, 10) + "T12:00:00Z").toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
      : "Not checked yet";
  }
  R();
  var ou = we(mt(), 1);
  ru();
  function RN() {
    let [t, e] = (0, ou.useState)(y3),
      [n, a] = (0, ou.useState)(0),
      i = (0, ou.useRef)(null);
    ((0, ou.useEffect)(() => {
      let o = new Y1(navigator.geolocation, window.isSecureContext, e);
      i.current = o;
      let s = () => (document.hidden ? o.pause() : o.resume()),
        l = () => o.stop();
      return (
        document.addEventListener("visibilitychange", s),
        window.addEventListener("pagehide", l),
        () => {
          (o.dispose(),
            (i.current = null),
            document.removeEventListener("visibilitychange", s),
            window.removeEventListener("pagehide", l));
        }
      );
    }, []),
      (0, ou.useEffect)(() => {
        if (!t.fix) return;
        a(Date.now());
        let o = setInterval(() => a(Date.now()), 5e3);
        return () => clearInterval(o);
      }, [t.fix]));
    let r = t.phase === "live" && Wo(t.fix, n || Date.now());
    return {
      ...t,
      now: n,
      fresh: r,
      usableFix: r ? t.fix : null,
      start: () => i.current?.start(),
      stop: () => i.current?.stop(),
    };
  }
  R();
  var lp = we(mt(), 1);
  R();
  var b3 = (t, e) => Math.hypot(t.x - e.x, t.y - e.y),
    IN = (t, e) => ({ x: (t.x + e.x) / 2, y: (t.y + e.y) / 2 }),
    Bg = (t, e, n) => Math.max(e, Math.min(n, t)),
    Z1 = class {
      constructor(e) {
        this.emit = e;
        this.view = { x: 0, y: 0, zoom: 1, width: 0, height: 0 };
        this.moved = !1;
        this.viewport = { width: 0, height: 0 };
        this.base = { width: 0, height: 0 };
        this.pointers = new Map();
        this.baseline = null;
      }
      commit(e) {
        let { width: n, height: a } = this.viewport;
        ((this.view = {
          ...e,
          x: e.width <= n ? (n - e.width) / 2 : Bg(e.x, n - e.width, 0),
          y: e.height <= a ? (a - e.height) / 2 : Bg(e.y, a - e.height, 0),
        }),
          this.emit({ ...this.view }));
      }
      rebase() {
        this.baseline = {
          view: { ...this.view },
          points: [...this.pointers.values()].slice(0, 2).map((e) => ({ ...e })),
        };
      }
      resize(e, n, a) {
        if (e <= 0 || n <= 0) return;
        let i = this.view,
          r = this.viewport,
          o = {
            x: i.width ? (r.width / 2 - i.x) / i.width : 0.5,
            y: i.height ? (r.height / 2 - i.y) / i.height : 0.5,
          };
        ((this.viewport = { width: e, height: n }),
          (this.base = { width: Math.min(e, n * a), height: Math.min(n, e / a) }));
        let s = this.base.width * i.zoom,
          l = this.base.height * i.zoom;
        (this.commit({ zoom: i.zoom, width: s, height: l, x: e / 2 - o.x * s, y: n / 2 - o.y * l }),
          this.rebase());
      }
      zoomTo(e, n = { x: this.viewport.width / 2, y: this.viewport.height / 2 }) {
        e = Bg(e, 1, 4);
        let a = e / this.view.zoom;
        (this.commit({
          zoom: e,
          width: this.base.width * e,
          height: this.base.height * e,
          x: n.x - (n.x - this.view.x) * a,
          y: n.y - (n.y - this.view.y) * a,
        }),
          this.rebase());
      }
      reset() {
        this.zoomTo(1);
      }
      centerAt(e, n = 2.5) {
        if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || e.x < 0 || e.x > 1 || e.y < 0 || e.y > 1)
          return;
        n = Bg(n, 1, 4);
        let a = this.base.width * n,
          i = this.base.height * n;
        (this.commit({
          zoom: n,
          width: a,
          height: i,
          x: this.viewport.width / 2 - e.x * a,
          y: this.viewport.height / 2 - e.y * i,
        }),
          this.rebase());
      }
      pan(e, n) {
        (this.commit({ ...this.view, x: this.view.x + e, y: this.view.y + n }), this.rebase());
      }
      down(e, n) {
        (this.pointers.size || (this.moved = !1),
          this.pointers.set(e, n),
          this.pointers.size > 1 && (this.moved = !0),
          this.rebase());
      }
      move(e, n) {
        if (!this.pointers.has(e) || !this.baseline) return;
        this.pointers.set(e, n);
        let a = [...this.pointers.values()].slice(0, 2),
          i = this.baseline.points,
          r = this.baseline.view;
        if (a.length === 1) {
          if (!this.moved && b3(a[0], i[0]) < 7) return;
          ((this.moved = !0), this.commit({ ...r, x: r.x + a[0].x - i[0].x, y: r.y + a[0].y - i[0].y }));
        } else {
          let o = b3(i[0], i[1]);
          if (o < 1) return;
          let s = Bg((r.zoom * b3(a[0], a[1])) / o, 1, 4),
            l = IN(i[0], i[1]),
            c = IN(a[0], a[1]),
            u = s / r.zoom;
          ((this.moved = !0),
            this.commit({
              zoom: s,
              width: this.base.width * s,
              height: this.base.height * s,
              x: c.x - (l.x - r.x) * u,
              y: c.y - (l.y - r.y) * u,
            }));
        }
      }
      up(e, n = !1) {
        this.pointers.delete(e) && (n && (this.moved = !0), this.rebase());
      }
      cancel() {
        (this.pointers.size && (this.moved = !0), this.pointers.clear(), (this.baseline = null));
      }
    };
  function K1(t, e, n) {
    let [a, i] = (0, lp.useState)(1),
      r = (0, lp.useRef)(null);
    return (
      (0, lp.useEffect)(() => {
        let o = t.current,
          s = e.current;
        if (!o || !s) return;
        let l = new Map(),
          c = 0,
          u = new Z1((b) => {
            ((s.style.width = `${b.width}px`),
              (s.style.height = `${b.height}px`),
              (s.style.transform = `translate3d(${b.x}px,${b.y}px,0)`),
              cancelAnimationFrame(c),
              (c = requestAnimationFrame(() => i(b.zoom))));
          });
        r.current = u;
        let d = (b) => {
            let S = o.getBoundingClientRect();
            return { x: b.clientX - S.left - o.clientLeft, y: b.clientY - S.top - o.clientTop };
          },
          f = () => u.resize(o.clientWidth, o.clientHeight, n),
          h = new ResizeObserver(f);
        (h.observe(o), f());
        let m = (b) => {
            if (b.pointerType === "mouse" && b.button !== 0) return;
            u.down(b.pointerId, d(b));
            let S = b.target instanceof Element ? b.target : o;
            try {
              (S.setPointerCapture(b.pointerId), l.set(b.pointerId, S));
            } catch {}
          },
          v = (b) => {
            (u.move(b.pointerId, d(b)), u.moved && l.has(b.pointerId) && o.classList.add("is-dragging"));
          },
          g = (b) => {
            (u.up(b.pointerId, b.type !== "pointerup"),
              l.delete(b.pointerId),
              l.size || o.classList.remove("is-dragging"));
          },
          p = (b) => {
            u.moved && (b.detail > 0 || b.pointerType) && (b.preventDefault(), b.stopPropagation());
          },
          y = (b) => {
            b.preventDefault();
            let S = b.deltaY * (b.deltaMode === 1 ? 16 : b.deltaMode === 2 ? o.clientHeight : 1);
            u.zoomTo(u.view.zoom * Math.exp(-vW(S) * 0.003), d(b));
          },
          w = (b) => {
            if (b.target !== o) return;
            let S = 50;
            if (b.key === "+" || b.key === "=") u.zoomTo(u.view.zoom + 0.25);
            else if (b.key === "-") u.zoomTo(u.view.zoom - 0.25);
            else if (b.key === "Home" || b.key === "0") u.reset();
            else if (b.key === "ArrowLeft") u.pan(S, 0);
            else if (b.key === "ArrowRight") u.pan(-S, 0);
            else if (b.key === "ArrowUp") u.pan(0, S);
            else if (b.key === "ArrowDown") u.pan(0, -S);
            else return;
            b.preventDefault();
          },
          _ = () => {
            u.cancel();
            for (let [b, S] of l)
              try {
                S.hasPointerCapture(b) && S.releasePointerCapture(b);
              } catch {}
            (l.clear(), o.classList.remove("is-dragging"));
          },
          T = () => {
            document.hidden && _();
          };
        return (
          o.addEventListener("pointerdown", m),
          o.addEventListener("pointermove", v),
          o.addEventListener("pointerup", g),
          o.addEventListener("pointercancel", g),
          o.addEventListener("lostpointercapture", g),
          o.addEventListener("click", p, !0),
          o.addEventListener("wheel", y, { passive: !1 }),
          o.addEventListener("keydown", w),
          window.addEventListener("blur", _),
          document.addEventListener("visibilitychange", T),
          () => {
            (h.disconnect(),
              _(),
              cancelAnimationFrame(c),
              (r.current = null),
              o.removeEventListener("pointerdown", m),
              o.removeEventListener("pointermove", v),
              o.removeEventListener("pointerup", g),
              o.removeEventListener("pointercancel", g),
              o.removeEventListener("lostpointercapture", g),
              o.removeEventListener("click", p, !0),
              o.removeEventListener("wheel", y),
              o.removeEventListener("keydown", w),
              window.removeEventListener("blur", _),
              document.removeEventListener("visibilitychange", T));
          }
        );
      }, [t, e, n]),
      {
        zoom: a,
        maxZoom: 4,
        zoomBy: (o) => {
          let s = r.current;
          s && s.zoomTo(s.view.zoom + o);
        },
        reset: () => r.current?.reset(),
        centerAt: (o, s = 2.5) => r.current?.centerAt(o, s),
      }
    );
  }
  var vW = (t) => Math.max(-180, Math.min(180, t));
  R();
  ru();
  cp();
  R();
  var Bl = we(mt(), 1);
  Yd();
  R();
  var GN = [],
    O3 = new Set(),
    MW = [],
    VN = () => GN,
    XN = () => MW;
  function D3(t) {
    ((GN = t), O3.forEach((e) => e()));
  }
  function jN(t) {
    return (
      O3.add(t),
      () => {
        O3.delete(t);
      }
    );
  }
  var pi = we(pt(), 1);
  function oS({ place: t, fix: e, lang: n }) {
    let [a, i] = (0, Bl.useState)(null),
      [r, o] = (0, Bl.useState)(!1),
      s = (0, Bl.useSyncExternalStore)(jN, VN, XN),
      l = (f, h) => (n === "en" ? f : h);
    (0, Bl.useEffect)(() => {
      let f = !0;
      return (
        I3()
          .then((h) => {
            f && i(h);
          })
          .catch(() => {
            f && o(!0);
          }),
        () => {
          f = !1;
        }
      );
    }, []);
    let c = (0, Bl.useMemo)(() => (a ? HN(a, t, e, s) : null), [a, t, e, s]),
      u = {
        "no-location": l(
          "Use My Location to get steps along this map\u2019s connected lanes.",
          "\u0E43\u0E0A\u0E49\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E19\u0E15\u0E32\u0E21\u0E15\u0E23\u0E2D\u0E01\u0E17\u0E35\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E01\u0E31\u0E19",
        ),
        "uncertain-location": l(
          "Your position is too uncertain for these narrow alleys. Wait for accuracy within 40 m, or use Google Maps.",
          "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E22\u0E31\u0E07\u0E04\u0E25\u0E32\u0E14\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E15\u0E23\u0E2D\u0E01\u0E41\u0E04\u0E1A \u0E23\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 40 \u0E21. \u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E0A\u0E49 Google Maps",
        ),
        "unverified-destination": l(
          "This destination needs checked coordinates and an entrance check before this map can offer walking steps.",
          "\u0E08\u0E38\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E19\u0E35\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E41\u0E25\u0E30\u0E17\u0E32\u0E07\u0E40\u0E02\u0E49\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E19\u0E35\u0E49\u0E08\u0E30\u0E1A\u0E2D\u0E01\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E19\u0E44\u0E14\u0E49",
        ),
        outside: l(
          "The start or destination is outside the red project boundary. Use Google Maps for that journey.",
          "\u0E08\u0E38\u0E14\u0E40\u0E23\u0E34\u0E48\u0E21\u0E2B\u0E23\u0E37\u0E2D\u0E08\u0E38\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E2D\u0E22\u0E39\u0E48\u0E19\u0E2D\u0E01\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E2A\u0E35\u0E41\u0E14\u0E07 \u0E43\u0E0A\u0E49 Google Maps \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E19\u0E35\u0E49",
        ),
        "no-nearby-lane": l(
          "No public mapped lane is close enough to both points. No shortcut through a building is generated.",
          "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E17\u0E32\u0E07\u0E2A\u0E32\u0E18\u0E32\u0E23\u0E13\u0E30\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E01\u0E25\u0E49\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E2D\u0E07\u0E08\u0E38\u0E14 \u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E17\u0E32\u0E07\u0E25\u0E31\u0E14\u0E1C\u0E48\u0E32\u0E19\u0E2D\u0E32\u0E04\u0E32\u0E23",
        ),
        disconnected: l(
          "The mapped paths do not connect after restricted and blocked passages are excluded. Use Google Maps and check access locally.",
          "\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E01\u0E31\u0E19\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E31\u0E19\u0E17\u0E32\u0E07\u0E08\u0E33\u0E01\u0E31\u0E14\u0E41\u0E25\u0E30\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E07\u0E2D\u0E2D\u0E01 \u0E42\u0E1B\u0E23\u0E14\u0E43\u0E0A\u0E49 Google Maps \u0E41\u0E25\u0E30\u0E15\u0E23\u0E27\u0E08\u0E17\u0E32\u0E07\u0E40\u0E02\u0E49\u0E32\u0E43\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48",
        ),
        ready: "",
      },
      d = c?.route;
    return (0, pi.jsxs)("details", {
      className: "street-directions",
      open: !!d,
      children: [
        (0, pi.jsxs)("summary", {
          children: [
            (0, pi.jsx)(Gc, { size: 15 }),
            l(
              "Walking steps on the map",
              "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E19\u0E1A\u0E19\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48",
            ),
          ],
        }),
        d
          ? (0, pi.jsxs)(pi.Fragment, {
              children: [
                (0, pi.jsxs)("p", {
                  children: [
                    (0, pi.jsxs)("strong", { children: [Math.round(d.metres), " m"] }),
                    " \xB7 ",
                    l(
                      "along the modeled street network",
                      "\u0E15\u0E32\u0E21\u0E40\u0E04\u0E23\u0E37\u0E2D\u0E02\u0E48\u0E32\u0E22\u0E16\u0E19\u0E19\u0E43\u0E19\u0E42\u0E21\u0E40\u0E14\u0E25",
                    ),
                    d.hasSteps &&
                      l(" \xB7 includes stairs", " \xB7 \u0E21\u0E35\u0E1A\u0E31\u0E19\u0E44\u0E14"),
                  ],
                }),
                (0, pi.jsx)("ol", {
                  children: d.legs
                    .filter((f) => f.metres > 1)
                    .map((f, h) => {
                      let m =
                          f.turn === "start"
                            ? l(
                                "Start along",
                                "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E40\u0E14\u0E34\u0E19\u0E15\u0E32\u0E21",
                              )
                            : f.turn === "left"
                              ? l(
                                  "Turn left into",
                                  "\u0E40\u0E25\u0E35\u0E49\u0E22\u0E27\u0E0B\u0E49\u0E32\u0E22\u0E40\u0E02\u0E49\u0E32",
                                )
                              : f.turn === "right"
                                ? l(
                                    "Turn right into",
                                    "\u0E40\u0E25\u0E35\u0E49\u0E22\u0E27\u0E02\u0E27\u0E32\u0E40\u0E02\u0E49\u0E32",
                                  )
                                : l(
                                    "Continue along",
                                    "\u0E40\u0E14\u0E34\u0E19\u0E15\u0E48\u0E2D\u0E44\u0E1B\u0E15\u0E32\u0E21",
                                  ),
                        v =
                          (n === "en" ? f.en || f.th : f.th || f.en) ||
                          l(
                            f.category === "stairs"
                              ? "the mapped steps"
                              : f.category === "sidewalk"
                                ? "the sidewalk"
                                : "the mapped lane",
                            f.category === "stairs"
                              ? "\u0E1A\u0E31\u0E19\u0E44\u0E14\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"
                              : f.category === "sidewalk"
                                ? "\u0E17\u0E32\u0E07\u0E40\u0E17\u0E49\u0E32"
                                : "\u0E15\u0E23\u0E2D\u0E01\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
                          );
                      return (0, pi.jsxs)(
                        "li",
                        {
                          children: [
                            m,
                            " ",
                            (0, pi.jsx)("strong", { children: v }),
                            " \xB7 ",
                            Math.round(f.metres),
                            " m",
                          ],
                        },
                        `${f.wayId}-${h}`,
                      );
                    }),
                }),
                (0, pi.jsx)("p", {
                  className: "navigation-note",
                  children: l(
                    `Starts at the mapped lane (about ${Math.round(d.startOffsetMetres)} m from your position) and ends about ${Math.round(d.endOffsetMetres)} m from the destination coordinate. The final entrance and present access need a local check.`,
                    `\u0E40\u0E23\u0E34\u0E48\u0E21\u0E17\u0E35\u0E48\u0E17\u0E32\u0E07\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 (\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 ${Math.round(d.startOffsetMetres)} \u0E21. \u0E08\u0E32\u0E01\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E04\u0E38\u0E13) \u0E41\u0E25\u0E30\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14\u0E2B\u0E48\u0E32\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E08\u0E38\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 ${Math.round(d.endOffsetMetres)} \u0E21. \u0E17\u0E32\u0E07\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E2B\u0E49\u0E40\u0E14\u0E34\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E27\u0E08\u0E43\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48`,
                  ),
                }),
              ],
            })
          : (0, pi.jsx)("p", {
              children: c
                ? u[c.reason]
                : r
                  ? l(
                      "Street data could not load. Google Maps directions remain available.",
                      "\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E16\u0E19\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E22\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E43\u0E19 Google Maps \u0E44\u0E14\u0E49",
                    )
                  : l(
                      "Loading the connected paths\u2026",
                      "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E01\u0E31\u0E19\u2026",
                    ),
            }),
        (0, pi.jsx)("small", {
          children: l(
            "Map-sourced prototype \xB7 current access is not fully surveyed.",
            "\u0E15\u0E49\u0E19\u0E41\u0E1A\u0E1A\u0E15\u0E32\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48 \xB7 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E17\u0E38\u0E01\u0E17\u0E32\u0E07",
          ),
        }),
      ],
    });
  }
  var St = we(pt(), 1),
    TW = {
      off: [
        "Location is off",
        "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07",
      ],
      locating: [
        "Finding your location\u2026",
        "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u2026",
      ],
      live: [
        "Live location",
        "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
      ],
      paused: [
        "Paused while this tab is hidden",
        "\u0E2B\u0E22\u0E38\u0E14\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E14\u0E39\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49",
      ],
      denied: [
        "Location access is blocked. Allow it in your browser\u2019s site settings, then try again.",
        "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E42\u0E1B\u0E23\u0E14\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E43\u0E19\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E02\u0E2D\u0E07\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C\u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07",
      ],
      unavailable: [
        "Your location is unavailable. Check your device\u2019s location settings, or try outside.",
        "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E42\u0E1B\u0E23\u0E14\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C \u0E2B\u0E23\u0E37\u0E2D\u0E25\u0E2D\u0E07\u0E43\u0E19\u0E17\u0E35\u0E48\u0E42\u0E25\u0E48\u0E07",
      ],
      timeout: [
        "Still waiting for a location signal. Try again in an open area.",
        "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E43\u0E19\u0E17\u0E35\u0E48\u0E42\u0E25\u0E48\u0E07",
      ],
      unsupported: [
        "This browser cannot provide your location. You can still get directions in Google Maps.",
        "\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E04\u0E38\u0E13\u0E22\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E43\u0E19 Google Maps \u0E44\u0E14\u0E49",
      ],
      insecure: [
        "Open the published map in its own secure browser tab to use your location.",
        "\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E17\u0E35\u0E48\u0E40\u0E1C\u0E22\u0E41\u0E1E\u0E23\u0E48\u0E41\u0E25\u0E49\u0E27\u0E43\u0E19\u0E41\u0E17\u0E47\u0E1A\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E0A\u0E49\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07",
      ],
    };
  function qN({ place: t, fix: e, lang: n = "en" }) {
    let a = Gd(t, e);
    return a
      ? (0, St.jsx)(_t, {
          asChild: !0,
          className: "walking-button",
          children: (0, St.jsxs)("a", {
            href: a.href,
            target: "_blank",
            rel: "noopener noreferrer",
            onClick: (i) => {
              let r = Gd(t, e);
              if (!r) {
                i.preventDefault();
                return;
              }
              i.currentTarget.href = r.href;
            },
            children: [
              (0, St.jsx)(Gc, {}),
              n === "en" ? "Directions" : "\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07",
              (0, St.jsx)(yl, { size: 15 }),
            ],
          }),
        })
      : (0, St.jsx)("p", {
          className: "navigation-note",
          children:
            n === "en"
              ? "Directions need a saved map link or coordinates."
              : "\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49",
        });
  }
  function CW({ place: t, fix: e, lang: n = "en", compact: a = !1 }) {
    let i = Gd(t, e);
    if (!i)
      return (0, St.jsx)("p", {
        className: "navigation-note",
        children:
          n === "en"
            ? "Add a Google Maps link or both coordinates for this place."
            : "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E34\u0E07\u0E01\u0E4C Google Maps \u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E2D\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E19\u0E35\u0E49",
      });
    let { href: r, kind: o } = i;
    return (0, St.jsxs)("div", {
      className: a ? "directions-link compact" : "directions-link",
      children: [
        (0, St.jsx)(oS, { place: t, fix: e, lang: n }),
        (0, St.jsx)(_t, {
          asChild: !0,
          className: "walking-button",
          children: (0, St.jsxs)("a", {
            href: r,
            target: "_blank",
            rel: "noopener noreferrer",
            onClick: (s) => {
              let l = Gd(t, e);
              if (!l) {
                s.preventDefault();
                return;
              }
              s.currentTarget.href = l.href;
            },
            children: [
              o === "place" ? (0, St.jsx)(Yi, {}) : (0, St.jsx)(Gc, {}),
              o === "place"
                ? n === "en"
                  ? "Open in Google Maps"
                  : "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E19 Google Maps"
                : n === "en"
                  ? "Walking directions"
                  : "\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19",
              (0, St.jsx)(yl, { size: 15 }),
            ],
          }),
        }),
        (0, St.jsx)("small", {
          children:
            o === "place"
              ? n === "en"
                ? "Opens the saved place link. Choose Directions in Google Maps, then select walking."
                : "\u0E40\u0E1B\u0E34\u0E14\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49 \u0E01\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E43\u0E19 Google Maps \u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E14\u0E34\u0E19"
              : n === "en"
                ? "Opens Google Maps for the route and navigation."
                : "\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E19\u0E33\u0E17\u0E32\u0E07\u0E43\u0E19 Google Maps",
        }),
        t.verification !== "checked" &&
          (0, St.jsx)("p", {
            className: "destination-warning",
            children:
              n === "en"
                ? "Prototype destination: confirm the pin and entrance before walking."
                : "\u0E08\u0E38\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E09\u0E1A\u0E31\u0E1A\u0E15\u0E49\u0E19\u0E41\u0E1A\u0E1A: \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E2B\u0E21\u0E38\u0E14\u0E41\u0E25\u0E30\u0E17\u0E32\u0E07\u0E40\u0E02\u0E49\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07",
          }),
      ],
    });
  }
  function sS({ location: t, places: e, selectedId: n, onSelect: a, lang: i, onCenter: r }) {
    let o = (f, h) => (i === "en" ? f : h),
      s = e.find((f) => f.id === n),
      l = e.filter((f) => !!Gd(f, null)),
      c = v3(t.usableFix),
      u = t.phase === "live" && !t.fresh,
      d = u
        ? o(
            "Location needs an update",
            "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15",
          )
        : TW[t.phase][i === "en" ? 0 : 1];
    return (0, St.jsxs)("section", {
      className: "navigation-panel",
      "aria-label": o(
        "Live location and directions",
        "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E41\u0E25\u0E30\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07",
      ),
      children: [
        (0, St.jsxs)("div", {
          className: "navigation-heading",
          children: [
            (0, St.jsx)("span", { className: "navigation-icon", children: (0, St.jsx)(na, { size: 20 }) }),
            (0, St.jsxs)("div", {
              children: [
                (0, St.jsx)("h2", {
                  children: o(
                    "Find your way",
                    "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13",
                  ),
                }),
                (0, St.jsx)("p", {
                  children: o(
                    "Live location \xB7 walking directions",
                    "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19 \xB7 \u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19",
                  ),
                }),
              ],
            }),
          ],
        }),
        (0, St.jsxs)("div", {
          className: "location-status",
          "data-state": t.fresh ? "live" : u ? "stale" : t.phase,
          role: "status",
          children: [(0, St.jsx)("span", { className: "location-indicator" }), d],
        }),
        t.fix &&
          (0, St.jsxs)("div", {
            className: "location-reading",
            children: [
              (0, St.jsxs)("span", { children: [t.fix.lat.toFixed(5), ", ", t.fix.lng.toFixed(5)] }),
              (0, St.jsxs)("small", {
                children: [
                  o("Accuracy", "\u0E04\u0E27\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33"),
                  " \xB1",
                  Math.round(t.fix.accuracy),
                  " m \xB7 ",
                  o("Updated", "\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15"),
                  " ",
                  new Date(t.fix.timestamp).toLocaleTimeString(i === "th" ? "th-TH" : "en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }),
                ],
              }),
              t.fix.accuracy > 100 &&
                (0, St.jsx)("small", {
                  className: "destination-warning",
                  children: o(
                    "Approximate position. Google Maps will find a better starting point.",
                    "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E42\u0E14\u0E22\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 Google Maps \u0E08\u0E30\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E08\u0E38\u0E14\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E17\u0E35\u0E48\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33\u0E02\u0E36\u0E49\u0E19",
                  ),
                }),
            ],
          }),
        (0, St.jsxs)("div", {
          className: "location-actions",
          children: [
            (0, St.jsxs)(_t, {
              variant: "outline",
              onClick: t.start,
              disabled: t.phase === "locating" || t.fresh,
              children: [
                t.phase === "locating"
                  ? (0, St.jsx)(Wi, { className: "location-spinner" })
                  : (0, St.jsx)(na, {}),
                t.fresh
                  ? o("Tracking", "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21")
                  : o(
                      "My Location",
                      "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19",
                    ),
              ],
            }),
            t.usableFix &&
              _3(t.usableFix) &&
              r &&
              (0, St.jsxs)(_t, {
                variant: "outline",
                onClick: r,
                children: [
                  (0, St.jsx)(na, {}),
                  o(
                    "Center on map",
                    "\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E21\u0E32\u0E17\u0E35\u0E48\u0E09\u0E31\u0E19",
                  ),
                ],
              }),
            t.enabled &&
              (0, St.jsxs)(_t, {
                variant: "ghost",
                onClick: t.stop,
                children: [(0, St.jsx)(ng, { size: 14 }), o("Stop", "\u0E2B\u0E22\u0E38\u0E14")],
              }),
          ],
        }),
        t.usableFix &&
          !_3(t.usableFix) &&
          (0, St.jsx)("p", {
            className: "navigation-note",
            children: o(
              "You are outside this map\u2019s coverage. You can still open walking directions and view your position in Google Maps.",
              "\u0E04\u0E38\u0E13\u0E2D\u0E22\u0E39\u0E48\u0E19\u0E2D\u0E01\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48 \u0E22\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E41\u0E25\u0E30\u0E14\u0E39\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E43\u0E19 Google Maps \u0E44\u0E14\u0E49",
            ),
          }),
        c &&
          (0, St.jsxs)("a", {
            className: "my-position-link",
            href: c,
            target: "_blank",
            rel: "noopener noreferrer",
            onClick: (f) => {
              let h = v3(t.usableFix);
              h ? (f.currentTarget.href = h) : (f.preventDefault(), t.start());
            },
            children: [
              o(
                "View my position in Google Maps",
                "\u0E14\u0E39\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19\u0E43\u0E19 Google Maps",
              ),
              (0, St.jsx)(yl, { size: 13 }),
            ],
          }),
        (0, St.jsxs)("label", {
          className: "destination-label",
          htmlFor: "walking-destination",
          children: [
            (0, St.jsx)(Yi, { size: 15 }),
            o(
              "Where would you like to go?",
              "\u0E04\u0E38\u0E13\u0E2D\u0E22\u0E32\u0E01\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E44\u0E2B\u0E19?",
            ),
          ],
        }),
        (0, St.jsxs)(qh, {
          value: s && Gd(s, null) ? s.id : "",
          onValueChange: a,
          children: [
            (0, St.jsx)(Yh, {
              id: "walking-destination",
              "aria-label": o(
                "Walking destination",
                "\u0E08\u0E38\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E14\u0E34\u0E19",
              ),
              className: "destination-select",
              children: (0, St.jsx)(Wh, {
                placeholder: o(
                  "Choose a landmark",
                  "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48",
                ),
              }),
            }),
            (0, St.jsx)(Zh, {
              children: l.map((f) =>
                (0, St.jsx)(Kh, { value: f.id, children: i === "en" ? f.nameEn : f.nameTh }, f.id),
              ),
            }),
          ],
        }),
        s
          ? (0, St.jsx)(CW, { place: s, fix: t.usableFix, lang: i })
          : (0, St.jsx)("p", {
              className: "navigation-note",
              children: o(
                "Choose a landmark to open walking directions, even without location access here.",
                "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19 \u0E41\u0E21\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49",
              ),
            }),
        (0, St.jsxs)("details", {
          className: "location-privacy",
          children: [
            (0, St.jsx)("summary", {
              children: o(
                "How your location is used",
                "\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07",
              ),
            }),
            (0, St.jsx)("p", {
              children: o(
                "Updates while this page is visible. Nothing is saved or shared with other visitors. Google receives your position when you open a location link or use the connected street map. Stop clears your position. Background and screen-locked tracking are not supported.",
                "\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E14\u0E39\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E0A\u0E23\u0E4C\u0E01\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E40\u0E22\u0E35\u0E48\u0E22\u0E21\u0E0A\u0E21\u0E04\u0E19\u0E2D\u0E37\u0E48\u0E19 Google \u0E08\u0E30\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E04\u0E38\u0E13\u0E40\u0E1B\u0E34\u0E14\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E0A\u0E49\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E16\u0E19\u0E19\u0E17\u0E35\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D \u0E01\u0E14\u0E2B\u0E22\u0E38\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E25\u0E49\u0E32\u0E07\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E25\u0E31\u0E1A\u0E41\u0E2D\u0E1B\u0E2B\u0E23\u0E37\u0E2D\u0E25\u0E47\u0E2D\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D",
              ),
            }),
          ],
        }),
      ],
    });
  }
  R();
  var mi = we(mt(), 1);
  R();
  var zg = null;
  function WN(t, e) {
    let n = window;
    return n.google?.maps?.marker
      ? Promise.resolve(n.google.maps)
      : zg ||
          ((zg = new Promise((a, i) => {
            let r = document.createElement("script"),
              o = () => {
                (clearTimeout(s),
                  r.remove(),
                  (zg = null),
                  delete n.talatNoiGoogleReady,
                  i(new Error("Google Maps could not be loaded.")));
              },
              s = setTimeout(o, 2e4);
            ((n.talatNoiGoogleReady = () => {
              (clearTimeout(s),
                delete n.talatNoiGoogleReady,
                n.google?.maps?.marker ? a(n.google.maps) : o());
            }),
              (n.gm_authFailure = () => {
                (window.dispatchEvent(new Event("talat-noi-google-error")), o());
              }));
            let l = new URL("https://maps.googleapis.com/maps/api/js");
            for (let [c, u] of Object.entries({
              key: t,
              loading: "async",
              callback: "talatNoiGoogleReady",
              v: "weekly",
              libraries: "marker",
              language: e,
              region: "TH",
            }))
              l.searchParams.set(c, u);
            ((r.src = l.toString()), (r.async = !0), (r.onerror = o), document.head.appendChild(r));
          })),
          zg);
  }
  ru();
  var Zo = we(pt(), 1);
  function k3({ places: t, fix: e, selectedId: n, onSelect: a, lang: i }) {
    let r = (0, mi.useRef)(null),
      o = (0, mi.useRef)(null),
      s = (0, mi.useRef)(null),
      l = (0, mi.useRef)(null),
      c = (0, mi.useRef)(null),
      u = (0, mi.useRef)([]),
      d = (0, mi.useRef)(a);
    d.current = a;
    let [f, h] = (0, mi.useState)("loading"),
      [m, v] = (0, mi.useState)(!1),
      g = (p, y) => (i === "en" ? p : y);
    return (
      (0, mi.useEffect)(() => {
        let p = !1,
          y,
          w = () => {
            p || h("error");
          };
        return (
          window.addEventListener("talat-noi-google-error", w),
          (async () => {
            try {
              let _ = await fetch("/api/map-config", { cache: "no-store" });
              if (!_.ok) throw new Error();
              let T = await _.json();
              if (p) return;
              if (!T.enabled) {
                h("missing");
                return;
              }
              let b = await WN(T.apiKey, i);
              if (p || !r.current) return;
              ((s.current = b),
                (o.current = new b.Map(r.current, {
                  center: { lat: 13.734, lng: 100.513 },
                  zoom: 17,
                  mapId: T.mapId,
                  mapTypeControl: !1,
                  streetViewControl: !1,
                  fullscreenControl: !0,
                  gestureHandling: "greedy",
                  zoomControl: !0,
                })),
                (y = o.current.addListener("dragstart", () => v(!1))),
                h("ready"));
            } catch {
              p || h("error");
            }
          })(),
          () => {
            ((p = !0),
              y?.remove(),
              window.removeEventListener("talat-noi-google-error", w),
              u.current.forEach((_) => {
                _.map = null;
              }),
              l.current && (l.current.map = null),
              c.current?.setMap(null),
              (o.current = null),
              (s.current = null));
          }
        );
      }, []),
      (0, mi.useEffect)(() => {
        if (!(f !== "ready" || !s.current || !o.current))
          return (
            u.current.forEach((p) => {
              p.map = null;
            }),
            (u.current = t.filter(qo).map((p) => {
              let y = new s.current.marker.AdvancedMarkerElement({
                  map: o.current,
                  position: { lat: p.lat, lng: p.lng },
                  title: i === "en" ? p.nameEn : p.nameTh,
                  gmpClickable: !0,
                }),
                w = document.createElement("div");
              return (
                (w.className = `google-place-dot ${p.id === n ? "chosen" : ""}`),
                (w.textContent = "\u25CF"),
                y.appendChild(w),
                y.addEventListener("gmp-click", () => d.current(p.id)),
                y
              );
            })),
            () =>
              u.current.forEach((p) => {
                p.map = null;
              })
          );
      }, [t, n, i, f]),
      (0, mi.useEffect)(() => {
        if (f !== "ready" || !s.current || !o.current) return;
        if (!e) {
          (l.current && (l.current.map = null), c.current?.setMap(null));
          return;
        }
        let p = { lat: e.lat, lng: e.lng };
        if (!l.current) {
          l.current = new s.current.marker.AdvancedMarkerElement({
            map: o.current,
            position: p,
            title: g(
              "Your location",
              "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13",
            ),
            zIndex: 999,
          });
          let y = document.createElement("div");
          ((y.className = "google-user-dot"), l.current.appendChild(y));
        }
        ((l.current.position = p),
          (l.current.map = o.current),
          c.current ||
            (c.current = new s.current.Circle({
              map: o.current,
              center: p,
              radius: e.accuracy,
              fillColor: "#237ae7",
              fillOpacity: 0.12,
              strokeColor: "#237ae7",
              strokeOpacity: 0.3,
              strokeWeight: 1,
              clickable: !1,
            })),
          c.current.setMap(o.current),
          c.current.setCenter(p),
          c.current.setRadius(e.accuracy),
          m && o.current.panTo(p));
      }, [e, m, f, i]),
      (0, mi.useEffect)(() => {
        if (f !== "ready" || !n) return;
        let p = t.find((y) => y.id === n);
        p && qo(p) && (v(!1), o.current?.panTo({ lat: p.lat, lng: p.lng }));
      }, [n, f]),
      (0, Zo.jsxs)("div", {
        className: "google-map-wrap",
        children: [
          (0, Zo.jsx)("div", {
            ref: r,
            className: "google-map-canvas",
            "aria-label": g(
              "Google street map of Talat Noi",
              "\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E16\u0E19\u0E19 Google \u0E02\u0E2D\u0E07\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22",
            ),
          }),
          f !== "ready" &&
            (0, Zo.jsxs)("div", {
              className: "google-map-message",
              children: [
                (0, Zo.jsx)(Yi, { size: 29 }),
                (0, Zo.jsx)("h3", {
                  children:
                    f === "loading"
                      ? g(
                          "Opening the street map\u2026",
                          "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E16\u0E19\u0E19\u2026",
                        )
                      : f === "missing"
                        ? g(
                            "Street map connection pending",
                            "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E16\u0E19\u0E19",
                          )
                        : g(
                            "Street map unavailable",
                            "\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E16\u0E19\u0E19",
                          ),
                }),
                (0, Zo.jsx)("p", {
                  children:
                    f === "missing"
                      ? g(
                          "The map owner needs to connect Google Maps. You can already use live location and open walking directions from the Find your way panel.",
                          "\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D Google Maps \u0E01\u0E48\u0E2D\u0E19 \u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E43\u0E0A\u0E49\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E41\u0E25\u0E30\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E44\u0E14\u0E49\u0E08\u0E32\u0E01\u0E2A\u0E48\u0E27\u0E19\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07",
                        )
                      : f === "error"
                        ? g(
                            "You can still open walking directions in Google Maps. Try the street map again later.",
                            "\u0E04\u0E38\u0E13\u0E22\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E43\u0E19 Google Maps \u0E44\u0E14\u0E49 \u0E42\u0E1B\u0E23\u0E14\u0E25\u0E2D\u0E07\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E16\u0E19\u0E19\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E20\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07",
                          )
                        : g(
                            "Loading Google\u2019s map.",
                            "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E07 Google",
                          ),
                }),
              ],
            }),
          f === "ready" &&
            (0, Zo.jsxs)(_t, {
              className: "google-follow",
              variant: "outline",
              disabled: !e,
              "aria-pressed": m,
              onClick: () => {
                e && (v(!m), o.current?.panTo(e), o.current?.setZoom(18));
              },
              children: [
                (0, Zo.jsx)(na, {}),
                m
                  ? g(
                      "Following you",
                      "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E04\u0E38\u0E13",
                    )
                  : g(
                      "Follow my location",
                      "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19",
                    ),
              ],
            }),
          (0, Zo.jsx)("div", {
            className: "google-map-footer",
            children: g(
              "Landmark coordinates need verification. Walking navigation opens in Google Maps.",
              "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A \u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E19\u0E33\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E43\u0E19 Google Maps",
            ),
          }),
        ],
      })
    );
  }
  R();
  Dg();
  var Pr = we(pt(), 1);
  function N3({ value: t, onChange: e }) {
    let n = iu(t),
      a = !!t.trim() && !n;
    return (0, Pr.jsxs)("div", {
      className: "maps-link-field",
      children: [
        (0, Pr.jsxs)("div", {
          className: "field",
          children: [
            (0, Pr.jsx)("label", {
              htmlFor: "place-maps-url",
              children: (0, Pr.jsx)("strong", { children: "Google Maps link \xB7 optional" }),
            }),
            (0, Pr.jsx)("input", {
              id: "place-maps-url",
              type: "url",
              inputMode: "url",
              autoCapitalize: "none",
              autoComplete: "off",
              spellCheck: !1,
              maxLength: 4096,
              placeholder: "https://maps.app.goo.gl/\u2026",
              value: t,
              onChange: (i) => e(i.target.value),
              "aria-invalid": a,
              "aria-describedby": a ? "maps-link-help maps-link-error" : "maps-link-help",
            }),
            (0, Pr.jsx)("small", {
              id: "maps-link-help",
              children:
                "In Google Maps, choose Share \u2192 Copy link. When filled in, visitors use this link instead of coordinate-based directions.",
            }),
          ],
        }),
        a &&
          (0, Pr.jsx)("p", {
            className: "maps-link-error",
            id: "maps-link-error",
            role: "alert",
            children: j1,
          }),
        n &&
          (0, Pr.jsxs)("div", {
            className: "maps-link-preview",
            children: [
              (0, Pr.jsxs)("a", {
                href: n,
                target: "_blank",
                rel: "noopener noreferrer",
                children: ["Preview Google Maps link ", (0, Pr.jsx)(yl, { size: 14 })],
              }),
              (0, Pr.jsx)("p", {
                children:
                  "Visitors open the saved place and choose Directions in Google Maps. Pasting a link leaves your coordinates and illustration marker unchanged.",
              }),
            ],
          }),
      ],
    });
  }
  R();
  var Ko = we(mt(), 1);
  R();
  R();
  async function YN(t) {
    if (!t.size) throw new Error("This photo is empty. Choose another photo.");
    if (t.size > 31457280) throw new Error("Choose a photo under 30 MB.");
    if ((t.type && !t.type.startsWith("image/")) || /svg/i.test(t.type) || /\.svgz?$/i.test(t.name))
      throw new Error("Choose a photo from your photo library, such as a JPG, PNG or WebP image.");
    let e = URL.createObjectURL(t);
    try {
      let n = new Image();
      if (
        (await new Promise((s, l) => {
          ((n.onload = () => s()),
            (n.onerror = () =>
              l(new Error("This photo format could not be opened. Export it as JPG or PNG and try again."))),
            (n.src = e));
        }),
        !n.naturalWidth || !n.naturalHeight)
      )
        throw new Error("This photo could not be opened. Choose another photo.");
      let a = Math.min(1, 2048 / Math.max(n.naturalWidth, n.naturalHeight)),
        i = document.createElement("canvas");
      ((i.width = Math.max(1, Math.round(n.naturalWidth * a))),
        (i.height = Math.max(1, Math.round(n.naturalHeight * a))));
      let r = i.getContext("2d");
      if (!r) throw new Error("Your browser could not prepare the photo. Please try again.");
      ((r.fillStyle = "#ffffff"),
        r.fillRect(0, 0, i.width, i.height),
        r.drawImage(n, 0, 0, i.width, i.height));
      let o = await new Promise((s, l) =>
        i.toBlob(
          (c) => (c ? s(c) : l(new Error("The photo could not be prepared. Try a smaller photo."))),
          "image/jpeg",
          0.86,
        ),
      );
      if (((i.width = i.height = 1), o.size > 5242880))
        throw new Error("This photo is still too large. Choose a smaller photo.");
      return o;
    } finally {
      URL.revokeObjectURL(e);
    }
  }
  // Talat Noi editor: photos are resized here (YN) and stored by the active map store
  // (src/app/store.js): the artifact's durable asset store, or this browser in a local preview.
  var activePhotoUploader = null;
  async function B3(t, { signal: e, onStage: n } = {}) {
    n?.("preparing");
    let a = await YN(t);
    (e?.throwIfAborted(), n?.("uploading"));
    let i = activePhotoUploader;
    if (!i) throw new Error("Photo uploads are not available here. Open the editor from the published map.");
    let r = await i(a, { signal: e });
    if (!r) throw new Error("The photo could not be uploaded. Please try again.");
    return r;
  }
  // Fieldwork photos already ship with the map (assets/fieldwork/…), so they are linked
  // directly instead of being uploaded again.
  async function U3(t, e, n) {
    return (n?.onStage?.("preparing"), t);
  }
  var aa = we(pt(), 1);
  function z3({ hasPhoto: t, disabled: e, children: n, onPhotoChange: a, onUploadingChange: i }) {
    let r = (0, Ko.useRef)(null),
      o = (0, Ko.useRef)(null),
      [s, l] = (0, Ko.useState)("idle"),
      [c, u] = (0, Ko.useState)(""),
      [d, f] = (0, Ko.useState)(null),
      h = (0, Ko.useId)(),
      m = s === "preparing" || s === "uploading";
    (0, Ko.useEffect)(
      () => () => {
        (o.current?.abort(), i(!1));
      },
      [i],
    );
    async function v(g) {
      let p = new AbortController();
      ((o.current = p), u(""), f(null), l("preparing"), i(!0));
      try {
        let y = await B3(g, { signal: p.signal, onStage: l });
        if (p.signal.aborted) return;
        (a(y), l("done"));
      } catch (y) {
        if (p.signal.aborted) return;
        (u(y instanceof Error ? y.message : "The photo could not be uploaded. Please try again."),
          f(g),
          l("idle"));
      } finally {
        p.signal.aborted || i(!1);
      }
    }
    return (0, aa.jsxs)("div", {
      className: "photo-uploader",
      "aria-busy": m,
      children: [
        n,
        (0, aa.jsx)("input", {
          ref: r,
          className: "sr-only",
          type: "file",
          accept: "image/*",
          tabIndex: -1,
          "aria-label": "Choose a place photo",
          disabled: e || m,
          onChange: (g) => {
            let p = g.currentTarget.files?.[0];
            ((g.currentTarget.value = ""), p && v(p));
          },
        }),
        (0, aa.jsxs)("div", {
          className: "photo-upload-actions",
          children: [
            (0, aa.jsxs)(_t, {
              type: "button",
              onClick: () => r.current?.click(),
              disabled: e || m,
              "aria-describedby": h,
              children: [
                m ? (0, aa.jsx)(Wi, { className: "photo-upload-spinner" }) : (0, aa.jsx)(sd, {}),
                s === "preparing"
                  ? "Preparing photo\u2026"
                  : s === "uploading"
                    ? "Uploading photo\u2026"
                    : t
                      ? "Replace photo"
                      : "Upload photo",
              ],
            }),
            t &&
              (0, aa.jsxs)(_t, {
                type: "button",
                variant: "outline",
                disabled: e || m,
                onClick: () => {
                  (a(""), l("idle"), u(""));
                },
                children: [(0, aa.jsx)(ag, {}), " Remove photo"],
              }),
          ],
        }),
        m &&
          (0, aa.jsx)("div", {
            className: "photo-upload-progress",
            role: "progressbar",
            "aria-label": "Upload progress",
            "aria-valuemin": 0,
            "aria-valuemax": 2,
            "aria-valuenow": s === "preparing" ? 1 : 2,
            children: (0, aa.jsx)("span", { "data-stage": s }),
          }),
        (0, aa.jsx)("p", {
          id: h,
          className: "photo-upload-hint",
          children: "Choose a photo from your phone or computer. Large photos are resized automatically.",
        }),
        (0, aa.jsx)("p", {
          className: "photo-upload-status",
          role: "status",
          "aria-live": "polite",
          children: m
            ? "Please keep this place open until the upload finishes."
            : s === "done"
              ? (0, aa.jsxs)(aa.Fragment, {
                  children: [
                    (0, aa.jsx)(io, {}),
                    " Photo uploaded. Save draft, then Publish to show it on the visitor map.",
                  ],
                })
              : null,
        }),
        c &&
          (0, aa.jsxs)("div", {
            className: "photo-upload-error",
            role: "alert",
            children: [
              (0, aa.jsx)("p", { children: c }),
              d &&
                (0, aa.jsxs)(_t, {
                  type: "button",
                  variant: "outline",
                  disabled: e,
                  onClick: () => void v(d),
                  children: [(0, aa.jsx)(Sl, {}), " Try again"],
                }),
            ],
          }),
      ],
    });
  }
  R();
  var Ln = we(mt(), 1);
  lu();
  R();
  Yd();
  lu();
  function ZN(t) {
    let e = t.boundary.map(([h, m]) => Kn({ x: h, z: m })),
      n = Math.min(...e.map((h) => h.x)),
      a = Math.max(...e.map((h) => h.x)),
      i = Math.min(...e.map((h) => h.z)),
      r = Math.max(...e.map((h) => h.z)),
      o = { x: (n + a) / 2, y: 0.7, z: (i + r) / 2 },
      s = Math.hypot(Wd.y, Wd.z),
      l = Wd.y / s,
      c = Wd.z / s,
      u = Math.max(5, ...t.sceneBuildings.map((h) => Math.min(8.6, Math.max(0.26, h.height * 0.084)) + 0.7)),
      d = e.flatMap((h) => [-0.1, u].map((m) => ({ x: h.x, y: m, z: h.z })));
    function f(h) {
      let m = Math.tan((19 * Math.PI) / 180),
        v = m * Math.max(0.2, h),
        g = 0.88;
      return Math.min(
        610,
        Math.max(
          ...d.map((p) => {
            let y = p.x - o.x,
              w = p.y - o.y,
              _ = p.z - o.z,
              T = l * w + c * _,
              b = c * w - l * _;
            return T + Math.max(Math.abs(y) / (v * g), Math.abs(b) / (m * g));
          }),
        ),
      );
    }
    return { target: o, distance: f, corners: d, extent: { minX: n, maxX: a, minZ: i, maxZ: r } };
  }
  lS();
  Yd();
  R();
  var AW = [
    [0, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0.71, -0.71],
    [-0.71, -0.71],
    [0.71, 0.71],
    [-0.71, 0.71],
  ];
  function dp(t, { minDistance: e = 48, blocked: n = [], bounds: a } = {}) {
    let i = [],
      r = new Map(),
      o = (l, c) => !a || (l >= a.minX && l <= a.maxX && c >= a.minY && c <= a.maxY),
      s = (l, c) =>
        o(l, c) &&
        !i.some((u) => Math.hypot(u.x - l, u.y - c) < e) &&
        !n.some((u) => l > u.x - 22 && l < u.x + u.w + 22 && c > u.y && c < u.y + u.h + 44);
    for (let l of t) {
      let c = { dx: 0, dy: 0 };
      if (!s(l.x, l.y))
        e: for (let u of [1, 1.5, 2, 3, 4])
          for (let [d, f] of AW) {
            let h = d * e * u,
              m = f * e * u;
            if (s(l.x + h, l.y + m)) {
              c = { dx: h, dy: m };
              break e;
            }
          }
      (i.push({ x: l.x + c.dx, y: l.y + c.dy }), r.set(l.id, c));
    }
    return r;
  }
  function fp({ dx: t, dy: e }) {
    return { length: Math.hypot(t, e), angle: (Math.atan2(-e, -t) * 180) / Math.PI };
  }
  R();
  R();
  var hp = {
    Heritage: {
      th: "\u0E21\u0E23\u0E14\u0E01\u0E0A\u0E38\u0E21\u0E0A\u0E19",
      color: "#916c3d",
      tint: "#f5ecdd",
      text: "#6b4e25",
    },
    Belief: {
      th: "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E0A\u0E37\u0E48\u0E2D",
      color: "#71618c",
      tint: "#ede9f4",
      text: "#54456e",
    },
    "Art & craft": {
      th: "\u0E28\u0E34\u0E25\u0E1B\u0E30\u0E41\u0E25\u0E30\u0E07\u0E32\u0E19\u0E0A\u0E48\u0E32\u0E07",
      color: "#b65a42",
      tint: "#f7e8e1",
      text: "#8c3f2c",
    },
    "Food & drink": {
      th: "\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E41\u0E25\u0E30\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E14\u0E37\u0E48\u0E21",
      color: "#287b65",
      tint: "#e3f1ea",
      text: "#1d5e4d",
    },
    Community: { th: "\u0E0A\u0E38\u0E21\u0E0A\u0E19", color: "#477996", tint: "#e5eff7", text: "#325a72" },
  };
  function pp(t, e) {
    return e === "th" ? hp[t].th : t;
  }
  function KN(t, e = 20) {
    let n = t.trim();
    if (n.length <= e) return n;
    let a = n.slice(0, e - 1),
      i = a.lastIndexOf(" ");
    return `${(i > e / 2 ? a.slice(0, i) : a).trimEnd()}\u2026`;
  }
  R();
  var H3 = "Photo by Jump";
  var Ns = (t) => t.verificationNotes.startsWith("Temporary position"),
    ks = (t) => `assets/fieldwork/${t}`,
    cS = [
      {
        id: "P01",
        filename: "20261104_155403.jpg",
        asset: ks("20261104_155403.jpg"),
        title: "Robot sculpture display",
        category: "Art & craft",
        placementAction: "Assign workshop location",
        alt: "Large metal robot sculptures along the pavement outside an orange workshop facade hung with red lanterns.",
        note: "The venue name and exact position still need confirmation.",
      },
      {
        id: "P02",
        filename: "20261104_153940.jpg",
        asset: ks("20261104_153940.jpg"),
        title: "Local street-food stall",
        category: "Food & drink",
        placementAction: "Assign stall location",
        alt: "Glass-sided street-food cart beside folding tables and a green tiled wall in a narrow lane.",
        note: "Keep this working title until the business name and location are confirmed.",
      },
      {
        id: "P03",
        filename: "20261104_154919.jpg",
        asset: ks("20261104_154919.jpg"),
        title: "Local snack shop",
        category: "Food & drink",
        placementAction: "Assign shop location",
        alt: "Open green folding doors of a shophouse, with trays of packaged snacks on tables outside.",
        note: "The old facade alone does not establish a heritage designation or a verified shop name.",
      },
      {
        id: "P04",
        filename: "20261104_154539.jpg",
        asset: ks("20261104_154539.jpg"),
        title: "22 Barber & Hair Studio",
        category: "Community",
        placementAction: "Confirm business record",
        alt: "22 Barber & Hair Studio sign and glass door beside a table of souvenirs and jewellery displays.",
        note: "The souvenir displays may be a separate Art & craft place. Verify the relationship before splitting records.",
      },
      {
        id: "P05",
        filename: "20261104_152613.jpg",
        asset: ks("20261104_152613.jpg"),
        title: "Som tam, larb & grilled-chicken stall",
        category: "Food & drink",
        placementAction: "Assign stall location",
        alt: "Food stall with grilled chicken on the counter, a green frontage and stacked plastic stools.",
        note: "The working title describes the visible food. The business name is not verified.",
      },
      {
        id: "P06",
        filename: "20261104_153419.jpg",
        asset: ks("20261104_153419.jpg"),
        title: "Holy Rosary Church entrance",
        category: "Belief",
        placementAction: "Reuse existing holy-rosary",
        alt: "Entrance gate of Holy Rosary Church, with its name in Thai, Chinese and English above the driveway.",
        note: "Attach to the existing Holy Rosary Church place. Do not create another church record.",
        matchPlaceId: "holy-rosary",
      },
      {
        id: "P07",
        filename: "20261104_153358.jpg",
        asset: ks("20261104_153358.jpg"),
        title: "Yellow robot sculpture",
        category: "Art & craft",
        placementAction: "Confirm sculpture position",
        alt: "Yellow robot sculpture on a low plinth in a paved square, with the Holy Rosary Church entrance behind it.",
        note: "The church is only in the background. Treat the sculpture as its own subject, and add a pin once its position is confirmed.",
      },
      {
        id: "P08",
        filename: "20261104_152829.jpg",
        asset: ks("20261104_152829.jpg"),
        title: "Outdoor photography display",
        category: "Art & craft",
        placementAction: "Assign display location",
        alt: "Printed photographs hung on an old stone wall as an outdoor exhibition.",
        note: "Pin the physical exhibition wall. Haroon Mosque appears inside one displayed photograph, which does not make this wall the mosque location.",
      },
      {
        id: "P09",
        filename: "20261104_152547.jpg",
        asset: ks("20261104_152547.jpg"),
        title: "Mother Roaster entrance",
        category: "Food & drink",
        placementAction: "Match cafe record or assign",
        alt: "Open wooden doors with Mother Roaster and Elephant Parade signs, set in a bright yellow mural wall.",
        note: "Use Food & drink for the cafe. Verify any separate art-retail entry and its relationship.",
      },
      {
        id: "P10",
        filename: "20261104_150559.jpg",
        asset: ks("20261104_150559.jpg"),
        title: "Talat Noi community-life mural",
        category: "Art & craft",
        placementAction: "Assign mural wall location",
        alt: "Street mural of a boy eating noodles in a rickshaw, a rickshaw puller and a blacksmith, behind parked motorbikes.",
        note: "Artist, formal artwork title, date and exact location are not verified by this image.",
      },
    ],
    JN = (t) => cS.find((e) => e.asset === t);
  function uS(t) {
    return cS.map((e) => ({ photo: e, place: t.find((n) => n.photoSource === e.asset) ?? null }));
  }
  function G3(t, e) {
    return { photoUrl: e, photoAlt: t.alt, photoCredit: H3, photoSource: t.asset, category: t.category };
  }
  function $N(t, e, n) {
    return {
      ...Ng(`fieldwork-${t.id.toLowerCase()}`),
      nameEn: t.title,
      nameTh: t.title,
      ...G3(t, e),
      ...n,
      verificationNotes: "Working title. The name, details and exact position need a community check.",
    };
  }
  var nr = we(pt(), 1),
    RW = { Heritage: q0, Belief: V0, "Art & craft": J0, "Food & drink": qc, Community: ig };
  function dS({ category: t, size: e = 16 }) {
    let n = RW[t];
    return (0, nr.jsx)(n, { size: e, "aria-hidden": "true" });
  }
  function Ul({ category: t, lang: e }) {
    let n = hp[t];
    return (0, nr.jsxs)("span", {
      className: "category-chip",
      style: { "--chip-tint": n.tint, "--chip-text": n.text },
      children: [(0, nr.jsx)(dS, { category: t, size: 14 }), pp(t, e)],
    });
  }
  function mp(t, e) {
    let n = Ns(t);
    return e === "en"
      ? `Open ${t.nameEn}, ${t.category}${n ? ", temporary position" : ""}`
      : `\u0E40\u0E1B\u0E34\u0E14 ${t.nameTh}, ${pp(t.category, "th")}${n ? ", \u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27" : ""}`;
  }
  function Zd({ place: t, lang: e }) {
    let n = e === "en" ? t.nameEn : t.nameTh;
    return (0, nr.jsxs)("span", {
      className: `place-pin ${Ns(t) ? "pin-temporary" : ""}`,
      style: { "--pin": hp[t.category].color },
      children: [
        (0, nr.jsxs)("span", {
          className: "pin-marker",
          children: [
            (0, nr.jsx)("span", {
              className: "pin-head",
              children: (0, nr.jsx)(dS, { category: t.category, size: 19 }),
            }),
            t.photoUrl &&
              (0, nr.jsxs)("span", {
                className: "pin-preview",
                children: [
                  (0, nr.jsx)("img", { src: t.photoUrl, alt: "", loading: "lazy", draggable: !1 }),
                  (0, nr.jsx)("span", { children: pp(t.category, e) }),
                ],
              }),
          ],
        }),
        (0, nr.jsx)("span", { className: "pin-label", children: KN(n) }),
        (0, nr.jsx)("span", { className: "pin-leader", "aria-hidden": "true" }),
      ],
    });
  }
  var nt = we(pt(), 1),
    Vee = 0.5,
    Xee = 1.5;
  function fE(t) {
    let {
        places: e,
        structures: n,
        structureEditing: a,
        selectedStructureId: i,
        visibleIds: r,
        selectedId: o,
        lang: s,
        placing: l,
        onFallback: c,
        location: u,
      } = t,
      d = (0, Ln.useRef)(null),
      f = (0, Ln.useRef)(null),
      h = (0, Ln.useRef)(new Map()),
      m = (0, Ln.useRef)(new Map()),
      [v, g] = (0, Ln.useState)({ infill: !0, boundary: !0, pins: !0, labels: !0 }),
      [p, y] = (0, Ln.useState)(!1),
      [w, _] = (0, Ln.useState)(0),
      T = (0, Ln.useRef)(new Map()),
      b = (0, Ln.useRef)(null),
      S = (0, Ln.useRef)(!1),
      [x, M] = (0, Ln.useState)([]),
      [C, I] = (0, Ln.useState)({ outside: 0, blocked: 0 }),
      O = (0, Ln.useRef)(v);
    O.current = v;
    let k = (0, Ln.useRef)(t);
    k.current = t;
    let [A, N] = (0, Ln.useState)("loading"),
      [G, B] = (0, Ln.useState)(!1),
      [q, W] = (0, Ln.useState)(!1),
      [j, re] = (0, Ln.useState)(!1),
      [oe, le] = (0, Ln.useState)(0),
      J = (D, Z) => (s === "en" ? D : Z),
      // Talat Noi editor: structures rebuild the whole scene; places only rebuild the pins.
      he = (0, Ln.useMemo)(
        () => JSON.stringify(n.map((D) => [D.id, D.kind, D.x, D.y, D.size, D.rotation, D.hidden, D.geoPosition])),
        [n],
      ),
      pinKey = (0, Ln.useMemo)(
        () => JSON.stringify(e.map((D) => [D.id, D.x, D.y, D.size, D.rotation, D.lat, D.lng])),
        [e],
      ),
      ghostRef = (0, Ln.useRef)(null),
      [chooser, setChooser] = (0, Ln.useState)(null),
      placementKey = t.placement ? `${t.placement.kind}:${t.placement.id ?? ""}` : "";
    ((0, Ln.useEffect)(() => {
      let D = d.current;
      if (!D) return;
      let Z = D,
        $ = !0,
        ne = () => {};
      return (
        N("loading"),
        W(!1),
        (async () => {
          try {
            // Talat Noi editor: the active pin placement session, the pin being dragged,
            // the camera saved before the top-down placement view, and the 3D markers.
            var ss = null,
              pinDrag = null,
              savedView = null,
              placeRing = null,
              originRing = null,
              buildingIndex = null;
            let oa = function () {
                $ &&
                  Zs &&
                  !document.hidden &&
                  Mo &&
                  !zi &&
                  (clearTimeout(Gn), (Gn = 0), (zi = requestAnimationFrame(Ou)));
              },
              To = function () {
                ((us = !0), oa());
              },
              Xr = function () {
                Ae.updateMatrixWorld();
                let Ee = Z.clientWidth,
                  ht = Z.clientHeight,
                  Dt = new Set(k.current.visibleIds),
                  Ge = [
                    { x: 8, y: 8, w: st ? 168 : 230, h: 70 },
                    { x: Ee - (st ? 108 : 200), y: 8, w: st ? 100 : 190, h: 64 },
                  ],
                  Kt = O.current;
                (Je.setInfillStyle(Kt.infill, !1, Kt.boundary),
                  Je.updateLocation(k.current.location?.usableFix ?? null));
                let Nt = [...Je.anchors.entries()].sort(([on, wt], [yn, fn]) =>
                  on === k.current.selectedId
                    ? -1
                    : yn === k.current.selectedId
                      ? 1
                      : wt.distanceToSquared(Ae.position) - fn.distanceToSquared(Ae.position),
                );
                for (let [on, wt] of h.current) Je.anchors.has(on) || (wt.hidden = !0);
                let sa = [];
                for (let [on, wt] of Nt) {
                  let yn = h.current.get(on);
                  if (!yn) continue;
                  Ea.copy(wt).project(Ae);
                  let fn = ((Ea.x + 1) * Ee) / 2,
                    la = ((1 - Ea.y) * ht) / 2,
                    isMoving = !!ss && ss.kind === "move" && ss.id === on,
                    Mi =
                      (Kt.pins || isMoving) &&
                      (Dt.has(on) || isMoving) &&
                      !k.current.structureEditing &&
                      !k.current.placing &&
                      Ea.z > -1 &&
                      Ea.z < 1 &&
                      fn > 22 &&
                      fn < Ee - 22 &&
                      la > 44 &&
                      la < ht - 14;
                  ((yn.hidden = !Mi),
                    yn.classList.toggle("is-moving", isMoving),
                    Mi && sa.push({ id: on, x: fn, y: la, label: yn }));
                }
                let qr = dp(sa, {
                    minDistance: 50,
                    blocked: Ge,
                    bounds: { minX: 26, maxX: Ee - 26, minY: 50, maxY: ht - 8 },
                  }),
                  ds = sa.map(({ id: on, x: wt, y: yn, label: fn }) => {
                    let la = qr.get(on),
                      Mi = fp(la),
                      pa = wt + la.dx,
                      Ti = yn + la.dy;
                    ((fn.style.left = `${pa}px`),
                      (fn.style.top = `${Ti}px`),
                      fn.style.setProperty("--leader", `${Mi.length}px`),
                      fn.style.setProperty("--leader-angle", `${Mi.angle}deg`),
                      fn.classList.toggle("moved", Mi.length > 0),
                      fn.classList.toggle("flip", Ti < 150));
                    let Eo = { x: pa - 22, y: Ti - 44, w: 44, h: 44 };
                    return (Ge.push(Eo), { id: on, px: pa, py: Ti, label: fn, head: Eo });
                  });
                for (let { id: on, px: wt, py: yn, label: fn, head: la } of ds) {
                  let Mi = fn.querySelector(".pin-label"),
                    pa = Mi?.offsetWidth ?? 0,
                    Ti = Mi?.offsetHeight ?? 0,
                    Eo = { x: wt - pa / 2, y: yn + 1, w: pa, h: Ti },
                    Bf = { x: wt - pa / 2, y: yn - 45 - Ti, w: pa, h: Ti },
                    Js = (Dm) =>
                      Dm.y >= 0 &&
                      !Ge.some(
                        (Du) =>
                          Du !== la &&
                          Du.x < Dm.x + pa &&
                          Du.x + Du.w > Dm.x &&
                          Du.y < Dm.y + Ti &&
                          Du.y + Du.h > Dm.y,
                      ),
                    NU = on === k.current.selectedId,
                    Vw = NU || Js(Eo),
                    Xw = !Vw && Js(Bf);
                  (fn.classList.toggle("label-top", Xw),
                    fn.classList.toggle("label-off", !Vw && !Xw),
                    Vw ? Ge.push(Eo) : Xw && Ge.push(Bf));
                }
                for (let [on, wt] of Je.landmarks) {
                  wt.visible = Kt.pins && Dt.has(on) && !k.current.structureEditing;
                  let yn = wt.getObjectByName("selection-ring");
                  yn && (yn.visible = on === k.current.selectedId);
                }
                for (let on of Se.geography.labels) {
                  let wt = T.current.get(on.id);
                  if (!wt) continue;
                  let yn = !1;
                  if (Kt.labels && !k.current.placing) {
                    let fn =
                      on.kind === "neighbourhood"
                        ? 620
                        : on.kind === "river"
                          ? 450
                          : on.kind === "road"
                            ? 115
                            : 90;
                    if (Ae.position.distanceTo(ve.target) < fn)
                      for (let la of on.anchors) {
                        let Mi = Kn({ x: la[0], z: la[1] });
                        Ea.set(Mi.x, on.kind === "neighbourhood" ? 3.8 : 2, Mi.z).project(Ae);
                        let pa = ((Ea.x + 1) * Ee) / 2,
                          Ti = ((1 - Ea.y) * ht) / 2,
                          Eo = wt.offsetWidth || 110,
                          Bf = wt.offsetHeight || 30;
                        if (
                          Ea.z > -1 &&
                          Ea.z < 1 &&
                          pa > Eo / 2 + 8 &&
                          pa < Ee - Eo / 2 - 8 &&
                          Ti > 85 &&
                          Ti < ht - 30 &&
                          !Ge.some(
                            (Js) =>
                              Math.abs(Js.x + Js.w / 2 - pa) < (Js.w + Eo) / 2 + 6 &&
                              Math.abs(Js.y + Js.h / 2 - Ti) < (Js.h + Bf) / 2 + 5,
                          )
                        ) {
                          ((wt.style.left = `${pa}px`),
                            (wt.style.top = `${Ti}px`),
                            Ge.push({ x: pa - Eo / 2, y: Ti - Bf / 2, w: Eo, h: Bf }),
                            (yn = !0));
                          break;
                        }
                      }
                  }
                  wt.hidden = !yn;
                }
                let uc = [...Je.structureAnchors.entries()].sort(([on], [wt]) =>
                  on === k.current.selectedStructureId ? -1 : wt === k.current.selectedStructureId ? 1 : 0,
                );
                for (let [on, wt] of uc) {
                  let yn = m.current.get(on);
                  if (!yn) continue;
                  Ea.copy(wt).project(Ae);
                  let fn = ((Ea.x + 1) * Ee) / 2,
                    la = ((1 - Ea.y) * ht) / 2,
                    Mi =
                      k.current.structureEditing &&
                      !k.current.placing &&
                      Ea.z > -1 &&
                      Ea.z < 1 &&
                      fn > 22 &&
                      fn < Ee - 22 &&
                      la > 44 &&
                      la < ht - 14 &&
                      !Ge.some(
                        (pa) => Math.abs(pa.x + pa.w / 2 - fn) < 46 && Math.abs(pa.y + pa.h - la) < 48,
                      );
                  ((yn.hidden = !Mi),
                    (yn.style.left = `${fn}px`),
                    (yn.style.top = `${la}px`),
                    Mi && Ge.push({ x: fn - 22, y: la - 44, w: 44, h: 44 }));
                }
                let dn = k.current.structureEditing
                  ? Je.scenery.get(k.current.selectedStructureId || "")
                  : void 0;
                dn !== On &&
                  (nn && (lt.remove(nn), nn.geometry.dispose(), nn.material.dispose(), (nn = null)),
                  (On = dn),
                  dn &&
                    ((nn = new te.BoxHelper(dn, 5289149)),
                    (nn.material.depthTest = !1),
                    (nn.renderOrder = 50),
                    lt.add(nn)));
                // Talat Noi editor: the preview pin of a new place follows its ground point.
                let gh = ghostRef.current;
                if (gh) {
                  let showGhost =
                    !!ss && !!ss.pending && (ss.kind === "add" || !Je.anchors.has(ss.id ?? ""));
                  if (showGhost) {
                    Ea.set(ss.pending.x, Je.pinHeight(ss.pending) + 0.45, ss.pending.z).project(Ae);
                    let gx = ((Ea.x + 1) * Ee) / 2,
                      gy = ((1 - Ea.y) * ht) / 2;
                    ((gh.style.left = `${gx}px`), (gh.style.top = `${gy}px`));
                  }
                  gh.hidden = !showGhost;
                }
                let Nn = Math.round(((((ve.getAzimuthalAngle() * 180) / Math.PI) % 360) + 360) % 360);
                Nn !== Ks && ((Ks = Nn), le(Nn));
              },
              Ou = function (Ee) {
                if (((zi = 0), !$ || !Zs || document.hidden || !Mo)) return;
                let ht = ve.update(Math.min((Ee - Vr) / 1e3, 0.05));
                ((Vr = Ee),
                  zt.matches || Je.animateWater(Ee * 0.001),
                  (ht || us) && (Xr(), (us = !1)),
                  je.render(lt, Ae),
                  ht || ve.autoRotate
                    ? oa()
                    : !zt.matches &&
                      !Gn &&
                      (Gn = window.setTimeout(
                        () => {
                          ((Gn = 0), oa());
                        },
                        st ? 70 : 50,
                      )));
              },
              jr = function () {
                Wa = !0;
                let Ee = ve.enableDamping;
                ((ve.enableDamping = !1), ve.update(), (ve.enableDamping = Ee));
              },
              Co = function () {
                jr();
                let Ee = Ae.aspect < 1,
                  ht = Ve(Ae.aspect) * (Ee ? Vee : 1),
                  Dt = Wd,
                  Ge =
                    Ee && Je.anchors.size
                      ? [...Je.anchors.values()]
                          .reduce((Kt, Nt) => Kt.add(Nt), new te.Vector3())
                          .divideScalar(Je.anchors.size)
                      : Fe.target;
                (ve.target.set(Ge.x, Ee ? 0 : Fe.target.y, Ge.z),
                  Ae.position
                    .copy(
                      (Ee ? new te.Vector3(Dt.z, Dt.y * Xee, -Dt.x) : new te.Vector3(Dt.x, Dt.y, Dt.z))
                        .normalize()
                        .multiplyScalar(ht),
                    )
                    .add(ve.target),
                  ve.update(),
                  (Wa = !1),
                  oa());
              },
              Lo = function () {
                if (!Z.clientWidth || !Z.clientHeight) return;
                let Ee = Z.clientWidth / Z.clientHeight,
                  ht = Ve(Ee) / Ve(Ae.aspect);
                if (Ae.position.lengthSq() > 0) {
                  let Dt = Ae.position.clone().sub(ve.target).multiplyScalar(ht);
                  (Dt.setLength(te.MathUtils.clamp(Dt.length(), ve.minDistance, ve.maxDistance)),
                    Ae.position.copy(ve.target).add(Dt));
                }
                ((Ae.aspect = Ee),
                  Ae.updateProjectionMatrix(),
                  je.setSize(Z.clientWidth, Z.clientHeight, !1),
                  ve.update(),
                  To());
              },
              P = function (Ee) {
                let ht = Z.getBoundingClientRect();
                if (
                  (mr.set(
                    ((Ee.clientX - ht.left) / ht.width) * 2 - 1,
                    1 - ((Ee.clientY - ht.top) / ht.height) * 2,
                  ),
                  _o.setFromCamera(mr, Ae),
                  k.current.placing)
                ) {
                  let Kt = _o.ray.intersectPlane(qa, Pu);
                  Kt &&
                    Ds({ x: Kt.x, z: Kt.z }, Se.network) &&
                    (re(!1), k.current.onPlace(aS({ x: Kt.x, z: Kt.z })));
                  return;
                }
                // Talat Noi editor: while placing a pin, a tap chooses its destination.
                if (ss) {
                  let Kt = _o.ray.intersectPlane(qa, Pu);
                  Kt && setPending(constrainPin({ x: Kt.x, z: Kt.z }), !0);
                  return;
                }
                // Talat Noi editor: pins that overlap at the tap are offered in a short list.
                if (k.current.editing && !k.current.structureEditing) {
                  let near = pinsAtPoint(Ee.clientX, Ee.clientY, ht);
                  if (near.length > 1) {
                    let wrapRect = Z.parentElement.getBoundingClientRect();
                    setChooser({ x: Ee.clientX - wrapRect.left, y: Ee.clientY - wrapRect.top, ids: near });
                    return;
                  }
                  if (near.length === 1) {
                    (setChooser(null), k.current.onSelect(near[0]));
                    return;
                  }
                  setChooser(null);
                }
                for (let [Kt, Nt] of k.current.structureEditing ? m.current : h.current) {
                  if (Nt.hidden) continue;
                  let sa = Nt.getBoundingClientRect();
                  if (
                    Ee.clientX >= sa.left &&
                    Ee.clientX <= sa.right &&
                    Ee.clientY >= sa.top &&
                    Ee.clientY <= sa.bottom
                  ) {
                    (k.current.keepExpanded || re(!1),
                      k.current.structureEditing ? k.current.onSelectStructure(Kt) : k.current.onSelect(Kt));
                    return;
                  }
                }
                let Dt = _o.intersectObject(Je.root, !0).find((Kt) => {
                  for (let Nt = Kt.object; Nt; Nt = Nt.parent) if (!Nt.visible) return !1;
                  return !0;
                });
                if (k.current.structureEditing) {
                  let Kt = Dt?.object.userData.structureId;
                  Kt && (re(!1), k.current.onSelectStructure(Kt));
                  return;
                }
                let Ge = Dt?.object.userData.placeId;
                Ge &&
                  k.current.visibleIds.includes(Ge) &&
                  (k.current.keepExpanded || re(!1), k.current.onSelect(Ge));
              },
              ee = function (Ee) {
                (Ee.pointerType === "mouse" && Ee.button !== 0) ||
                  startPinDrag(Ee) ||
                  wo.down(Ee.pointerId, Ee.clientX, Ee.clientY, Ee.timeStamp || performance.now());
              },
              de = function (Ee) {
                if (pinDrag) {
                  movePinDrag(Ee);
                  return;
                }
                wo.move(Ee.pointerId, Ee.clientX, Ee.clientY);
              },
              E = function (Ee) {
                if (pinDrag) {
                  Ee.pointerId === pinDrag.pointerId && (Ee.stopPropagation(), endPinDrag(!0, Ee));
                  return;
                }
                // Event timestamps keep taps reliable when the main thread is briefly busy.
                wo.up(Ee.pointerId, Ee.clientX, Ee.clientY, Ee.timeStamp || performance.now()) && P(Ee);
              },
              Ce = function () {
                ve.autoRotate && ((ve.autoRotate = !1), W(!1));
              },
              Re = function (Ee, ht = 0) {
                jr();
                let Dt = new te.Spherical().setFromVector3(Ae.position.clone().sub(ve.target));
                ((Dt.theta += Ee),
                  (Dt.phi = te.MathUtils.clamp(Dt.phi + ht, ve.minPolarAngle, ve.maxPolarAngle)),
                  Ae.position.copy(ve.target).add(new te.Vector3().setFromSpherical(Dt)),
                  ve.update(),
                  oa());
              },
              $e = function (Ee) {
                if (Ee.target === Z) {
                  if (Ee.key === "ArrowLeft") De.rotate(-Math.PI / 12);
                  else if (Ee.key === "ArrowRight") De.rotate(Math.PI / 12);
                  else if (Ee.key === "ArrowUp") De.tilt(-0.1);
                  else if (Ee.key === "ArrowDown") De.tilt(0.1);
                  else if (Ee.key === "+" || Ee.key === "=") De.zoom(0.82);
                  else if (Ee.key === "-") De.zoom(1.22);
                  else if (Ee.key === "Home" || Ee.key === "0") De.reset();
                  else return;
                  (Ce(), Ee.preventDefault());
                }
              },
              it = function () {
                document.hidden
                  ? (X(), cancelAnimationFrame(zi), clearTimeout(Gn), (Gn = 0), (zi = 0))
                  : ((Vr = performance.now()), oa());
              },
              Ot = function (Ee) {
                (Ee.preventDefault(),
                  (Zs = !1),
                  cancelAnimationFrame(zi),
                  clearTimeout(Gn),
                  (Gn = 0),
                  (zi = 0),
                  (ve.autoRotate = !1),
                  (f.current = null),
                  W(!1),
                  N("failed"));
              };
            var pe = oa,
              Y = To,
              se = Xr,
              me = Ou,
              ce = jr,
              fe = Co,
              ze = Lo,
              Qe = P,
              Pe = ee,
              Ke = de,
              K = E,
              At = Ce,
              Ct = Re,
              z = $e,
              L = it,
              ie = Ot;
            let [
              te,
              { OrbitControls: ye },
              { createStreetNeighbourhood: Ne, disposeScene: Ue, daylightEnvironment: ge },
              Se,
            ] = await Promise.all([
              Promise.resolve().then(() => (qs(), Iu)),
              Promise.resolve().then(() => (W6(), q6)),
              Promise.resolve().then(() => (mU(), pU)),
              zN(),
            ]);
            if (!$) return;
            ((b.current = Se), M(Se.geography.labels));
            let Fe = ZN(Se.network),
              ot = (Ee, ht) => Ne(Ee, ht, Se),
              Ve = Fe.distance,
              Ie = document.createElement("canvas");
            (Ie.setAttribute("aria-hidden", "true"),
              (Ie.className = "three-canvas"),
              Z.insertBefore(Ie, Z.firstChild));
            let je;
            try {
              je = new te.WebGLRenderer({
                canvas: Ie,
                antialias: !0,
                alpha: !1,
                powerPreference: "low-power",
              });
            } catch (Ee) {
              throw (Ie.remove(), Ee);
            }
            ne = () => {
              (je.dispose(), je.forceContextLoss(), Ie.remove());
            };
            let st = matchMedia("(max-width:760px)").matches;
            (je.setPixelRatio(Math.min(devicePixelRatio || 1, st ? 1.25 : 1.75)),
              (je.shadowMap.enabled = !0),
              (je.shadowMap.type = te.PCFSoftShadowMap),
              (je.outputColorSpace = te.SRGBColorSpace),
              (je.toneMapping = te.ACESFilmicToneMapping),
              (je.toneMappingExposure = gi.exposure));
            let lt = new te.Scene();
            lt.background = new te.Color(gi.background);
            let V = ge(),
              Me = new te.PMREMGenerator(je),
              xe = Me.fromEquirectangular(V);
            ((lt.environment = xe.texture),
              V.dispose(),
              Me.dispose(),
              (ne = () => {
                (xe.dispose(), je.dispose(), je.forceContextLoss(), Ie.remove());
              }),
              lt.add(
                new te.HemisphereLight(gi.hemisphere.sky, gi.hemisphere.ground, gi.hemisphere.intensity),
              ));
            let Oe = new te.DirectionalLight(gi.sun.colour, gi.sun.intensity);
            (Oe.position.set(gi.sun.x, gi.sun.y, gi.sun.z), (Oe.castShadow = !0));
            let Te = st ? 512 : 1024;
            (Oe.shadow.mapSize.set(Te, Te),
              (Oe.shadow.camera.left = -85),
              (Oe.shadow.camera.right = 85),
              (Oe.shadow.camera.top = 75),
              (Oe.shadow.camera.bottom = -75),
              (Oe.shadow.camera.near = 1),
              (Oe.shadow.camera.far = 220),
              (Oe.shadow.normalBias = 0.12),
              (Oe.shadow.bias = -2e-4),
              (Oe.shadow.radius = 3),
              lt.add(Oe),
              (je.shadowMap.autoUpdate = !1),
              (je.shadowMap.needsUpdate = !0));
            let ue = new te.DirectionalLight(gi.fill.colour, gi.fill.intensity);
            (ue.position.set(gi.fill.x, gi.fill.y, gi.fill.z), lt.add(ue));
            let Ae = new te.PerspectiveCamera(38, 1, 0.1, 850),
              ve = new ye(Ae, Z),
              zt = matchMedia("(prefers-reduced-motion:reduce)");
            ((ve.enableDamping = !zt.matches),
              (ve.dampingFactor = 0.13),
              (ve.rotateSpeed = 0.55),
              (ve.panSpeed = 0.8),
              (ve.minDistance = 7),
              (ve.maxDistance = 620),
              (ve.minPolarAngle = 0.08),
              (ve.maxPolarAngle = Math.PI * 0.43),
              (ve.maxTargetRadius = 58),
              (ve.screenSpacePanning = !1),
              (ve.autoRotateSpeed = 0.55),
              (ve.mouseButtons.LEFT = te.MOUSE.ROTATE),
              (ve.touches.ONE = te.TOUCH.ROTATE),
              (ve.touches.TWO = te.TOUCH.DOLLY_PAN));
            let Je = ot(k.current.places, k.current.structures);
            (lt.add(Je.root),
              _(Je.infillBuildings.length),
              I({ outside: Je.outsideStructures.length, blocked: Je.blockedEdges.length }),
              D3(Je.modelBlockers));
            let nn = null,
              On,
              _o = new te.Raycaster(),
              qa = new te.Plane(new te.Vector3(0, 1, 0), -0.2),
              mr = new te.Vector2(),
              Pu = new te.Vector3(),
              Ea = new te.Vector3(),
              wo = new nS(),
              zi = 0,
              Gn = 0,
              Vr = performance.now(),
              Mo = !0,
              Zs = !0,
              Ks = -1,
              us = !0,
              Wa = !1;
            (Lo(), Co());
            // ---------------------------------------------------------------------------
            // Talat Noi editor: pin placement on the 3D map.
            //
            // Positions here are SCENE coordinates {x, z} on the ground plane. The scene is
            // built from real geography (OpenStreetMap), so a scene point converts exactly to
            // latitude/longitude with R3() and back with cu(). The flat illustration's x/y
            // percentages are a separate artwork position and are never derived from here.
            // ---------------------------------------------------------------------------
            let ringMaterial = (colour, opacity) =>
              new te.MeshBasicMaterial({
                color: colour,
                transparent: !0,
                opacity,
                side: te.DoubleSide,
                depthTest: !1,
                depthWrite: !1,
              });
            ((placeRing = new te.Mesh(new te.RingGeometry(0.42, 0.66, 40), ringMaterial(2060267, 0.95))),
              (originRing = new te.Mesh(new te.RingGeometry(0.34, 0.46, 32), ringMaterial(6976119, 0.7))));
            for (let ring of [placeRing, originRing])
              ((ring.rotation.x = -Math.PI / 2), (ring.renderOrder = 60), (ring.visible = !1), lt.add(ring));
            let toLocal = (p) => Ug(p),
              insideCoverage = (p) => Ds(p, Se.network),
              buildingsIndex = () => {
                if (buildingIndex && buildingIndex.scene === Je) return buildingIndex.items;
                let items = Je.infillBuildings.map((b) => {
                  let xs = b.polygon.map((q) => q[0]),
                    zs = b.polygon.map((q) => q[1]);
                  return {
                    b,
                    minX: Math.min(...xs),
                    maxX: Math.max(...xs),
                    minZ: Math.min(...zs),
                    maxZ: Math.max(...zs),
                  };
                });
                return ((buildingIndex = { scene: Je, items }), items);
              },
              roofAt = (p) => {
                let L = toLocal(p);
                for (let it of buildingsIndex())
                  if (
                    L.x >= it.minX &&
                    L.x <= it.maxX &&
                    L.z >= it.minZ &&
                    L.z <= it.maxZ &&
                    Ir(L, it.b.polygon) &&
                    !it.b.holes.some((hole) => Ir(L, hole))
                  )
                    return it.b;
                return null;
              },
              modelAt = (p) =>
                Je.modelBlockers.find(
                  (bx) => p.x > bx.minX - 0.05 && p.x < bx.maxX + 0.05 && p.z > bx.minZ - 0.05 && p.z < bx.maxZ + 0.05,
                ) ?? null,
              openGround = (p) => insideCoverage(p) && !roofAt(p) && !modelAt(p),
              // Keeps a pin inside the red coverage boundary and off roofs and 3D landmark
              // models: the nearest open ground point is chosen instead.
              constrainPin = (p) => {
                let adjusted = null;
                if (!insideCoverage(p)) {
                  adjusted = "boundary";
                  let L = toLocal(p),
                    best = null;
                  for (let i2 = 0; i2 < Se.network.boundary.length; i2++) {
                    let a2 = Se.network.boundary[i2],
                      b2 = Se.network.boundary[(i2 + 1) % Se.network.boundary.length],
                      hit = FN(L, { x: a2[0], z: a2[1] }, { x: b2[0], z: b2[1] });
                    (!best || hit.distance < best.distance) && (best = hit);
                  }
                  if (best) {
                    let dx = best.point.x - L.x,
                      dz = best.point.z - L.z,
                      len = Math.hypot(dx, dz) || 1;
                    for (let inset of [0.06, 0.12, 0.25, 0.5]) {
                      let q = Kn({ x: best.point.x + (dx / len) * inset, z: best.point.z + (dz / len) * inset });
                      if (insideCoverage(q)) {
                        p = q;
                        break;
                      }
                    }
                  }
                }
                if (!openGround(p)) {
                  let blocker = roofAt(p) ? "building" : modelAt(p) ? "structure" : "boundary";
                  e: for (let radius = 0.06; radius <= 9; radius += radius < 1.5 ? 0.06 : 0.3)
                    for (let step = 0; step < 32; step++) {
                      let angle = (step / 32) * Math.PI * 2,
                        q = { x: p.x + Math.cos(angle) * radius, z: p.z + Math.sin(angle) * radius };
                      if (openGround(q)) {
                        ((p = q), (adjusted = adjusted ?? blocker));
                        break e;
                      }
                    }
                }
                return { x: p.x, z: p.z, adjusted };
              },
              groundAt = (clientX, clientY) => {
                let rect = Z.getBoundingClientRect();
                (mr.set(
                  ((clientX - rect.left) / rect.width) * 2 - 1,
                  1 - ((clientY - rect.top) / rect.height) * 2,
                ),
                  _o.setFromCamera(mr, Ae));
                let hit = _o.ray.intersectPlane(qa, Pu);
                return hit ? { x: hit.x, z: hit.z } : null;
              },
              toScreen = (p, y) => {
                Ea.set(p.x, y, p.z).project(Ae);
                return { x: ((Ea.x + 1) * Z.clientWidth) / 2, y: ((1 - Ea.y) * Z.clientHeight) / 2 };
              },
              // Which pins a tap points at: the round pin heads first, then the name labels,
              // then pins whose ground point is within a finger's width.
              pinsAtPoint = (clientX, clientY, rect) => {
                let hits = (selector, pad) => {
                  let ids = [];
                  for (let [id, el] of h.current) {
                    if (el.hidden || (selector === ".pin-label" && el.classList.contains("label-off"))) continue;
                    let part = selector ? el.querySelector(selector) : el;
                    if (!part) continue;
                    let r2 = part.getBoundingClientRect();
                    clientX >= r2.left - pad &&
                      clientX <= r2.right + pad &&
                      clientY >= r2.top - pad &&
                      clientY <= r2.bottom + pad &&
                      ids.push(id);
                  }
                  return ids;
                };
                let heads = hits(".pin-head", 2);
                if (heads.length) return heads;
                let labels = hits(".pin-label", 0);
                if (labels.length) return labels;
                let ids = [];
                for (let [id, a2] of Je.anchors) {
                  let el = h.current.get(id);
                  if (!el || el.hidden) continue;
                  let sp = toScreen(a2, a2.y);
                  Math.hypot(sp.x - (clientX - rect.left), sp.y - (clientY - rect.top)) < 24 && ids.push(id);
                }
                return ids;
              },
              placeById = (id) => k.current.places.find((pl) => pl.id === id),
              pendingInfo = () => {
                if (!ss || !ss.pending) return null;
                let ll = R3(ss.pending);
                return {
                  kind: ss.kind,
                  id: ss.id ?? null,
                  lat: Math.round(ll.lat * 1e6) / 1e6,
                  lng: Math.round(ll.lng * 1e6) / 1e6,
                  adjusted: ss.adjusted ?? null,
                  moved: !ss.original || Math.hypot(ss.pending.x - ss.original.x, ss.pending.z - ss.original.z) > 0.004,
                };
              },
              emitPending = () => k.current.onPlacementChange?.(pendingInfo()),
              applySession = () => {
                let pending = ss?.pending ?? null;
                ((placeRing.visible = !!pending),
                  pending && placeRing.position.set(pending.x, 0.13, pending.z),
                  (originRing.visible = !!ss && ss.kind === "move" && !!ss.original && !!pending && pendingInfo()?.moved),
                  originRing.visible && originRing.position.set(ss.original.x, 0.12, ss.original.z));
                if (ss && ss.kind === "move" && pending) {
                  let g = Je.landmarks.get(ss.id),
                    a2 = Je.anchors.get(ss.id),
                    head = Je.pinHeight(pending);
                  if (g) {
                    let sc = g.scale.x || 1;
                    (g.position.set(pending.x, 0.1, pending.z),
                      g.children[0] && (g.children[0].position.y = head / sc),
                      g.children[1] && (g.children[1].position.y = head / sc - 0.4),
                      g.updateMatrixWorld(!0));
                  }
                  a2 && a2.set(pending.x, head + 0.45, pending.z);
                }
                (Z.classList.toggle("is-placing-pin", !!ss), (us = !0), oa());
              },
              setPending = (p, emit) => {
                ss && ((ss.pending = { x: p.x, z: p.z }), (ss.adjusted = p.adjusted ?? null), applySession(), emit && emitPending());
              },
              startSession = (placement) => {
                let original = null;
                if (placement.kind === "move") {
                  let g = Je.landmarks.get(placement.id),
                    pl = placeById(placement.id);
                  original = g ? { x: g.position.x, z: g.position.z } : pl ? UN(pl) : null;
                }
                (Ce(),
                  (ss = {
                    kind: placement.kind,
                    id: placement.id ?? null,
                    original,
                    pending: original ? { ...original } : null,
                    adjusted: null,
                  }),
                  applySession(),
                  emitPending());
              },
              endSession = () => {
                ss &&
                  (pinDrag && endPinDrag(!1),
                  (ss = null),
                  Je.setPlaces(k.current.places),
                  applySession());
              },
              // A press on the selected pin (or the pin being placed) starts a drag. The move
              // session only begins once the pointer really moves, so a plain click still selects.
              startPinDrag = (ev) => {
                let props = k.current;
                if (pinDrag || !props.editing || props.placing || props.structureEditing) return !1;
                let marker = ev.target instanceof Element ? ev.target.closest(".three-marker, .three-ghost-pin") : null;
                if (!marker) return !1;
                let isGhost = marker === ghostRef.current,
                  id = marker.dataset.placeId ?? null;
                if (ss ? (ss.kind === "add" ? !isGhost : id !== ss.id) : isGhost || !id || id !== props.selectedId)
                  return !1;
                ((pinDrag = {
                  pointerId: ev.pointerId,
                  id,
                  startX: ev.clientX,
                  startY: ev.clientY,
                  offsetX: 0,
                  offsetY: 0,
                  moved: !1,
                }),
                  (ve.enabled = !1),
                  wo.cancel());
                try {
                  Z.setPointerCapture(ev.pointerId);
                } catch {}
                return (ev.preventDefault(), ev.stopPropagation(), !0);
              },
              movePinDrag = (ev) => {
                if (ev.pointerId !== pinDrag.pointerId) return;
                if (
                  (ev.stopPropagation(),
                  !pinDrag.moved && Math.hypot(ev.clientX - pinDrag.startX, ev.clientY - pinDrag.startY) < 5)
                )
                  return;
                if (!pinDrag.moved) {
                  ss || (startSession({ kind: "move", id: pinDrag.id }), k.current.onRequestMove?.(pinDrag.id));
                  if (!ss?.pending) return endPinDrag(!1);
                  let grip = toScreen(ss.pending, 0.2),
                    rect = Z.getBoundingClientRect();
                  ((pinDrag.offsetX = grip.x + rect.left - pinDrag.startX),
                    (pinDrag.offsetY = grip.y + rect.top - pinDrag.startY),
                    (pinDrag.moved = !0),
                    Z.classList.add("is-dragging-pin"));
                }
                let g = groundAt(ev.clientX + pinDrag.offsetX, ev.clientY + pinDrag.offsetY);
                g && setPending(constrainPin(g), !1);
              },
              endPinDrag = (emit = !0, ev = null) => {
                if (!pinDrag) return;
                let { pointerId, moved } = pinDrag;
                ((pinDrag = null), (ve.enabled = !0), Z.classList.remove("is-dragging-pin"));
                try {
                  Z.hasPointerCapture(pointerId) && Z.releasePointerCapture(pointerId);
                } catch {}
                // Not dragged: treat it as an ordinary tap (selection or the overlapping-pin list).
                (wo.cancel(), emit && (moved ? emitPending() : !ss && ev && P(ev)));
              },
              viewOver = (p, distance) => {
                (jr(),
                  ve.target.set(p.x, 0, p.z),
                  Ae.position.set(p.x, distance, p.z + 0.1),
                  ve.update(),
                  oa());
              };
            let X = () => {
                (pinDrag && endPinDrag(), wo.cancel());
              },
              De = {
                render: To,
                rebuild(Ee, ht) {
                  let Dt = ot(Ee, ht);
                  (lt.remove(Je.root),
                    Ue(Je.root),
                    (Je = Dt),
                    lt.add(Je.root),
                    _(Je.infillBuildings.length),
                    I({ outside: Je.outsideStructures.length, blocked: Je.blockedEdges.length }),
                    D3(Je.modelBlockers),
                    (je.shadowMap.needsUpdate = !0),
                    !Wa && Ae.aspect < 1 && Co(),
                    applySession(),
                    To());
                },
                setPlaces(Ee) {
                  (Je.setPlaces(Ee), applySession(), To());
                },
                syncPlacement(placement) {
                  if (!placement) return endSession();
                  (ss && ss.kind === placement.kind && ss.id === (placement.id ?? null)) ||
                    (ss && endSession(), startSession(placement));
                },
                placementInfo: pendingInfo,
                nudge(forward, right, metres) {
                  if (!ss || !ss.pending) return;
                  let fwd = ve.target.clone().sub(Ae.position);
                  ((fwd.y = 0), fwd.lengthSq() < 1e-6 ? fwd.set(0, 0, -1) : fwd.normalize());
                  let step = (metres / 10) * Yo;
                  setPending(
                    constrainPin({
                      x: ss.pending.x + (fwd.x * forward - fwd.z * right) * step,
                      z: ss.pending.z + (fwd.z * forward + fwd.x * right) * step,
                    }),
                    !0,
                  );
                },
                setPendingLatLng(ll) {
                  ss && qo(ll) && setPending(constrainPin(cu(ll)), !0);
                },
                topView() {
                  let p = ss?.pending ?? ss?.original ?? Je.anchors.get(k.current.selectedId ?? "") ?? ve.target;
                  (savedView || (savedView = { position: Ae.position.clone(), target: ve.target.clone() }),
                    viewOver(p, 26));
                },
                restoreView() {
                  savedView &&
                    (jr(),
                    ve.target.copy(savedView.target),
                    Ae.position.copy(savedView.position),
                    (savedView = null),
                    ve.update(),
                    oa());
                },
                isTopView: () => !!savedView,
                mode(Ee) {
                  ((ve.mouseButtons.LEFT = Ee ? te.MOUSE.PAN : te.MOUSE.ROTATE),
                    (ve.touches.ONE = Ee ? te.TOUCH.PAN : te.TOUCH.ROTATE));
                },
                tour(Ee) {
                  ((ve.autoRotate = Ee), (Vr = performance.now()), oa());
                },
                reset: Co,
                zoom(Ee) {
                  jr();
                  let ht = Ae.position.clone().sub(ve.target);
                  (ht.setLength(te.MathUtils.clamp(ht.length() * Ee, ve.minDistance, ve.maxDistance)),
                    Ae.position.copy(ve.target).add(ht),
                    ve.update(),
                    oa());
                },
                rotate(Ee) {
                  Re(Ee);
                },
                tilt(Ee) {
                  Re(0, Ee);
                },
                top() {
                  jr();
                  let Ee = Ae.position.distanceTo(ve.target);
                  (Ae.position.copy(ve.target).add(new te.Vector3(0, Ee, 0.1)), ve.update(), oa());
                },
                focus(Ee, ht = !1) {
                  let Dt = ht ? Je.structureAnchors.get(Ee) : Je.anchors.get(Ee);
                  if (!Dt) return;
                  jr();
                  let Ge = Ae.position.clone().sub(ve.target).normalize().multiplyScalar(55);
                  (ve.target.set(Dt.x, 0, Dt.z), Ae.position.copy(ve.target).add(Ge), ve.update(), oa());
                },
                centerLocation() {
                  let Ee = k.current.location?.usableFix;
                  if (!Ee) return;
                  let ht = cu(Ee);
                  if (!Ds(ht, Se.network)) return;
                  jr();
                  let Dt = Ae.position.clone().sub(ve.target).normalize().multiplyScalar(22);
                  (ve.target.set(ht.x, 0, ht.z), Ae.position.copy(ve.target).add(Dt), ve.update(), To());
                },
              };
            ((f.current = De), De.mode(G));
            let Lt = new ResizeObserver(Lo);
            Lt.observe(Z);
            let dt = new IntersectionObserver((Ee) => {
              ((Mo = Ee[0].isIntersecting),
                Mo
                  ? ((Vr = performance.now()), oa())
                  : (cancelAnimationFrame(zi), clearTimeout(Gn), (Gn = 0), (zi = 0)));
            });
            dt.observe(Z);
            let un = () => {
              ((ve.enableDamping = !zt.matches), zt.matches && (Ce(), clearTimeout(Gn), (Gn = 0)), oa());
            };
            (zt.addEventListener("change", un),
              Z.addEventListener("pointerdown", ee, !0),
              Z.addEventListener("pointermove", de, !0),
              Z.addEventListener("pointerup", E, !0),
              Z.addEventListener("pointercancel", X),
              Z.addEventListener("lostpointercapture", X),
              Z.addEventListener("keydown", $e));
            let Qn = () => {
              ((Wa = !0), Ce());
            };
            (ve.addEventListener("change", To),
              ve.addEventListener("start", Qn),
              document.addEventListener("visibilitychange", it),
              window.addEventListener("blur", X),
              Ie.addEventListener("webglcontextlost", Ot),
              (ne = () => {
                ((f.current = null),
                  cancelAnimationFrame(zi),
                  clearTimeout(Gn),
                  Lt.disconnect(),
                  dt.disconnect(),
                  zt.removeEventListener("change", un),
                  Z.removeEventListener("pointerdown", ee, !0),
                  Z.removeEventListener("pointermove", de, !0),
                  Z.removeEventListener("pointerup", E, !0),
                  Z.removeEventListener("pointercancel", X),
                  Z.removeEventListener("lostpointercapture", X),
                  Z.removeEventListener("keydown", $e),
                  document.removeEventListener("visibilitychange", it),
                  window.removeEventListener("blur", X),
                  Ie.removeEventListener("webglcontextlost", Ot),
                  ve.dispose(),
                  Ue(lt),
                  xe.dispose(),
                  Oe.shadow.map?.dispose(),
                  je.dispose(),
                  je.forceContextLoss(),
                  Ie.remove());
              }),
              Ou(performance.now()),
              $ && N("ready"));
          } catch {
            (ne(), $ && N("failed"));
          }
        })(),
        () => {
          (($ = !1), ne());
        }
      );
    }, []),
      (0, Ln.useEffect)(() => {
        let D = setTimeout(() => f.current?.rebuild(k.current.places, k.current.structures), 100);
        return () => clearTimeout(D);
      }, [he]),
      // Talat Noi editor: pins follow place edits without rebuilding the neighbourhood.
      (0, Ln.useEffect)(() => {
        let D = setTimeout(() => f.current?.setPlaces(k.current.places), 30);
        return () => clearTimeout(D);
      }, [pinKey]),
      (0, Ln.useEffect)(() => {
        A === "ready" && f.current?.syncPlacement(k.current.placement ?? null);
      }, [placementKey, A]),
      (0, Ln.useEffect)(() => {
        A !== "ready" && chooser && setChooser(null);
        t.editing || setChooser(null);
      }, [A, t.editing]),
      (0, Ln.useEffect)(() => {
        if (!t.apiRef) return;
        t.apiRef.current = {
          ready: () => !!f.current,
          nudge: (forward, right, metres) => f.current?.nudge(forward, right, metres),
          topView: () => f.current?.topView(),
          restoreView: () => f.current?.restoreView(),
          isTopView: () => f.current?.isTopView() ?? !1,
          focus: (id) => f.current?.focus(id),
          placementInfo: () => f.current?.placementInfo() ?? null,
          setPendingLatLng: (ll) => f.current?.setPendingLatLng(ll),
          stopTour: () => {
            (f.current?.tour(!1), W(!1));
          },
        };
        let api = t.apiRef;
        return () => {
          api.current = null;
        };
      }, [t.apiRef]),
      (0, Ln.useEffect)(() => {
        f.current?.render();
      }, [r, o, i, a, s, l, A, v]),
      (0, Ln.useEffect)(() => {
        (f.current?.render(),
          S.current && u?.usableFix && A === "ready" && (f.current?.centerLocation(), (S.current = !1)));
      }, [u?.usableFix, A]),
      (0, Ln.useEffect)(() => {
        if (!j) return;
        let D = document.body.style.overflow;
        ((document.body.style.overflow = "hidden"), d.current?.focus({ preventScroll: !0 }));
        let Z = ($) => {
          $.key === "Escape" && re(!1);
        };
        return (
          window.addEventListener("keydown", Z),
          () => {
            ((document.body.style.overflow = D), window.removeEventListener("keydown", Z));
          }
        );
      }, [j]));
    function _e(D) {
      let Z = f.current;
      Z && (Z.tour(!1), W(!1), D(Z));
    }
    let ae = u?.usableFix
        ? b.current && !Ds(cu(u.usableFix), b.current.network)
          ? J(
              "You are outside this project area; the map remains centered on Talat Noi.",
              "\u0E04\u0E38\u0E13\u0E2D\u0E22\u0E39\u0E48\u0E19\u0E2D\u0E01\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23 \u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E41\u0E2A\u0E14\u0E07\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22",
            )
          : u.usableFix.accuracy > 40
            ? J(
                `Accuracy \xB1${Math.round(u.usableFix.accuracy)} m; alley directions need a better fix.`,
                `\u0E04\u0E25\u0E32\u0E14\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19 \xB1${Math.round(u.usableFix.accuracy)} \u0E21. \u0E15\u0E49\u0E2D\u0E07\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33\u0E02\u0E36\u0E49\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1A\u0E2D\u0E01\u0E17\u0E32\u0E07\u0E43\u0E19\u0E15\u0E23\u0E2D\u0E01`,
              )
            : J(
                `Live \xB7 accuracy \xB1${Math.round(u.usableFix.accuracy)} m`,
                `\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E2A\u0E14 \xB7 \u0E04\u0E27\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33 \xB1${Math.round(u.usableFix.accuracy)} \u0E21.`,
              )
        : u?.phase === "denied"
          ? J(
              "Location permission denied; the map still works.",
              "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E22\u0E31\u0E07\u0E43\u0E0A\u0E49\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49",
            )
          : u?.phase === "locating"
            ? J(
                "Finding your location\u2026",
                "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u2026",
              )
            : u?.phase === "timeout"
              ? J(
                  "Location timed out. Try My Location again.",
                  "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E2B\u0E21\u0E14\u0E40\u0E27\u0E25\u0E32 \u0E25\u0E2D\u0E07\u0E01\u0E14\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07",
                )
              : u?.phase === "unavailable"
                ? J(
                    "Location is unavailable. The map and place links still work.",
                    "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E22\u0E31\u0E07\u0E43\u0E0A\u0E49\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E41\u0E25\u0E30\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49",
                  )
                : u?.phase === "unsupported"
                  ? J(
                      "This browser does not support live location.",
                      "\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E2A\u0E14",
                    )
                  : u?.phase === "insecure"
                    ? J(
                        "Live location requires a secure page.",
                        "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E2A\u0E14\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E17\u0E35\u0E48\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22",
                      )
                    : u?.phase === "paused"
                      ? J(
                          "Location paused while the page is hidden.",
                          "\u0E1E\u0E31\u0E01\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E16\u0E39\u0E01\u0E0B\u0E48\u0E2D\u0E19",
                        )
                      : u?.phase === "live"
                        ? J(
                            "Your location fix expired. Tap My Location to refresh.",
                            "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38 \u0E01\u0E14\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E43\u0E2B\u0E21\u0E48",
                          )
                        : J(
                            "Your location stays private",
                            "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27",
                          ),
      U = new Set(r);
    return (0, nt.jsxs)("div", {
      className: `immersive-wrap ${j ? "is-expanded" : ""} ${l ? "is-placing" : ""} ${t.editing ? "is-editing" : ""} ${t.placement ? "has-pin-placement" : ""}`,
      children: [
        (0, nt.jsxs)("div", {
          className: "immersive-top",
          children: [
            (0, nt.jsxs)("span", {
              className: "scene-badge",
              children: [
                (0, nt.jsx)("span", {}),
                J(
                  "TALAT NOI IN 3D",
                  "\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22\u0E43\u0E19 3 \u0E21\u0E34\u0E15\u0E34",
                ),
                (0, nt.jsx)("small", {
                  children: J(
                    "Illustrated miniature \xB7 connected streets",
                    "\u0E22\u0E48\u0E32\u0E19\u0E08\u0E33\u0E25\u0E2D\u0E07 \xB7 \u0E16\u0E19\u0E19\u0E17\u0E35\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E01\u0E31\u0E19",
                  ),
                }),
              ],
            }),
            (0, nt.jsxs)("div", {
              className: "scene-top-actions",
              children: [
                (0, nt.jsx)("button", {
                  "aria-label": J(
                    "Map layers",
                    "\u0E0A\u0E31\u0E49\u0E19\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48",
                  ),
                  "aria-expanded": p,
                  onClick: () => y(!p),
                  children: (0, nt.jsx)(_s, {}),
                }),
                (0, nt.jsxs)("span", {
                  className: "scene-compass",
                  title: J("Camera rotation", "\u0E21\u0E38\u0E21\u0E01\u0E25\u0E49\u0E2D\u0E07"),
                  children: [(0, nt.jsx)(id, { style: { transform: `rotate(${-oe}deg)` } }), oe, "\xB0"],
                }),
                (0, nt.jsx)("button", {
                  "aria-label": j
                    ? J(
                        "Exit immersive view",
                        "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07\u0E40\u0E15\u0E47\u0E21\u0E08\u0E2D",
                      )
                    : J(
                        "Expand immersive view",
                        "\u0E02\u0E22\u0E32\u0E22\u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07",
                      ),
                  "aria-pressed": j,
                  onClick: () => re(!j),
                  children: j ? (0, nt.jsx)(va, {}) : (0, nt.jsx)(rd, {}),
                }),
              ],
            }),
          ],
        }),
        p &&
          (0, nt.jsx)("div", {
            className: "geography-layers",
            "aria-label": J(
              "Illustrated map layers",
              "\u0E0A\u0E31\u0E49\u0E19\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E20\u0E32\u0E1E\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A",
            ),
            children: [
              [
                "infill",
                `Neighbourhood buildings (${w})`,
                "\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E43\u0E19\u0E22\u0E48\u0E32\u0E19",
              ],
              [
                "boundary",
                "Red coverage boundary",
                "\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E35\u0E41\u0E14\u0E07",
              ],
              ["pins", "Place pins", "\u0E2B\u0E21\u0E38\u0E14\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48"],
              [
                "labels",
                "Geographic labels",
                "\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E19\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48",
              ],
            ].map(([D, Z, $]) =>
              (0, nt.jsxs)(
                "label",
                {
                  children: [
                    (0, nt.jsx)("input", {
                      type: "checkbox",
                      checked: v[D],
                      onChange: (ne) => g((pe) => ({ ...pe, [D]: ne.target.checked })),
                    }),
                    J(Z, $),
                  ],
                },
                D,
              ),
            ),
          }),
        (0, nt.jsxs)("div", {
          ref: d,
          tabIndex: 0,
          className: "three-surface",
          role: "region",
          "aria-label": J(
            "3D neighbourhood. Arrow keys rotate and tilt; plus and minus zoom; Home resets.",
            "\u0E22\u0E48\u0E32\u0E19\u0E08\u0E33\u0E25\u0E2D\u0E07 3 \u0E21\u0E34\u0E15\u0E34 \u0E43\u0E0A\u0E49\u0E25\u0E39\u0E01\u0E28\u0E23\u0E2B\u0E21\u0E38\u0E19\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E31\u0E1A\u0E21\u0E38\u0E21 \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22\u0E1A\u0E27\u0E01\u0E41\u0E25\u0E30\u0E25\u0E1A\u0E0B\u0E39\u0E21 Home \u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15",
          ),
          "aria-describedby": "scene-help",
          children: [
            (0, nt.jsx)("div", {
              className: "three-labels",
              children: e
                .filter((D) => U.has(D.id))
                .map((D) =>
                  (0, nt.jsx)(
                    "button",
                    {
                      ref: (Z) => {
                        Z ? h.current.set(D.id, Z) : h.current.delete(D.id);
                      },
                      hidden: A !== "ready",
                      "data-place-id": D.id,
                      className: `three-marker has-pin ${o === D.id ? "selected" : ""}`,
                      "aria-label": mp(D, s),
                      onClick: (Z) => {
                        Z.detail === 0 &&
                          !l &&
                          (t.keepExpanded || re(!1), f.current?.tour(!1), W(!1), t.onSelect(D.id));
                      },
                      children: (0, nt.jsx)(Zd, { place: D, lang: s }),
                    },
                    D.id,
                  ),
                ),
            }),
            (0, nt.jsx)("div", {
              ref: ghostRef,
              hidden: !0,
              className: "three-ghost-pin",
              role: "img",
              "aria-label": "New pin position",
              style: { "--pin": hp[t.placement?.category ?? "Community"]?.color ?? "#477996" },
              children: (0, nt.jsxs)("span", {
                className: "place-pin",
                children: [
                  (0, nt.jsx)("span", {
                    className: "pin-marker",
                    children: (0, nt.jsx)("span", {
                      className: "pin-head",
                      children: (0, nt.jsx)(dS, { category: t.placement?.category ?? "Community", size: 19 }),
                    }),
                  }),
                  (0, nt.jsx)("span", { className: "pin-label", children: J("New place", "สถานที่ใหม่") }),
                ],
              }),
            }),
            (0, nt.jsx)("div", {
              className: "scene-geographic-labels",
              children: x.map((D) =>
                (0, nt.jsxs)(
                  "span",
                  {
                    ref: (Z) => {
                      Z ? T.current.set(D.id, Z) : T.current.delete(D.id);
                    },
                    hidden: !0,
                    className: `scene-geographic-label ${D.kind}`,
                    children: [
                      (0, nt.jsx)("strong", { children: s === "en" ? D.en || D.th : D.th || D.en }),
                      D.en && D.th && (0, nt.jsx)("small", { children: s === "en" ? D.th : D.en }),
                    ],
                  },
                  D.id,
                ),
              ),
            }),
            a &&
              (0, nt.jsx)("div", {
                className: "three-labels structure-markers",
                children: n
                  .filter((D) => !D.hidden)
                  .map((D) =>
                    (0, nt.jsxs)(
                      "button",
                      {
                        ref: (Z) => {
                          Z ? m.current.set(D.id, Z) : m.current.delete(D.id);
                        },
                        hidden: A !== "ready",
                        className: `three-marker three-structure-marker ${i === D.id ? "selected" : ""}`,
                        "aria-label": `Edit structure ${D.label}`,
                        onClick: (Z) => {
                          Z.detail === 0 && !l && (re(!1), t.onSelectStructure(D.id));
                        },
                        children: [
                          (0, nt.jsx)("span", {
                            className: "three-pin",
                            children: (0, nt.jsx)(td, { size: 17 }),
                          }),
                          i === D.id &&
                            (0, nt.jsx)("span", { className: "three-marker-name", children: D.label }),
                        ],
                      },
                      D.id,
                    ),
                  ),
              }),
          ],
        }),
        chooser &&
          (0, nt.jsxs)("div", {
            className: "pin-chooser",
            role: "menu",
            "aria-label": J("Choose a place", "เลือกสถานที่"),
            style: { left: `${chooser.x}px`, top: `${chooser.y}px` },
            children: [
              (0, nt.jsxs)("p", {
                children: [chooser.ids.length, " ", J("places are here. Choose one:", "สถานที่อยู่ตรงนี้ เลือกหนึ่งแห่ง")],
              }),
              chooser.ids
                .map((id) => e.find((pl) => pl.id === id))
                .filter(Boolean)
                .map((pl) =>
                  (0, nt.jsxs)(
                    "button",
                    {
                      role: "menuitem",
                      style: { "--pin": hp[pl.category].color },
                      onClick: () => {
                        (setChooser(null), t.onSelect(pl.id));
                      },
                      children: [
                        (0, nt.jsx)("span", { className: "pin-chooser-dot", children: (0, nt.jsx)(dS, { category: pl.category, size: 14 }) }),
                        s === "en" ? pl.nameEn : pl.nameTh,
                      ],
                    },
                    pl.id,
                  ),
                ),
              (0, nt.jsx)("button", {
                className: "pin-chooser-close",
                onClick: () => setChooser(null),
                children: J("Close", "ปิด"),
              }),
            ],
          }),
        A !== "ready" &&
          (0, nt.jsx)("div", {
            className: `scene-status ${A === "failed" ? "scene-failed" : ""}`,
            role: "status",
            children:
              A === "failed"
                ? (0, nt.jsxs)(nt.Fragment, {
                    children: [
                      (0, nt.jsx)(Ph, {}),
                      (0, nt.jsx)("h3", {
                        children: J(
                          "Use the illustrated view",
                          "\u0E43\u0E0A\u0E49\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E20\u0E32\u0E1E\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A",
                        ),
                      }),
                      (0, nt.jsx)("p", {
                        children: J(
                          "The 3D map or its data could not be loaded. Your place cards and directions remain available.",
                          "\u0E42\u0E2B\u0E25\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48 3 \u0E21\u0E34\u0E15\u0E34\u0E2B\u0E23\u0E37\u0E2D\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E22\u0E31\u0E07\u0E14\u0E39\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E41\u0E25\u0E30\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E44\u0E14\u0E49",
                        ),
                      }),
                      (0, nt.jsx)("button", {
                        onClick: c,
                        children: J(
                          "Open illustrated map",
                          "\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E20\u0E32\u0E1E\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A",
                        ),
                      }),
                    ],
                  })
                : (0, nt.jsxs)(nt.Fragment, {
                    children: [
                      (0, nt.jsx)("span", { className: "scene-loader" }),
                      (0, nt.jsx)("p", {
                        children: J(
                          "Building your miniature neighbourhood\u2026",
                          "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E22\u0E48\u0E32\u0E19\u0E08\u0E33\u0E25\u0E2D\u0E07\u2026",
                        ),
                      }),
                    ],
                  }),
          }),
        (0, nt.jsxs)("div", {
          className: "scene-bottom",
          children: [
            u &&
              (0, nt.jsx)("span", {
                role: "status",
                className: `scene-location-status ${u.usableFix || u.phase !== "off" ? "has-notice" : ""}`,
                children: ae,
              }),
            (0, nt.jsxs)("div", {
              className: "scene-toolbar",
              children: [
                u &&
                  (0, nt.jsxs)("div", {
                    className: "scene-location-actions",
                    children: [
                      (0, nt.jsxs)("button", {
                        onClick: () => {
                          ((S.current = !0),
                            u.usableFix ? (_e((D) => D.centerLocation()), (S.current = !1)) : u.start());
                        },
                        children: [
                          (0, nt.jsx)(na, {}),
                          u.usableFix
                            ? J(
                                "Center on me",
                                "\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E21\u0E32\u0E17\u0E35\u0E48\u0E09\u0E31\u0E19",
                              )
                            : J(
                                "My Location",
                                "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19",
                              ),
                        ],
                      }),
                      t.onOpenNavigation &&
                        (0, nt.jsx)("button", {
                          onClick: () => {
                            (re(!1), t.onOpenNavigation?.());
                          },
                          children: J("Directions", "\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07"),
                        }),
                    ],
                  }),
                (0, nt.jsxs)("div", {
                  className: "scene-controls",
                  "aria-label": J(
                    "3D map controls",
                    "\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48 3 \u0E21\u0E34\u0E15\u0E34",
                  ),
                  children: [
                    (0, nt.jsxs)("div", {
                      className: "scene-control-group scene-view-group",
                      children: [
                        (0, nt.jsx)("button", {
                          disabled: A !== "ready",
                          "aria-label": J("Zoom out", "\u0E0B\u0E39\u0E21\u0E2D\u0E2D\u0E01"),
                          onClick: () => _e((D) => D.zoom(1.22)),
                          children: (0, nt.jsx)(bl, {}),
                        }),
                        (0, nt.jsxs)("button", {
                          disabled: A !== "ready",
                          "aria-label": J(
                            "Reset 3D view",
                            "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07 3 \u0E21\u0E34\u0E15\u0E34",
                          ),
                          title: J(
                            "Reset view",
                            "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07",
                          ),
                          onClick: () => _e((D) => D.reset()),
                          children: [(0, nt.jsx)(Sl, {}), J("Reset", "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15")],
                        }),
                        (0, nt.jsx)("button", {
                          disabled: A !== "ready",
                          "aria-label": J("Zoom in", "\u0E0B\u0E39\u0E21\u0E40\u0E02\u0E49\u0E32"),
                          onClick: () => _e((D) => D.zoom(0.82)),
                          children: (0, nt.jsx)(ws, {}),
                        }),
                      ],
                    }),
                    (0, nt.jsxs)("div", {
                      className: "scene-control-group",
                      children: [
                        (0, nt.jsxs)("button", {
                          disabled: A !== "ready",
                          "aria-pressed": !G,
                          onClick: () => {
                            (B(!1), _e((D) => D.mode(!1)));
                          },
                          children: [(0, nt.jsx)(Q0, {}), J("Rotate", "\u0E2B\u0E21\u0E38\u0E19")],
                        }),
                        (0, nt.jsxs)("button", {
                          disabled: A !== "ready",
                          "aria-pressed": G,
                          onClick: () => {
                            (B(!0), _e((D) => D.mode(!0)));
                          },
                          children: [(0, nt.jsx)(X0, {}), J("Move", "\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19")],
                        }),
                      ],
                    }),
                    (0, nt.jsxs)("div", {
                      className: "scene-control-group",
                      children: [
                        (0, nt.jsx)("button", {
                          disabled: A !== "ready",
                          title: J(
                            "Top view",
                            "\u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19",
                          ),
                          "aria-label": J(
                            "Top view",
                            "\u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19",
                          ),
                          onClick: () => _e((D) => D.top()),
                          children: (0, nt.jsx)(Ph, {}),
                        }),
                        (0, nt.jsx)("button", {
                          disabled: A !== "ready",
                          title: J(
                            "Raise camera angle",
                            "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E21\u0E38\u0E21\u0E01\u0E25\u0E49\u0E2D\u0E07",
                          ),
                          "aria-label": J(
                            "Raise camera angle",
                            "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E21\u0E38\u0E21\u0E01\u0E25\u0E49\u0E2D\u0E07",
                          ),
                          onClick: () => _e((D) => D.tilt(-0.15)),
                          children: (0, nt.jsx)(K0, {}),
                        }),
                        (a ? i : o) &&
                          (0, nt.jsx)("button", {
                            disabled: A !== "ready",
                            title: J(
                              "Focus selected place",
                              "\u0E14\u0E39\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01",
                            ),
                            "aria-label": J(
                              "Focus selected place",
                              "\u0E14\u0E39\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01",
                            ),
                            onClick: () => _e((D) => D.focus(a ? i : o, a)),
                            children: (0, nt.jsx)(od, {}),
                          }),
                        (0, nt.jsxs)("button", {
                          disabled: A !== "ready" || l,
                          "aria-pressed": q,
                          onClick: () => {
                            let D = !q;
                            (W(D), f.current?.tour(D));
                          },
                          children: [
                            (0, nt.jsx)(Y0, {}),
                            J("Tour", "\u0E0A\u0E21\u0E23\u0E2D\u0E1A\u0E22\u0E48\u0E32\u0E19"),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, nt.jsx)("p", {
              id: "scene-help",
              className: "scene-help",
              children: t.placement
                ? t.placement.kind === "add"
                  ? J("Tap the map where the new place is", "แตะแผนที่ตรงตำแหน่งสถานที่ใหม่")
                  : J("Drag the pin, or tap where it should go", "ลากหมุด หรือแตะจุดที่ต้องการ")
                : t.editing && !a
                  ? J("Tap a pin to edit it \xB7 Drag a selected pin to move it", "แตะหมุดเพื่อแก้ไข \xB7 ลากหมุดที่เลือกเพื่อย้าย")
              : l
                ? J(
                    "Tap the ground to place the selected object",
                    "\u0E41\u0E15\u0E30\u0E1E\u0E37\u0E49\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E07\u0E27\u0E31\u0E15\u0E16\u0E38\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01",
                  )
                : a
                  ? J(
                      "Tap a structure to edit \xB7 Drag to rotate",
                      "\u0E41\u0E15\u0E30\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49\u0E44\u0E02 \xB7 \u0E25\u0E32\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2B\u0E21\u0E38\u0E19",
                    )
                  : G
                    ? J(
                        "Drag to move \xB7 Two fingers to zoom",
                        "\u0E25\u0E32\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19 \xB7 \u0E2A\u0E2D\u0E07\u0E19\u0E34\u0E49\u0E27\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E0B\u0E39\u0E21",
                      )
                    : J(
                        "Drag to rotate \xB7 Two fingers to move & zoom",
                        "\u0E25\u0E32\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2B\u0E21\u0E38\u0E19 \xB7 \u0E2A\u0E2D\u0E07\u0E19\u0E34\u0E49\u0E27\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E41\u0E25\u0E30\u0E0B\u0E39\u0E21",
                      ),
            }),
          ],
        }),
        a &&
          (C.outside > 0 || C.blocked > 0) &&
          (0, nt.jsxs)("p", {
            className: "scene-editor-warning",
            children: [
              C.outside,
              " ",
              J(
                "objects outside the coverage are kept in your list and hidden here.",
                "\u0E27\u0E31\u0E15\u0E16\u0E38\u0E19\u0E2D\u0E01\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u0E41\u0E15\u0E48\u0E44\u0E21\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48",
              ),
              " ",
              C.blocked > 0 &&
                J(
                  `${C.blocked} walking segments are blocked by your structures and excluded from directions. Move those models to keep the lanes open.`,
                  `${C.blocked} \u0E0A\u0E48\u0E27\u0E07\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E16\u0E39\u0E01\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E1A\u0E31\u0E07 \u0E08\u0E36\u0E07\u0E44\u0E21\u0E48\u0E19\u0E33\u0E21\u0E32\u0E43\u0E0A\u0E49\u0E1A\u0E2D\u0E01\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07 \u0E42\u0E1B\u0E23\u0E14\u0E22\u0E49\u0E32\u0E22\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E17\u0E32\u0E07`,
                ),
            ],
          }),
      ],
    });
  }
  R();
  var ha = we(mt(), 1);
  cp();
  R();
  cp();
  ru();
  var Ws = {
    minX: jd.minX - 2,
    minZ: jd.minZ - 2,
    width: jd.maxX - jd.minX + 4,
    height: jd.maxZ - jd.minZ + 4,
  };
  function cc(t) {
    return { x: (t.x - Ws.minX) / Ws.width, y: (t.z - Ws.minZ) / Ws.height };
  }
  function gU(t, e) {
    if (!Number.isFinite(t.x) || !Number.isFinite(t.y) || t.x < 0 || t.x > 1 || t.y < 0 || t.y > 1)
      return null;
    let n = { x: Ws.minX + t.x * Ws.width, z: Ws.minZ + t.y * Ws.height };
    return Ir(n, e.boundary) ? $1(n) : null;
  }
  function hE(t, e, n = Date.now()) {
    if (!Wo(t, n) || !e) return null;
    let a = Rr(t);
    return Ir(a, e.boundary) ? { ...a, radius: t.accuracy / Xd, approximate: t.accuracy > 100 } : null;
  }
  R();
  function jee(t, e, n = 6) {
    return t.x < e.x + e.w + n && t.x + t.w + n > e.x && t.y < e.y + e.h + n && t.y + t.h + n > e.y;
  }
  function xU(t, e, n, a = []) {
    let i = a.slice(),
      r = new Map();
    for (let o of [...t].sort((s, l) => l.priority - s.priority || s.id.localeCompare(l.id)))
      for (let s of o.positions) {
        let l = [
          { x: 0, y: 0 },
          { x: 0, y: -o.h - 10 },
          { x: 0, y: o.h + 10 },
        ];
        if (
          (o.priority >= 85 &&
            l.push(
              { x: 0, y: -2 * (o.h + 10) },
              { x: 0, y: 2 * (o.h + 10) },
              { x: -o.w * 0.7, y: 0 },
              { x: o.w * 0.7, y: 0 },
            ),
          o.priority >= 100)
        )
          for (let u of [-o.w, o.w]) for (let d of [0, -o.h - 10, o.h + 10]) l.push({ x: u, y: d });
        let c = !1;
        for (let u of l) {
          let d = { x: s.x - o.w / 2 + u.x, y: s.y - o.h / 2 + u.y, w: o.w, h: o.h };
          if (
            !(d.x < 12 || d.y < 14 || d.x + d.w > e - 12 || d.y + d.h > n - 14) &&
            !i.some((f) => jee(f, d))
          ) {
            (r.set(o.id, d), i.push(d), (c = !0));
            break;
          }
        }
        if (c) break;
      }
    return r;
  }
  var bt = we(pt(), 1),
    { width: yU, height: vU, minX: qee, minZ: Wee } = Ws,
    Im = (t) => t.map((e) => e.join(",")).join(" ");
  function pE({
    location: t,
    places: e,
    selectedId: n,
    lang: a,
    centerRequest: i,
    placing: r,
    onSelect: o,
    onPlaceCoordinates: s,
  }) {
    let l = (0, ha.useRef)(null),
      c = (0, ha.useRef)(null),
      u = (0, ha.useRef)(new Map()),
      [d, f] = (0, ha.useState)(null),
      [h, m] = (0, ha.useState)(!1),
      [v, g] = (0, ha.useState)(!1),
      [p, y] = (0, ha.useState)({ width: 0, height: 0 }),
      [w, _] = (0, ha.useState)(new Map()),
      T = K1(l, c, yU / vU),
      b = (0, ha.useRef)({ location: t, data: d, gestures: T });
    b.current = { location: t, data: d, gestures: T };
    let S = (A, N) => (a === "en" ? A : N);
    ((0, ha.useEffect)(() => {
      let A = !0;
      return (
        Q1()
          .then((N) => {
            A && f(N);
          })
          .catch(() => {
            A && m(!0);
          }),
        () => {
          A = !1;
        }
      );
    }, []),
      (0, ha.useEffect)(() => {
        let A = c.current;
        if (!A) return;
        let N = new ResizeObserver(() => y({ width: A.clientWidth, height: A.clientHeight }));
        return (N.observe(A), () => N.disconnect());
      }, []));
    let x = t.usableFix,
      M = hE(x, d),
      C = !!M,
      I = (0, ha.useMemo)(
        () =>
          d
            ? e.filter(
                (A) => A.lat !== null && A.lng !== null && Ir(Rr({ lat: A.lat, lng: A.lng }), d.boundary),
              )
            : [],
        [e, d],
      );
    function O() {
      let { location: A, data: N, gestures: G } = b.current,
        B = A.usableFix;
      if (!B || !N) return;
      let q = hE(B, N);
      q && G.centerAt(cc(q), 2.5);
    }
    ((0, ha.useEffect)(() => {
      i && d && O();
    }, [i, d]),
      (0, ha.useEffect)(() => {
        v && C && O();
      }, [x, v, C]),
      (0, ha.useEffect)(() => {
        let A = l.current;
        if (!A) return;
        let N = () => g(!1);
        return (
          A.addEventListener("pointerdown", N),
          A.addEventListener("wheel", N),
          () => {
            (A.removeEventListener("pointerdown", N), A.removeEventListener("wheel", N));
          }
        );
      }, []),
      (0, ha.useLayoutEffect)(() => {
        if (!d || !p.width) return;
        let A = I.map((B) => {
          let q = cc(Rr({ lat: B.lat, lng: B.lng }));
          return { x: q.x * p.width - 22, y: q.y * p.height - 22, w: 44, h: 44 };
        });
        if (M && C) {
          let B = cc(M);
          A.push({ x: B.x * p.width - 22, y: B.y * p.height - 22, w: 44, h: 44 });
        }
        let N = [];
        for (let B of d.labels) {
          let q = u.current.get(B.id);
          q &&
            ((q.hidden = !1),
            (q.style.visibility = "hidden"),
            !(r || T.zoom < B.minZoom) &&
              N.push({
                id: B.id,
                priority: B.priority,
                w: q.offsetWidth,
                h: q.offsetHeight,
                positions: B.anchors.map(([W, j]) => {
                  let re = cc({ x: W, z: j });
                  return { x: re.x * p.width, y: re.y * p.height, z: 0 };
                }),
              }));
        }
        let G = xU(N, p.width, p.height, A);
        for (let B of d.labels) {
          let q = u.current.get(B.id);
          q && ((q.hidden = !G.has(B.id)), (q.style.visibility = ""));
        }
        _(G);
      }, [d, p, a, T.zoom, I, x, r, C]));
    let k = p.width
      ? dp(
          I.map((A) => {
            let N = cc(Rr({ lat: A.lat, lng: A.lng }));
            return { id: A.id, x: N.x * p.width, y: N.y * p.height };
          }),
          { minDistance: 46 },
        )
      : new Map();
    return (0, bt.jsxs)("section", {
      className: "talat-navigation",
      "aria-label": S(
        "Talat Noi geographic navigation",
        "\u0E41\u0E1C\u0E07\u0E19\u0E33\u0E17\u0E32\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E08\u0E23\u0E34\u0E07\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22",
      ),
      children: [
        (0, bt.jsx)("p", {
          className: "navigation-intro",
          children: S(
            "Real coordinates for finding your way. The illustrated map stays in place behind this panel.",
            "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E08\u0E23\u0E34\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E19\u0E33\u0E17\u0E32\u0E07 \u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E20\u0E32\u0E1E\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E14\u0E49\u0E32\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E19\u0E35\u0E49",
          ),
        }),
        (0, bt.jsxs)("div", {
          className: "navigation-map-actions",
          children: [
            (0, bt.jsxs)("button", {
              onClick: t.start,
              disabled: t.fresh || t.phase === "locating",
              children: [
                (0, bt.jsx)(na, {}),
                t.fresh
                  ? S("Tracking", "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21")
                  : S(
                      "My Location",
                      "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19",
                    ),
              ],
            }),
            C &&
              (0, bt.jsxs)(bt.Fragment, {
                children: [
                  (0, bt.jsxs)("button", {
                    onClick: O,
                    children: [
                      (0, bt.jsx)(od, {}),
                      S(
                        "Center on me",
                        "\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E21\u0E32\u0E17\u0E35\u0E48\u0E09\u0E31\u0E19",
                      ),
                    ],
                  }),
                  (0, bt.jsxs)("label", {
                    children: [
                      (0, bt.jsx)("input", {
                        type: "checkbox",
                        checked: v,
                        onChange: (A) => g(A.target.checked),
                      }),
                      S("Follow", "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21"),
                    ],
                  }),
                ],
              }),
            t.enabled &&
              (0, bt.jsx)("button", {
                onClick: () => {
                  (t.stop(), g(!1));
                },
                children: S("Stop", "\u0E2B\u0E22\u0E38\u0E14"),
              }),
          ],
        }),
        r &&
          (0, bt.jsx)("p", {
            className: "navigation-placement",
            role: "status",
            children: S(
              "Tap inside the dashed Talat Noi boundary to set the selected coordinates. The illustrated position will stay unchanged.",
              "\u0E41\u0E15\u0E30\u0E43\u0E19\u0E40\u0E2A\u0E49\u0E19\u0E1B\u0E23\u0E30\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E15\u0E31\u0E49\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14 \u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E43\u0E19\u0E20\u0E32\u0E1E\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19",
            ),
          }),
        (0, bt.jsxs)("div", {
          ref: l,
          className: "navigation-map-viewport",
          tabIndex: 0,
          role: "region",
          "aria-label": S(
            "Drag to move, pinch to zoom. Arrow keys pan, plus and minus zoom, Home fits.",
            "\u0E25\u0E32\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19 \u0E08\u0E35\u0E1A\u0E19\u0E34\u0E49\u0E27\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E0B\u0E39\u0E21 \u0E25\u0E39\u0E01\u0E28\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19 \u0E1A\u0E27\u0E01\u0E41\u0E25\u0E30\u0E25\u0E1A\u0E0B\u0E39\u0E21 Home \u0E14\u0E39\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
          ),
          children: [
            (0, bt.jsx)("div", {
              ref: c,
              className: `navigation-map-canvas ${T.zoom >= 1.8 ? "show-pin-labels" : ""}`,
              onClick: (A) => {
                if (!r || !d || !c.current) return;
                let N = c.current.getBoundingClientRect(),
                  G = gU({ x: (A.clientX - N.left) / N.width, y: (A.clientY - N.top) / N.height }, d);
                G && s(G);
              },
              children:
                d &&
                (0, bt.jsxs)(bt.Fragment, {
                  children: [
                    (0, bt.jsxs)("svg", {
                      viewBox: `${qee} ${Wee} ${yU} ${vU}`,
                      width: "100%",
                      height: "100%",
                      "aria-hidden": "true",
                      children: [
                        (0, bt.jsx)("defs", {
                          children: (0, bt.jsx)("clipPath", {
                            id: "talat-navigation-boundary",
                            children: (0, bt.jsx)("polygon", { points: Im(d.boundary) }),
                          }),
                        }),
                        (0, bt.jsxs)("g", {
                          clipPath: "url(#talat-navigation-boundary)",
                          children: [
                            (0, bt.jsx)("polygon", { points: Im(d.boundary), fill: "#eee9da" }),
                            d.water.map((A, N) =>
                              (0, bt.jsx)(
                                "path",
                                {
                                  d: [A.polygon, ...A.holes]
                                    .map((G) => `M${G.map((B) => B.join(",")).join("L")}Z`)
                                    .join(""),
                                  fill: A.kind === "river" ? "#357798" : "#54a6ad",
                                  fillRule: "evenodd",
                                },
                                `${A.id}-${N}`,
                              ),
                            ),
                            d.green.map((A) =>
                              (0, bt.jsx)("polygon", { points: Im(A.polygon), fill: "#afc699" }, A.id),
                            ),
                            d.buildings.map((A) =>
                              (0, bt.jsx)(
                                "polygon",
                                {
                                  points: Im(A.polygon),
                                  fill: "#d5c9b3",
                                  stroke: "#b6a991",
                                  strokeWidth: ".04",
                                },
                                A.id,
                              ),
                            ),
                            d.roads.map((A) =>
                              A.segments.map((N, G) =>
                                (0, bt.jsx)(
                                  "polyline",
                                  {
                                    points: Im(N),
                                    fill: "none",
                                    stroke: A.kind === "footway" || A.kind === "path" ? "#f6f2dc" : "#fffbee",
                                    strokeWidth: A.width / 10,
                                    strokeLinejoin: "round",
                                  },
                                  `${A.id}-${G}`,
                                ),
                              ),
                            ),
                          ],
                        }),
                        (0, bt.jsx)("polygon", {
                          points: Im(d.boundary),
                          fill: "none",
                          stroke: "#387f75",
                          strokeWidth: ".25",
                          strokeDasharray: "1,.75",
                        }),
                        C &&
                          M &&
                          x &&
                          (0, bt.jsx)("circle", {
                            cx: M.x,
                            cy: M.z,
                            r: M.radius,
                            fill: "#2188ec",
                            fillOpacity: ".15",
                            stroke: "#2188ec",
                            strokeWidth: ".12",
                          }),
                      ],
                    }),
                    (0, bt.jsx)("div", {
                      className: "geographic-labels",
                      "aria-hidden": "true",
                      children: d.labels.map((A) => {
                        let N = w.get(A.id);
                        return (0, bt.jsxs)(
                          "span",
                          {
                            ref: (G) => {
                              G ? u.current.set(A.id, G) : u.current.delete(A.id);
                            },
                            hidden: !N,
                            style: N ? { left: N.x, top: N.y } : void 0,
                            className: `geographic-label label-${A.kind} ${A.en === "Talat Noi" ? "talat-label" : ""}`,
                            children: [
                              (0, bt.jsx)("strong", { children: a === "th" && A.th ? A.th : A.en }),
                              A.th && A.en && (0, bt.jsx)("small", { children: a === "th" ? A.en : A.th }),
                            ],
                          },
                          A.id,
                        );
                      }),
                    }),
                    !r &&
                      I.map((A) => {
                        let N = cc(Rr({ lat: A.lat, lng: A.lng })),
                          G = k.get(A.id) ?? { dx: 0, dy: 0 },
                          B = fp(G);
                        return (0, bt.jsx)(
                          "button",
                          {
                            className: `navigation-map-pin has-pin ${A.id === n ? "selected" : ""} ${G.dx || G.dy ? "moved" : ""} ${N.y < 0.3 ? "flip" : ""}`,
                            style: {
                              left: `calc(${N.x * 100}% + ${G.dx}px)`,
                              top: `calc(${N.y * 100}% + ${G.dy}px)`,
                              "--leader": `${B.length}px`,
                              "--leader-angle": `${B.angle}deg`,
                            },
                            "aria-label": mp(A, a),
                            onClick: (q) => {
                              (q.stopPropagation(), o(A.id));
                            },
                            children: (0, bt.jsx)(Zd, { place: A, lang: a }),
                          },
                          A.id,
                        );
                      }),
                    C &&
                      M &&
                      !r &&
                      (0, bt.jsx)("button", {
                        className: `live-position-dot ${x.accuracy > 100 ? "approximate" : ""}`,
                        style: { left: `${cc(M).x * 100}%`, top: `${cc(M).y * 100}%` },
                        "aria-label": S(
                          "My position, tap to center",
                          "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19 \u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E21\u0E32\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48",
                        ),
                        onClick: (A) => {
                          (A.stopPropagation(), O());
                        },
                        children: (0, bt.jsx)("span", {}),
                      }),
                  ],
                }),
            }),
            !d &&
              (0, bt.jsx)("p", {
                className: "navigation-map-status",
                role: "status",
                children: h
                  ? S(
                      "Navigation map could not load. Place cards and walking links still work.",
                      "\u0E42\u0E2B\u0E25\u0E14\u0E41\u0E1C\u0E07\u0E19\u0E33\u0E17\u0E32\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E22\u0E31\u0E07\u0E14\u0E39\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E41\u0E25\u0E30\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E44\u0E14\u0E49",
                    )
                  : S(
                      "Opening Talat Noi navigation\u2026",
                      "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E07\u0E19\u0E33\u0E17\u0E32\u0E07\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22\u2026",
                    ),
              }),
          ],
        }),
        (0, bt.jsxs)("div", {
          className: "navigation-map-tools",
          children: [
            (0, bt.jsx)("span", {
              children: S(
                "Talat Noi only \xB7 drag & pinch",
                "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22 \xB7 \u0E25\u0E32\u0E01\u0E41\u0E25\u0E30\u0E08\u0E35\u0E1A\u0E19\u0E34\u0E49\u0E27",
              ),
            }),
            (0, bt.jsx)("button", {
              "aria-label": S("Zoom out", "\u0E0B\u0E39\u0E21\u0E2D\u0E2D\u0E01"),
              onClick: () => T.zoomBy(-0.35),
              disabled: T.zoom <= 1,
              children: (0, bt.jsx)(bl, {}),
            }),
            (0, bt.jsx)("button", {
              "aria-label": S(
                "Fit Talat Noi",
                "\u0E14\u0E39\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
              ),
              onClick: () => {
                (g(!1), T.reset());
              },
              children: (0, bt.jsx)(Sl, {}),
            }),
            (0, bt.jsx)("button", {
              "aria-label": S("Zoom in", "\u0E0B\u0E39\u0E21\u0E40\u0E02\u0E49\u0E32"),
              onClick: () => T.zoomBy(0.35),
              disabled: T.zoom >= T.maxZoom,
              children: (0, bt.jsx)(ws, {}),
            }),
          ],
        }),
        x &&
          (0, bt.jsx)("p", {
            className: "scene-location-message",
            role: "status",
            children: C
              ? S(
                  `Accuracy \xB1${Math.round(x.accuracy)} m${x.accuracy > 100 ? " \xB7 Approximate; wait for a better signal" : ""}`,
                  `\u0E04\u0E27\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33 \xB1${Math.round(x.accuracy)} \u0E21.${x.accuracy > 100 ? " \xB7 \u0E42\u0E14\u0E22\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 \u0E23\u0E2D\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13\u0E17\u0E35\u0E48\u0E14\u0E35\u0E02\u0E36\u0E49\u0E19" : ""}`,
                )
              : S(
                  "Your position is outside the mapped Talat Noi boundary. Walking directions still work; your location is not moved into the illustration.",
                  "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E19\u0E2D\u0E01\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22 \u0E22\u0E31\u0E07\u0E43\u0E0A\u0E49\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E44\u0E14\u0E49 \u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E22\u0E49\u0E32\u0E22\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32\u0E44\u0E1B\u0E43\u0E19\u0E20\u0E32\u0E1E\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A",
                ),
          }),
        (0, bt.jsx)("p", {
          className: "navigation-map-missing",
          children: S(
            "Dashed line: mapped Talat Noi boundary. Places without coordinates or outside it remain available in the place list. Location is private on this device.",
            "\u0E40\u0E2A\u0E49\u0E19\u0E1B\u0E23\u0E30\u0E04\u0E37\u0E2D\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48 \u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E22\u0E39\u0E48\u0E19\u0E2D\u0E01\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E22\u0E31\u0E07\u0E14\u0E39\u0E44\u0E14\u0E49\u0E43\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27\u0E1A\u0E19\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E19\u0E35\u0E49",
          ),
        }),
        (0, bt.jsxs)("div", {
          className: "geography-attribution",
          children: [
            (0, bt.jsx)("a", {
              href: "https://www.openstreetmap.org/copyright",
              target: "_blank",
              rel: "noopener noreferrer",
              children: "\xA9 OpenStreetMap contributors \xB7 ODbL",
            }),
            (0, bt.jsx)("a", {
              href: "data/talat-noi-osm.json",
              download: !0,
              children: S(
                "Talat Noi map data",
                "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E15\u0E25\u0E32\u0E14\u0E19\u0E49\u0E2D\u0E22",
              ),
            }),
          ],
        }),
      ],
    });
  }
  R();
  var _U = we(mt(), 1);
  qd();
  R();
  zw();
  var Sn = we(pt(), 1);
  function bU({ structure: t }) {
    let e = cv(t);
    return e
      ? (0, Sn.jsxs)("aside", {
          className: "architecture-reference",
          children: [
            (0, Sn.jsx)("span", { className: "eyebrow", children: "PHOTO-BASED ARCHITECTURE REFERENCE" }),
            (0, Sn.jsx)("strong", { children: e.nameEn }),
            (0, Sn.jsx)("span", { lang: "th", children: e.nameTh }),
            e.photo &&
              (0, Sn.jsx)("img", {
                src: e.photo,
                alt: `Architectural reference: ${e.nameEn}`,
                loading: "lazy",
              }),
            (0, Sn.jsx)("p", { children: e.visible }),
            (0, Sn.jsxs)("p", {
              children: [
                (0, Sn.jsx)("b", { children: "Illustrated identity / placement: approximate." }),
                " ",
                e.approximate,
              ],
            }),
            (0, Sn.jsxs)("small", { children: [e.address, " \xB7 References checked ", J6] }),
            (0, Sn.jsxs)("div", {
              className: "reference-links",
              children: [
                (0, Sn.jsx)("a", {
                  href: e.photoSource,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  children: "Photo & credit",
                }),
                (0, Sn.jsx)("a", {
                  href: e.source,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  children: "Name / location source",
                }),
                e.mapsUrl &&
                  (0, Sn.jsx)("a", {
                    href: e.mapsUrl,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    children: "Maps listing",
                  }),
              ],
            }),
            e.photoCredit &&
              (0, Sn.jsxs)("small", {
                children: [
                  e.photoCredit,
                  " \xB7 Image resized to fit. ",
                  (0, Sn.jsx)("a", {
                    href: `https://creativecommons.org/licenses/by-sa/${e.photoCredit.includes("3.0") ? "3.0" : "4.0"}/`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    children: "License",
                  }),
                ],
              }),
          ],
        })
      : (0, Sn.jsx)("p", {
          className: "muted",
          children:
            "Illustrated structure \xB7 identity unverified. Materials and concealed sides are artistic approximations.",
        });
  }
  function SU({ lang: t }) {
    let e = t === "th";
    return (0, Sn.jsxs)("details", {
      className: "geographic-notes architecture-notes",
      children: [
        (0, Sn.jsx)("summary", {
          children: e
            ? "\u0E2A\u0E16\u0E32\u0E1B\u0E31\u0E15\u0E22\u0E01\u0E23\u0E23\u0E21\u0E41\u0E25\u0E30\u0E20\u0E32\u0E1E\u0E40\u0E1B\u0E23\u0E35\u0E22\u0E1A\u0E40\u0E17\u0E35\u0E22\u0E1A"
            : "Architecture references & comparison",
        }),
        (0, Sn.jsx)("p", {
          children: e
            ? "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E2A\u0E16\u0E32\u0E1B\u0E31\u0E15\u0E22\u0E01\u0E23\u0E23\u0E21\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E1E\u0E16\u0E48\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E08\u0E23\u0E34\u0E07 \u0E41\u0E15\u0E48\u0E15\u0E31\u0E27\u0E15\u0E19 \u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E43\u0E19\u0E20\u0E32\u0E1E \u0E41\u0E25\u0E30\u0E02\u0E19\u0E32\u0E14\u0E02\u0E2D\u0E07\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E22\u0E31\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 \u0E2D\u0E32\u0E04\u0E32\u0E23 \u0E16\u0E19\u0E19 \u0E41\u0E21\u0E48\u0E19\u0E49\u0E33 \u0E41\u0E25\u0E30\u0E2B\u0E21\u0E38\u0E14\u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E09\u0E32\u0E01\u0E20\u0E32\u0E1E\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E40\u0E14\u0E34\u0E21"
            : "Architectural details use real landmark photographs. Illustrated identities, positions and model dimensions remain approximate. Models stay within the original scene, independently of place pins and navigation coordinates.",
        }),
        (0, Sn.jsxs)("div", {
          className: "reference-links",
          children: [
            (0, Sn.jsx)("a", {
              href: "assets/talat-noi-architecture-comparison.webp",
              target: "_blank",
              children: e
                ? "\u0E20\u0E32\u0E1E\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A / 3 \u0E21\u0E34\u0E15\u0E34\u0E01\u0E48\u0E2D\u0E19 / 3 \u0E21\u0E34\u0E15\u0E34\u0E2B\u0E25\u0E31\u0E07"
                : "Illustration / previous 3D / updated 3D",
            }),
            (0, Sn.jsx)("a", {
              href: "assets/talat-noi-architecture-rotated.webp",
              target: "_blank",
              children: e
                ? "\u0E21\u0E38\u0E21\u0E2B\u0E21\u0E38\u0E19 3 \u0E21\u0E34\u0E15\u0E34"
                : "Rotated 3D view",
            }),
            (0, Sn.jsx)("a", {
              href: "assets/talat-noi-architecture-details.webp",
              target: "_blank",
              children: e
                ? "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E2D\u0E32\u0E04\u0E32\u0E23"
                : "Architectural close-ups",
            }),
          ],
        }),
        (0, Sn.jsx)("ul", {
          children: cE.map((n) =>
            (0, Sn.jsxs)(
              "li",
              {
                children: [
                  (0, Sn.jsx)("a", {
                    href: n.source,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    children: e ? n.nameTh : n.nameEn,
                  }),
                  (0, Sn.jsx)("small", {
                    children: e
                      ? "\u0E41\u0E1A\u0E1A\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E2A\u0E16\u0E32\u0E1B\u0E31\u0E15\u0E22\u0E01\u0E23\u0E23\u0E21 \xB7 \u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E43\u0E19\u0E20\u0E32\u0E1E\u0E42\u0E14\u0E22\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13"
                      : `${n.correspondence} \xB7 illustrated placement approximate`,
                  }),
                ],
              },
              n.profile,
            ),
          ),
        }),
        (0, Sn.jsx)("p", {
          className: "muted",
          children: e
            ? "\u0E20\u0E32\u0E1E\u0E2A\u0E16\u0E32\u0E1B\u0E31\u0E15\u0E22\u0E01\u0E23\u0E23\u0E21\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49\u0E41\u0E2A\u0E14\u0E07\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E09\u0E32\u0E01\u0E40\u0E14\u0E34\u0E21 \u0E14\u0E39\u0E20\u0E32\u0E1E\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E31\u0E1A\u0E15\u0E32\u0E21\u0E16\u0E19\u0E19\u0E43\u0E19\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E41\u0E25\u0E30\u0E08\u0E38\u0E14\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E27\u0E08 \u0E20\u0E32\u0E1E\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E40\u0E23\u0E19\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E08\u0E32\u0E01\u0E0A\u0E34\u0E49\u0E19\u0E07\u0E32\u0E19\u0E08\u0E23\u0E34\u0E07\u0E14\u0E49\u0E27\u0E22\u0E0B\u0E2D\u0E1F\u0E15\u0E4C\u0E41\u0E27\u0E23\u0E4C \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E20\u0E32\u0E1E\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C"
            : "These architecture comparisons document the previous illustrated arrangement. Current street-aligned views and approximate model placements are in References & field checks. All comparisons render actual geometry in software, not browser screenshots.",
        }),
      ],
    });
  }
  var ft = we(pt(), 1);
  function wU({ structures: t, selectedId: e, onSelect: n }) {
    let [a, i] = (0, _U.useState)(""),
      r = t.filter((o) => `${o.label} ${eS[o.kind]}`.toLowerCase().includes(a.toLowerCase()));
    return (0, ft.jsxs)("div", {
      className: "structure-list-panel",
      children: [
        (0, ft.jsx)("p", {
          className: "muted",
          children: "Choose a structure here or tap its solid model. Place pins are edited in Places.",
        }),
        (0, ft.jsxs)("label", {
          className: "search-field",
          children: [
            (0, ft.jsx)(Xc, { size: 18 }),
            (0, ft.jsx)("input", {
              "aria-label": "Find a 3D structure",
              placeholder: "Find a structure\u2026",
              value: a,
              onChange: (o) => i(o.target.value),
            }),
          ],
        }),
        (0, ft.jsxs)("div", {
          className: "structure-list",
          children: [
            r.map((o) =>
              (0, ft.jsxs)(
                "button",
                {
                  className: `structure-row ${e === o.id ? "selected" : ""}`,
                  onClick: () => n(o.id),
                  children: [
                    (0, ft.jsx)("span", { className: "structure-row-icon", children: (0, ft.jsx)(td, {}) }),
                    (0, ft.jsxs)("span", {
                      children: [
                        (0, ft.jsx)("strong", { children: o.label }),
                        (0, ft.jsxs)("small", {
                          children: [eS[o.kind], " \xB7 ", o.hidden ? "Hidden" : "Visible"],
                        }),
                      ],
                    }),
                    o.hidden ? (0, ft.jsx)(H0, { size: 17 }) : (0, ft.jsx)(G0, { size: 17 }),
                  ],
                },
                o.id,
              ),
            ),
            !r.length && (0, ft.jsx)("p", { className: "muted", children: "No matching structures." }),
          ],
        }),
      ],
    });
  }
  function MU({ structure: t, onChange: e, onPlace: n, onPlaceGeographic: a, busy: i }) {
    let r = (o, s) => {
      let l = Number(s);
      Number.isFinite(l) && e({ [o]: Math.max(2, Math.min(98, l)) });
    };
    return (0, ft.jsxs)("div", {
      className: "editor-card structure-details",
      children: [
        (0, ft.jsx)("span", { className: "eyebrow", children: "SHARED DRAFT / 3D STRUCTURE" }),
        (0, ft.jsx)("h2", { children: t.label }),
        (0, ft.jsx)(bU, { structure: t }),
        (0, ft.jsxs)("fieldset", {
          disabled: i,
          children: [
            (0, ft.jsxs)("label", {
              className: "field",
              children: [
                (0, ft.jsx)("span", { children: "Working label" }),
                (0, ft.jsx)("input", {
                  value: t.label,
                  maxLength: 100,
                  onChange: (o) => e({ label: o.target.value }),
                }),
              ],
            }),
            (0, ft.jsxs)("label", {
              className: "field",
              children: [
                (0, ft.jsx)("span", { children: "Replace with another shape" }),
                (0, ft.jsx)("select", {
                  value: t.kind,
                  onChange: (o) => e({ kind: o.target.value }),
                  children: w3.map((o) => (0, ft.jsx)("option", { value: o, children: eS[o] }, o)),
                }),
                (0, ft.jsx)("small", {
                  children: "Replacement keeps this object's position, rotation and size.",
                }),
              ],
            }),
            (0, ft.jsxs)("label", {
              className: "field",
              children: [
                (0, ft.jsxs)("span", { children: ["Structure size \xB7 ", t.size, "%"] }),
                (0, ft.jsx)($h, {
                  "aria-label": "Structure size",
                  value: [t.size],
                  min: 30,
                  max: 150,
                  step: 5,
                  onValueChange: ([o]) => e({ size: o }),
                }),
              ],
            }),
            (0, ft.jsxs)("label", {
              className: "field",
              children: [
                (0, ft.jsxs)("span", { children: ["Structure rotation \xB7 ", t.rotation, "\xB0"] }),
                (0, ft.jsx)($h, {
                  "aria-label": "Structure rotation",
                  value: [t.rotation],
                  min: 0,
                  max: 359,
                  step: 1,
                  onValueChange: ([o]) => e({ rotation: o }),
                }),
              ],
            }),
            (0, ft.jsxs)(_t, {
              variant: "outline",
              onClick: n,
              children: [(0, ft.jsx)(na, {}), " Move freely on the 3D map"],
            }),
            (0, ft.jsxs)("div", {
              className: "field-pair",
              children: [
                (0, ft.jsxs)("label", {
                  className: "field",
                  children: [
                    (0, ft.jsx)("span", { children: "Horizontal position %" }),
                    (0, ft.jsx)("input", {
                      type: "number",
                      min: 2,
                      max: 98,
                      step: "any",
                      value: t.x,
                      onChange: (o) => r("x", o.target.value),
                    }),
                  ],
                }),
                (0, ft.jsxs)("label", {
                  className: "field",
                  children: [
                    (0, ft.jsx)("span", { children: "Vertical position %" }),
                    (0, ft.jsx)("input", {
                      type: "number",
                      min: 2,
                      max: 98,
                      step: "any",
                      value: t.y,
                      onChange: (o) => r("y", o.target.value),
                    }),
                  ],
                }),
              ],
            }),
            (0, ft.jsx)("h3", { children: "Location reference \xB7 optional" }),
            (0, ft.jsx)("p", {
              className: "muted",
              children:
                "Keep an optional real coordinate reference for this object. It does not relocate the illustrated model or turn it into a verified reconstruction.",
            }),
            (0, ft.jsxs)(_t, {
              variant: "outline",
              onClick: a,
              children: [(0, ft.jsx)(na, {}), " Choose a location reference"],
            }),
            t.geoPosition &&
              (0, ft.jsxs)(ft.Fragment, {
                children: [
                  (0, ft.jsxs)("div", {
                    className: "field-pair",
                    children: [
                      (0, ft.jsxs)("label", {
                        className: "field",
                        children: [
                          (0, ft.jsx)("span", { children: "Model latitude" }),
                          (0, ft.jsx)("input", {
                            type: "number",
                            step: "any",
                            value: t.geoPosition.lat,
                            onChange: (o) => {
                              let s = Number(o.target.value);
                              Number.isFinite(s) && e({ geoPosition: { ...t.geoPosition, lat: s } });
                            },
                          }),
                        ],
                      }),
                      (0, ft.jsxs)("label", {
                        className: "field",
                        children: [
                          (0, ft.jsx)("span", { children: "Model longitude" }),
                          (0, ft.jsx)("input", {
                            type: "number",
                            step: "any",
                            value: t.geoPosition.lng,
                            onChange: (o) => {
                              let s = Number(o.target.value);
                              Number.isFinite(s) && e({ geoPosition: { ...t.geoPosition, lng: s } });
                            },
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, ft.jsx)(_t, {
                    variant: "outline",
                    onClick: () => e({ geoPosition: null }),
                    children: "Clear location reference",
                  }),
                ],
              }),
            (0, ft.jsxs)("label", {
              className: "structure-hide",
              children: [
                (0, ft.jsx)("input", {
                  type: "checkbox",
                  checked: t.hidden,
                  onChange: (o) => e({ hidden: o.target.checked }),
                }),
                (0, ft.jsxs)("span", {
                  children: [
                    "Hide this structure",
                    (0, ft.jsx)("small", { children: "It stays in your object list, ready to show again." }),
                  ],
                }),
              ],
            }),
            (0, ft.jsx)("p", {
              className: "muted",
              children:
                "Save draft, then Publish to share the arrangement. These visual edits do not change place cards, latitude, longitude or directions.",
            }),
          ],
        }),
      ],
    });
  }
  qd();
  dE();
  Yd();
  lu();
  R();
  var Yee = (t, e) => t.lat !== e.lat || t.lng !== e.lng || t.x !== e.x || t.y !== e.y,
    Zee = [
      "nameEn",
      "nameTh",
      "category",
      "storyEn",
      "storyTh",
      "tipEn",
      "tipTh",
      "location",
      "mapsUrl",
      "price",
      "hours",
      "verification",
      "verificationNotes",
      "source",
      "lastChecked",
      "icon",
      "size",
      "rotation",
    ];
  function TU(t, e) {
    let n = new Map(t.map((r) => [r.id, r])),
      a = new Set(e.map((r) => r.id)),
      i = {
        added: [],
        removed: t.filter((r) => !a.has(r.id)).map((r) => r.nameEn),
        photos: [],
        moved: [],
        edited: [],
        total: 0,
      };
    for (let r of e) {
      let o = n.get(r.id);
      if (!o) {
        i.added.push(r.nameEn);
        continue;
      }
      ((o.photoUrl !== r.photoUrl ||
        o.photoCredit !== r.photoCredit ||
        o.photoAlt !== r.photoAlt ||
        (o.photoCaption ?? "") !== (r.photoCaption ?? "")) &&
        i.photos.push(r.nameEn),
        Yee(o, r) && i.moved.push(r.nameEn),
        Zee.some((s) => o[s] !== r[s]) && i.edited.push(r.nameEn));
    }
    return (
      (i.total = i.added.length + i.removed.length + new Set([...i.photos, ...i.moved, ...i.edited]).size),
      i
    );
  }
  function CU(t) {
    let e = (n, a) => (n ? `${n} ${a}` : "");
    return [
      e(t.added.length, t.added.length === 1 ? "new place" : "new places"),
      e(t.removed.length, t.removed.length === 1 ? "place removed" : "places removed"),
      e(t.photos.length, t.photos.length === 1 ? "photo changed" : "photos changed"),
      e(t.moved.length, t.moved.length === 1 ? "place moved" : "places moved"),
      e(t.edited.length, t.edited.length === 1 ? "place edited" : "places edited"),
    ].filter(Boolean);
  }
  R();
  var LU = we(mt(), 1);
  var Pm = we(pt(), 1);
  function Ys({ place: t, small: e = !1 }) {
    let [n, a] = (0, LU.useState)(""),
      i = !!n && n === t.photoUrl;
    return t.photoUrl && !i
      ? (0, Pm.jsx)("img", {
          className: e ? "stop-photo" : "place-photo",
          src: t.photoUrl,
          alt: t.photoAlt || t.nameEn,
          loading: "lazy",
          onError: () => a(t.photoUrl),
        })
      : (0, Pm.jsxs)("div", {
          className: e ? "stop-photo photo-empty" : "place-photo photo-empty",
          children: [
            (0, Pm.jsx)(j0, { "aria-hidden": "true" }),
            !e && (0, Pm.jsx)("span", { children: i ? "Photo unavailable" : "Photo awaiting verification" }),
          ],
        });
  }
  R();
  var Gr = we(mt(), 1),
    AU = we(hc(), 1);
  Dg();
  R();
  var Kee = (t) => t.verification === "checked" && t.lat !== null && t.lng !== null;
  function Jee(t, e) {
    let n = Math.PI / 180,
      a = (e.lng - t.lng) * n * Math.cos(((t.lat + e.lat) * n) / 2),
      i = (e.lat - t.lat) * n;
    return Math.hypot(a, i) * 6371e3;
  }
  function EU(t, e, n = 3) {
    if (t.lat === null || t.lng === null) return [];
    let a = { lat: t.lat, lng: t.lng };
    return e
      .filter((i) => i.id !== t.id && Kee(i))
      .map((i) => ({ place: i, metres: Math.round(Jee(a, { lat: i.lat, lng: i.lng })) }))
      .sort((i, r) => i.metres - r.metres)
      .slice(0, n);
  }
  var Xe = we(pt(), 1);
  function $ee({ place: t, lang: e, onClose: n }) {
    let a = (0, Gr.useRef)(null),
      i = (r, o) => (e === "en" ? r : o);
    return (
      (0, Gr.useEffect)(() => {
        a.current?.focus();
        let r = (o) => {
          o.key === "Escape" ? (o.stopPropagation(), n()) : o.key === "Tab" && o.preventDefault();
        };
        return (
          window.addEventListener("keydown", r, !0),
          () => window.removeEventListener("keydown", r, !0)
        );
      }, [n]),
      (0, AU.createPortal)(
        (0, Xe.jsxs)("div", {
          className: "photo-viewer",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": i("Full photo", "\u0E20\u0E32\u0E1E\u0E40\u0E15\u0E47\u0E21"),
          onClick: n,
          children: [
            (0, Xe.jsx)("button", {
              ref: a,
              className: "photo-viewer-close",
              "aria-label": i(
                "Close full photo",
                "\u0E1B\u0E34\u0E14\u0E20\u0E32\u0E1E\u0E40\u0E15\u0E47\u0E21",
              ),
              onClick: n,
              children: (0, Xe.jsx)(va, {}),
            }),
            (0, Xe.jsx)("img", {
              src: t.photoUrl,
              alt: t.photoAlt || t.nameEn,
              onClick: (r) => r.stopPropagation(),
            }),
            (0, Xe.jsxs)("p", {
              children: [t.photoCaption || t.photoAlt, t.photoCredit && (0, Xe.jsx)("strong", { children: t.photoCredit })],
            }),
          ],
        }),
        document.body,
      )
    );
  }
  function mE({ place: t, sequence: e, places: n, fix: a, lang: i, onClose: r, onSelect: o }) {
    let s = (b, S) => (i === "en" ? b : S),
      l = (0, Gr.useId)(),
      c = (0, Gr.useRef)(null),
      u = (0, Gr.useRef)(null),
      [d, f] = (0, Gr.useState)(!1),
      [h, m] = (0, Gr.useState)(!1),
      v = i === "en" ? t.nameEn : t.nameTh,
      g = i === "en" ? t.nameTh : t.nameEn,
      p = EU(t, n),
      y = Ns(t);
    ((0, Gr.useEffect)(() => {
      c.current?.focus({ preventScroll: !0 });
    }, []),
      (0, Gr.useEffect)(() => {
        let b = (S) => {
          S.key === "Escape" && r();
        };
        return (window.addEventListener("keydown", b), () => window.removeEventListener("keydown", b));
      }, [r]));
    function w(b) {
      ((u.current = b.clientY), b.currentTarget.setPointerCapture(b.pointerId));
    }
    function _(b) {
      let S = u.current;
      if (((u.current = null), S === null)) return;
      let x = b.clientY - S;
      x > 70 ? (d ? r() : f(!0)) : x < -40 ? f(!1) : Math.abs(x) < 8 && f(!d);
    }
    let T = () => {
      let b = e.findIndex((S) => S.id === t.id);
      o(e[(b + 1) % e.length].id);
    };
    return (0, Xe.jsxs)("aside", {
      className: `place-panel ${d ? "collapsed" : ""}`,
      role: "dialog",
      "aria-modal": "false",
      "aria-labelledby": l,
      children: [
        (0, Xe.jsx)("button", {
          className: "panel-handle",
          "aria-label": d
            ? s(
                "Expand place card",
                "\u0E02\u0E22\u0E32\u0E22\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48",
              )
            : s(
                "Collapse place card",
                "\u0E22\u0E48\u0E2D\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48",
              ),
          "aria-expanded": !d,
          onPointerDown: w,
          onPointerUp: _,
          onClick: (b) => {
            b.detail === 0 && f(!d);
          },
          children: (0, Xe.jsx)("span", {}),
        }),
        (0, Xe.jsx)("button", {
          className: "panel-close",
          "aria-label": s(
            "Close place card",
            "\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48",
          ),
          onClick: r,
          children: (0, Xe.jsx)(va, {}),
        }),
        d &&
          (0, Xe.jsxs)("button", {
            className: "panel-peek",
            onClick: () => f(!1),
            children: [
              (0, Xe.jsx)(Ys, { place: t, small: !0 }),
              (0, Xe.jsxs)("span", {
                children: [
                  (0, Xe.jsx)("strong", { children: v }),
                  (0, Xe.jsx)(Ul, { category: t.category, lang: i }),
                ],
              }),
            ],
          }),
        (0, Xe.jsxs)("div", {
          className: "panel-scroll",
          hidden: d,
          children: [
            (0, Xe.jsx)("div", {
              className: "card-photo",
              children: t.photoUrl
                ? (0, Xe.jsxs)("button", {
                    className: "photo-open",
                    "aria-label": s(
                      "View full photo",
                      "\u0E14\u0E39\u0E20\u0E32\u0E1E\u0E40\u0E15\u0E47\u0E21",
                    ),
                    onClick: () => m(!0),
                    children: [
                      (0, Xe.jsx)(Ys, { place: t }),
                      (0, Xe.jsx)("span", {
                        className: "photo-expand",
                        children: (0, Xe.jsx)(rd, { size: 16 }),
                      }),
                    ],
                  })
                : (0, Xe.jsx)(Ys, { place: t }),
            }),
            t.photoUrl &&
              t.photoCaption &&
              (0, Xe.jsx)("p", { className: "card-photo-caption", children: t.photoCaption }),
            (0, Xe.jsxs)("div", {
              className: "card-body",
              children: [
                (0, Xe.jsx)(Ul, { category: t.category, lang: i }),
                (0, Xe.jsx)("h2", { id: l, ref: c, tabIndex: -1, children: v }),
                g !== v &&
                  (0, Xe.jsx)("p", { className: "card-thai", lang: i === "en" ? "th" : "en", children: g }),
                (0, Xe.jsxs)("div", {
                  className: `verification-note ${t.verification === "checked" ? "checked" : ""}`,
                  children: [
                    (0, Xe.jsx)(tg, { size: 20 }),
                    (0, Xe.jsxs)("div", {
                      children: [
                        (0, Xe.jsx)("strong", {
                          children: y
                            ? s(
                                "Temporary position",
                                "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27",
                              )
                            : t.verification === "checked"
                              ? s(
                                  "Details checked",
                                  "\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E25\u0E49\u0E27",
                                )
                              : s(
                                  "Needs verification",
                                  "\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A",
                                ),
                        }),
                        (0, Xe.jsx)("p", {
                          children: y
                            ? s(
                                "This pin is a placeholder. The exact location, name and details still need confirming.",
                                "\u0E2B\u0E21\u0E38\u0E14\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27 \u0E22\u0E31\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E08\u0E23\u0E34\u0E07 \u0E0A\u0E37\u0E48\u0E2D \u0E41\u0E25\u0E30\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14",
                              )
                            : t.verificationNotes ||
                              s(
                                "Please confirm visiting details locally.",
                                "\u0E42\u0E1B\u0E23\u0E14\u0E2A\u0E2D\u0E1A\u0E16\u0E32\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E22\u0E35\u0E48\u0E22\u0E21\u0E0A\u0E21",
                              ),
                        }),
                      ],
                    }),
                  ],
                }),
                (0, Xe.jsxs)("section", {
                  children: [
                    (0, Xe.jsxs)("h3", {
                      children: [
                        (0, Xe.jsx)(B0, { size: 18 }),
                        s(
                          "A local story",
                          "\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E25\u0E48\u0E32\u0E17\u0E49\u0E2D\u0E07\u0E16\u0E34\u0E48\u0E19",
                        ),
                      ],
                    }),
                    (0, Xe.jsx)("p", {
                      children:
                        (i === "th" ? t.storyTh : t.storyEn) ||
                        t.storyEn ||
                        s(
                          "A local story is being prepared.",
                          "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E25\u0E48\u0E32\u0E17\u0E49\u0E2D\u0E07\u0E16\u0E34\u0E48\u0E19",
                        ),
                    }),
                  ],
                }),
                (0, Xe.jsxs)("section", {
                  className: "tip-box",
                  children: [
                    (0, Xe.jsxs)("h3", {
                      children: [
                        (0, Xe.jsx)(vl, { size: 18 }),
                        s(
                          "Before you visit",
                          "\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E22\u0E35\u0E48\u0E22\u0E21\u0E0A\u0E21",
                        ),
                      ],
                    }),
                    (0, Xe.jsx)("p", {
                      children:
                        (i === "th" ? t.tipTh : t.tipEn) ||
                        t.tipEn ||
                        s(
                          "Visiting tips still need verification.",
                          "\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E22\u0E31\u0E07\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A",
                        ),
                    }),
                  ],
                }),
                (0, Xe.jsxs)("section", {
                  children: [
                    (0, Xe.jsxs)("h3", {
                      children: [
                        (0, Xe.jsx)(Yi, { size: 18 }),
                        s("Find this place", "\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07"),
                      ],
                    }),
                    (0, Xe.jsx)("p", {
                      children:
                        t.location ||
                        s(
                          "Location awaiting verification.",
                          "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A",
                        ),
                    }),
                    !iu(t.mapsUrl) &&
                      t.lat !== null &&
                      t.lng !== null &&
                      (0, Xe.jsxs)(Xe.Fragment, {
                        children: [
                          (0, Xe.jsxs)("p", {
                            className: "coordinates",
                            children: [t.lat.toFixed(5), ", ", t.lng.toFixed(5)],
                          }),
                          (0, Xe.jsx)("p", {
                            className: "muted",
                            children:
                              t.verification === "pending"
                                ? s(
                                    "Draft coordinates. Confirm the exact entrance before travelling.",
                                    "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E09\u0E1A\u0E31\u0E1A\u0E23\u0E48\u0E32\u0E07 \u0E42\u0E1B\u0E23\u0E14\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E17\u0E32\u0E07\u0E40\u0E02\u0E49\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07",
                                  )
                                : s(
                                    "Directions use the saved coordinates; confirm the final entrance.",
                                    "\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E43\u0E0A\u0E49\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u0E42\u0E1B\u0E23\u0E14\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E17\u0E32\u0E07\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22",
                                  ),
                          }),
                        ],
                      }),
                  ],
                }),
                (0, Xe.jsx)(oS, { place: t, fix: a, lang: i }),
                t.verification !== "checked" &&
                  (0, Xe.jsx)("p", {
                    className: "destination-warning",
                    children: y
                      ? s(
                          "Temporary pin: directions lead to a placeholder spot, not the confirmed place.",
                          "\u0E2B\u0E21\u0E38\u0E14\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27: \u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E08\u0E30\u0E1E\u0E32\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E08\u0E38\u0E14\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E35\u0E48\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E41\u0E25\u0E49\u0E27",
                        )
                      : s(
                          "Prototype destination: confirm the pin and entrance before walking.",
                          "\u0E08\u0E38\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E09\u0E1A\u0E31\u0E1A\u0E15\u0E49\u0E19\u0E41\u0E1A\u0E1A: \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E2B\u0E21\u0E38\u0E14\u0E41\u0E25\u0E30\u0E17\u0E32\u0E07\u0E40\u0E02\u0E49\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07",
                        ),
                  }),
                (t.hours || t.price) &&
                  (0, Xe.jsxs)("dl", {
                    className: "practical-grid",
                    children: [
                      t.hours &&
                        (0, Xe.jsxs)("div", {
                          children: [
                            (0, Xe.jsxs)("dt", {
                              children: [
                                (0, Xe.jsx)(z0, { size: 16 }),
                                " ",
                                s("Hours", "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E1B\u0E34\u0E14"),
                              ],
                            }),
                            (0, Xe.jsx)("dd", { children: t.hours }),
                          ],
                        }),
                      t.price &&
                        (0, Xe.jsxs)("div", {
                          children: [
                            (0, Xe.jsx)("dt", { children: s("Price", "\u0E23\u0E32\u0E04\u0E32") }),
                            (0, Xe.jsx)("dd", { children: t.price }),
                          ],
                        }),
                    ],
                  }),
                (0, Xe.jsxs)("div", {
                  className: "last-checked",
                  children: [
                    (0, Xe.jsx)(io, { size: 17 }),
                    (0, Xe.jsxs)("span", {
                      children: [
                        s(
                          "Last checked",
                          "\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
                        ),
                        ": ",
                        (0, Xe.jsx)("strong", { children: EN(t.lastChecked) }),
                      ],
                    }),
                  ],
                }),
                t.source &&
                  (0, Xe.jsxs)("p", {
                    className: "source-note",
                    children: [s("Story source", "\u0E17\u0E35\u0E48\u0E21\u0E32"), ": ", t.source],
                  }),
                t.photoCredit &&
                  (0, Xe.jsxs)("p", {
                    className: "photo-credit",
                    children: [
                      t.photoSource
                        ? (0, Xe.jsx)("a", {
                            href: t.photoSource,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            children: t.photoCredit,
                          })
                        : t.photoCredit,
                      (0, Xe.jsxs)("span", {
                        children: [
                          s(
                            "Photo shown cropped to fit. Tap it to see the whole image.",
                            "\u0E20\u0E32\u0E1E\u0E16\u0E39\u0E01\u0E04\u0E23\u0E2D\u0E1B\u0E43\u0E2B\u0E49\u0E1E\u0E2D\u0E14\u0E35 \u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E20\u0E32\u0E1E\u0E40\u0E15\u0E47\u0E21",
                          ),
                          " ",
                          t.photoCredit.includes("CC BY-SA") &&
                            (0, Xe.jsx)("a", {
                              href: t.photoCredit.includes("3.0")
                                ? "https://creativecommons.org/licenses/by-sa/3.0/"
                                : "https://creativecommons.org/licenses/by-sa/4.0/",
                              target: "_blank",
                              rel: "noopener noreferrer",
                              children: "Image license",
                            }),
                        ],
                      }),
                    ],
                  }),
                p.length > 0 &&
                  (0, Xe.jsxs)("section", {
                    className: "nearby-sequence",
                    children: [
                      (0, Xe.jsx)("h3", {
                        children: s(
                          "Next nearby",
                          "\u0E16\u0E31\u0E14\u0E44\u0E1B\u0E43\u0E01\u0E25\u0E49\u0E40\u0E04\u0E35\u0E22\u0E07",
                        ),
                      }),
                      p.map(({ place: b, metres: S }) =>
                        (0, Xe.jsxs)(
                          "button",
                          {
                            onClick: () => o(b.id),
                            children: [
                              (0, Xe.jsx)(Ys, { place: b, small: !0 }),
                              (0, Xe.jsxs)("span", {
                                children: [
                                  (0, Xe.jsx)("strong", { children: i === "en" ? b.nameEn : b.nameTh }),
                                  (0, Xe.jsxs)("small", { children: [S, " ", s("m away", "\u0E21.")] }),
                                ],
                              }),
                              (0, Xe.jsx)(Ss, { size: 16 }),
                            ],
                          },
                          b.id,
                        ),
                      ),
                    ],
                  }),
                e.length > 1 &&
                  (0, Xe.jsxs)(_t, {
                    className: "next-place",
                    variant: "outline",
                    onClick: T,
                    children: [
                      s(
                        "Discover another story",
                        "\u0E04\u0E49\u0E19\u0E1E\u0E1A\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E25\u0E48\u0E32\u0E16\u0E31\u0E14\u0E44\u0E1B",
                      ),
                      (0, Xe.jsx)(Ss, {}),
                    ],
                  }),
              ],
            }),
          ],
        }),
        !d &&
          (0, Xe.jsxs)("div", {
            className: "panel-actions",
            children: [
              (0, Xe.jsx)(qN, { place: t, fix: a, lang: i }),
              (0, Xe.jsx)(_t, {
                variant: "outline",
                onClick: r,
                children: s(
                  "Back to map",
                  "\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48",
                ),
              }),
            ],
          }),
        h && (0, Xe.jsx)($ee, { place: t, lang: i, onClose: () => m(!1) }),
      ],
    });
  }
  R();
  var dv = we(mt(), 1);
  var Nf = we(pt(), 1);
  function gE({ open: t, title: e, closeLabel: n, onClose: a, children: i }) {
    let r = (0, dv.useRef)(null),
      o = (0, dv.useRef)(null);
    return (
      (0, dv.useEffect)(() => {
        if (!t) return;
        o.current?.focus({ preventScroll: !0 });
        let s = (c) => {
            c.key === "Escape" && a();
          },
          l = (c) => {
            let u = c.target;
            r.current?.contains(u) || u?.closest("[data-slot=select-content],.menu-button") || a();
          };
        return (
          window.addEventListener("keydown", s),
          document.addEventListener("pointerdown", l),
          () => {
            (window.removeEventListener("keydown", s), document.removeEventListener("pointerdown", l));
          }
        );
      }, [t, a]),
      (0, Nf.jsxs)("div", {
        ref: r,
        id: "tour-menu",
        className: "tour-menu",
        role: "dialog",
        "aria-modal": "false",
        "aria-label": e,
        hidden: !t,
        children: [
          (0, Nf.jsxs)("div", {
            className: "tour-menu-head",
            children: [
              (0, Nf.jsx)("strong", { children: e }),
              (0, Nf.jsx)("button", { ref: o, "aria-label": n, onClick: a, children: (0, Nf.jsx)(va, {}) }),
            ],
          }),
          i,
        ],
      })
    );
  }
  R();
  var RU = we(mt(), 1);
  var rt = we(pt(), 1);
  function IU({ places: t, selectedId: e, onOpen: n }) {
    let a = uS(t),
      i = a.filter((o) => !o.place).length,
      r = a.filter((o) => o.place && Ns(o.place)).length;
    return (0, rt.jsxs)("section", {
      className: "photo-queue",
      "aria-label": "Fieldwork photo queue",
      children: [
        (0, rt.jsxs)("p", {
          className: "photo-queue-count",
          children: [
            (0, rt.jsx)("strong", { children: i }),
            " of ",
            a.length,
            " photos still need a place",
            r > 0 &&
              (0, rt.jsxs)(rt.Fragment, {
                children: [" \xB7 ", (0, rt.jsx)("strong", { children: r }), " on temporary pins"],
              }),
          ],
        }),
        (0, rt.jsx)("p", {
          className: "muted",
          children:
            "These photos have no GPS data. Choose a saved place or confirm a point on the map. Filenames and background landmarks are not locations.",
        }),
        (0, rt.jsx)("ul", {
          children: a.map(({ photo: o, place: s }) =>
            (0, rt.jsx)(
              "li",
              {
                children: (0, rt.jsxs)("button", {
                  className: `queue-row ${e === o.id ? "selected" : ""}`,
                  onClick: () => n(o.id),
                  children: [
                    (0, rt.jsx)("img", { src: o.asset, alt: "", loading: "lazy" }),
                    (0, rt.jsxs)("span", {
                      className: "queue-copy",
                      children: [
                        (0, rt.jsx)("small", { children: o.id }),
                        (0, rt.jsx)("strong", { children: o.title }),
                        (0, rt.jsx)(Ul, { category: o.category, lang: "en" }),
                        s
                          ? Ns(s)
                            ? (0, rt.jsx)("span", {
                                className: "review-label",
                                children: "Temporary pin \xB7 set the exact spot",
                              })
                            : (0, rt.jsx)("span", {
                                className: "ready-label",
                                children: s.approved ? `On ${s.nameEn}` : `Draft pin \xB7 ${s.nameEn}`,
                              })
                          : (0, rt.jsx)("span", { className: "review-label", children: o.placementAction }),
                      ],
                    }),
                    (0, rt.jsx)(ad, { size: 18, className: "stop-arrow" }),
                  ],
                }),
              },
              o.id,
            ),
          ),
        }),
      ],
    });
  }
  function PU({
    photo: t,
    place: e,
    places: n,
    stage: a,
    error: i,
    onAttach: r,
    onPlace3D: o,
    onPlaceNavigation: s,
    onOpenPlace: l,
  }) {
    let [c, u] = (0, RU.useState)(t.matchPlaceId ?? ""),
      d = !!a,
      f = n.find((m) => m.id === c),
      h = [...n].sort((m, v) => +(v.id === t.matchPlaceId) - +(m.id === t.matchPlaceId));
    return (0, rt.jsxs)("div", {
      className: "photo-review",
      children: [
        (0, rt.jsxs)("span", { className: "eyebrow", children: ["PHOTO QUEUE / ", t.id] }),
        (0, rt.jsx)("h2", { children: t.title }),
        (0, rt.jsx)("img", { className: "photo-review-image", src: t.asset, alt: t.alt }),
        (0, rt.jsxs)("dl", {
          className: "photo-review-facts",
          children: [
            (0, rt.jsxs)("div", {
              children: [
                (0, rt.jsx)("dt", { children: "Category" }),
                (0, rt.jsx)("dd", { children: (0, rt.jsx)(Ul, { category: t.category, lang: "en" }) }),
              ],
            }),
            (0, rt.jsxs)("div", {
              children: [(0, rt.jsx)("dt", { children: "Credit" }), (0, rt.jsx)("dd", { children: H3 })],
            }),
            (0, rt.jsxs)("div", {
              children: [
                (0, rt.jsx)("dt", { children: "File" }),
                (0, rt.jsx)("dd", { children: t.filename }),
              ],
            }),
            (0, rt.jsxs)("div", {
              children: [
                (0, rt.jsx)("dt", { children: "Next step" }),
                (0, rt.jsx)("dd", { children: t.placementAction }),
              ],
            }),
          ],
        }),
        (0, rt.jsx)("p", { className: "photo-review-note", children: t.note }),
        e
          ? (0, rt.jsxs)("div", {
              className: "photo-review-placed",
              children: [
                (0, rt.jsxs)("p", {
                  children: [
                    "This photo is on ",
                    (0, rt.jsx)("strong", { children: e.nameEn }),
                    e.approved ? "." : ", which is not approved yet.",
                    " To send it back to the queue, open the place and remove the photo.",
                  ],
                }),
                (0, rt.jsx)(_t, { onClick: () => l(e.id), children: "Review this place" }),
              ],
            })
          : (0, rt.jsxs)(rt.Fragment, {
              children: [
                (0, rt.jsxs)("section", {
                  children: [
                    (0, rt.jsx)("h3", { children: "Attach to a saved place" }),
                    (0, rt.jsxs)("label", {
                      className: "field",
                      children: [
                        (0, rt.jsx)("span", { children: "Saved place" }),
                        (0, rt.jsxs)(qh, {
                          value: c,
                          onValueChange: u,
                          children: [
                            (0, rt.jsx)(Yh, {
                              "aria-label": "Saved place",
                              children: (0, rt.jsx)(Wh, { placeholder: "Choose a place" }),
                            }),
                            (0, rt.jsx)(Zh, {
                              children: h.map((m) =>
                                (0, rt.jsxs)(
                                  Kh,
                                  {
                                    value: m.id,
                                    children: [m.nameEn, m.id === t.matchPlaceId ? " (matched)" : ""],
                                  },
                                  m.id,
                                ),
                              ),
                            }),
                          ],
                        }),
                      ],
                    }),
                    f &&
                      (0, rt.jsxs)("p", {
                        className: "muted",
                        children: [
                          "This replaces the current photo on ",
                          f.nameEn,
                          f.category !== t.category
                            ? ` and changes its category from ${f.category} to ${t.category}`
                            : "",
                          ". The place keeps its ID and position.",
                        ],
                      }),
                    (0, rt.jsxs)(_t, {
                      disabled: d || !f,
                      onClick: () => r(c),
                      children: [
                        d ? (0, rt.jsx)(Wi, { className: "photo-upload-spinner" }) : (0, rt.jsx)($0, {}),
                        a === "preparing"
                          ? "Preparing photo\u2026"
                          : a === "uploading"
                            ? "Uploading photo\u2026"
                            : "Attach and review",
                      ],
                    }),
                  ],
                }),
                !t.matchPlaceId &&
                  (0, rt.jsxs)("section", {
                    children: [
                      (0, rt.jsx)("h3", { children: "Or make a new draft pin" }),
                      (0, rt.jsx)("p", {
                        className: "muted",
                        children:
                          "Pick the point you confirmed on site. The pin stays in the draft, hidden from visitors, until you approve it.",
                      }),
                      (0, rt.jsxs)("div", {
                        className: "photo-review-actions",
                        children: [
                          (0, rt.jsxs)(_t, {
                            variant: "outline",
                            disabled: d,
                            onClick: o,
                            // Talat Noi editor: the 3D view was removed; new pins are placed on the illustration.
                            children: [(0, rt.jsx)(Yi, {}), " Place on illustration"],
                          }),
                          (0, rt.jsxs)(_t, {
                            variant: "outline",
                            disabled: d,
                            onClick: s,
                            children: [(0, rt.jsx)(na, {}), " Place on navigation map"],
                          }),
                        ],
                      }),
                    ],
                  }),
              ],
            }),
        i &&
          (0, rt.jsxs)("p", {
            className: "photo-upload-error",
            role: "alert",
            children: [(0, rt.jsx)(Fc, { size: 16 }), " ", i],
          }),
      ],
    });
  }
