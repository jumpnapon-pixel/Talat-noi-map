// "Share map": one public visitor link, offered as the phone's share sheet, a copied link and
// a QR code (preview + printable PNG). Change SHARE_URL when the launch URL is approved; the
// button, copy link and QR all follow it.

const SHARE_URL = "https://claude.ai/artifact/L11qJxFD2DWdfMLXjzZyd4#no_universal_links";
const SHARE_TEXT = {
  title: ["Talat Noi Story Map", "แผนที่เรื่องเล่าตลาดน้อย"],
  text: [
    "Pick a place to visit, check today’s hours, and take Talat Noi one lane at a time.",
    "เลือกจุดที่อยากแวะ เช็กเวลาเปิดวันนี้ แล้วค่อย ๆ เดินเที่ยวตลาดน้อยทีละตรอก",
  ],
  share: ["Share map", "แชร์แผนที่"],
  shareVia: ["Share…", "แชร์ผ่าน…"],
  copy: ["Copy link", "คัดลอกลิงก์"],
  copied: ["Link copied", "คัดลอกลิงก์แล้ว"],
  copyFailed: ["Couldn’t copy. Select the link above and copy it.", "คัดลอกไม่ได้ เลือกลิงก์ด้านบนแล้วคัดลอกเอง"],
  download: ["Download QR", "ดาวน์โหลด QR"],
  scan: ["Scan to open the map", "สแกนเพื่อเปิดแผนที่"],
  close: ["Close", "ปิด"],
  shareFailed: ["Sharing isn’t available here. Copy the link instead.", "แชร์จากที่นี่ไม่ได้ ใช้การคัดลอกลิงก์แทน"],
};
const tShare = (lang, key) => SHARE_TEXT[key][lang === "th" ? 1 : 0];
const readableLink = (url) => url.replace(/^https:\/\//, "").replace(/#.*$/, "");

function qrModules(text) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  return { count, isDark: (row, col) => qr.isDark(row, col) };
}

// Dark modules as one SVG path, with a 4-module white quiet zone.
function QrCode({ text, label }) {
  const { count, isDark } = useMemo(() => qrModules(text), [text]);
  let d = "";
  for (let row = 0; row < count; row++)
    for (let col = 0; col < count; col++) if (isDark(row, col)) d += `M${col + 4} ${row + 4}h1v1h-1z`;
  const size = count + 8;
  return (
    <svg className="share-qr" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges" data-testid="share-qr">
      <rect width={size} height={size} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}

// A printable PNG (1,200 px plus margin), black on white.
function qrPngBlob(text, pixels = 1200) {
  const { count, isDark } = qrModules(text);
  const size = count + 8;
  const scale = Math.ceil(pixels / size);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size * scale;
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000";
  for (let row = 0; row < count; row++)
    for (let col = 0; col < count; col++) if (isDark(row, col)) context.fillRect((col + 4) * scale, (row + 4) * scale, scale, scale);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function saveBlob(filename, blob) {
  try {
    const downloads = await window.claude?.use?.("downloads");
    if (downloads) return void (await downloads.save({ filename, data: blob }));
  } catch (error) {
    if (error?.code !== "unavailable") throw error;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  ((link.href = url), (link.download = filename), document.body.appendChild(link), link.click(), link.remove());
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    ((area.value = text), area.setAttribute("readonly", ""), (area.style.position = "fixed"), (area.style.opacity = "0"));
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    area.remove();
    return ok;
  }
}

function ShareSheet({ open, onOpenChange, lang, side }) {
  const t = (key) => tShare(lang, key);
  const [status, setStatus] = useState("");
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  useEffect(() => {
    if (!open) setStatus("");
  }, [open]);
  const nativeShare = async () => {
    try {
      await navigator.share({ title: t("title"), text: t("text"), url: SHARE_URL });
    } catch (error) {
      if (error?.name !== "AbortError") setStatus(t("shareFailed"));
    }
  };
  const copy = async () => setStatus((await copyText(SHARE_URL)) ? t("copied") : t("copyFailed"));
  const download = async () => {
    try {
      await saveBlob("talat-noi-map-qr.png", await qrPngBlob(SHARE_URL));
    } catch {}
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} showCloseButton={false} className="share-sheet" data-testid="share-sheet">
        <div className="sheet-close">
          <Button variant="outline" size="icon" aria-label={t("close")} onClick={() => onOpenChange(false)}>
            <Icon.X />
          </Button>
        </div>
        <SheetTitle>{t("share")}</SheetTitle>
        <SheetDescription>{t("text")}</SheetDescription>
        <figure className="share-qr-frame">
          <QrCode text={SHARE_URL} label={`${t("scan")}: ${readableLink(SHARE_URL)}`} />
          <figcaption>
            <span>{t("scan")}</span>
            <input
              className="share-link"
              readOnly
              value={readableLink(SHARE_URL)}
              aria-label="Map link"
              onFocus={(event) => event.target.select()}
              data-testid="share-link"
            />
          </figcaption>
        </figure>
        <div className="share-actions">
          {canNativeShare && (
            <Button onClick={nativeShare} data-testid="share-native">
              <Icon.Share /> {t("shareVia")}
            </Button>
          )}
          <Button variant={canNativeShare ? "outline" : "default"} onClick={copy} data-testid="share-copy">
            <Icon.Copy /> {t("copy")}
          </Button>
          <Button variant="outline" onClick={download} data-testid="share-download">
            <Icon.Download /> {t("download")}
          </Button>
        </div>
        <p className="share-status" role="status" aria-live="polite">
          {status}
        </p>
      </SheetContent>
    </Sheet>
  );
}
