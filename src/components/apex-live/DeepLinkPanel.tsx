import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link2, QrCode, MessageSquare, Globe, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useApexConfig } from "@/lib/apex-config";
import { fadeUp } from "@/brand/motion";

/**
 * AO-P7 — Deep link surfaces.
 *
 * Demonstrates the three flavors of Apex Link consumption:
 *   - QR codes (printed media, in-store, packaging)
 *   - SMS deep links
 *   - Universal Links from the merchant subdomain
 *
 * Each surface uses the same Apex Link primitive; the demo shows the
 * same campaign URL hit three different ways.
 */
export function DeepLinkPanel() {
  const config = useApexConfig();
  const toast = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const demoUrl = useMemo(() => {
    const base = config.projectKey.includes(".")
      ? config.projectKey
      : config.projectKey.split("-")[0] || "demo";
    return `https://${base}.links.apex.inc/founders-tote?ref=ari&campaign=founders-tote`;
  }, [config]);

  useEffect(() => {
    void QRCode.toDataURL(demoUrl, {
      margin: 1,
      width: 240,
      color: { dark: "#0a0a0a", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [demoUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(demoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied", "Open the URL in another browser to test as a real visitor.");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <motion.div variants={fadeUp} className="space-y-3">
      <Card>
        <CardBody className="flex items-start gap-3 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Link2 className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight">Apex Links surfaces</h3>
            <p className="mt-0.5 text-xs text-fg-muted">
              One Apex Link, three real-world entry points: a printed QR code, an SMS link, a web URL on the merchant&apos;s domain. All hit the same redirect + attribution waterfall.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* ── URL ────────────────────────────────────────────────── */}
      <Card>
        <CardBody className="space-y-2 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Demo campaign URL
          </p>
          <div className="break-all rounded-lg bg-surface-sunken px-3 py-2 font-mono text-[11px] text-fg">
            {demoUrl}
          </div>
          <Button
            size="sm"
            variant="secondary"
            fullWidth
            iconLeft={copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            onClick={handleCopy}
          >
            {copied ? "Copied" : "Copy URL"}
          </Button>
        </CardBody>
      </Card>

      {/* ── QR code ────────────────────────────────────────────── */}
      <Card>
        <CardBody className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <QrCode className="size-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              QR code
            </span>
            <Badge>Print media</Badge>
          </div>
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-white p-2">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR code for the affiliate Apex Link" className="size-32" />
              ) : (
                <div className="size-32 animate-pulse rounded bg-surface-sunken" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs leading-relaxed text-fg-muted">
                Scan with another phone&apos;s camera. The Universal Link opens this app (with the Apex Outfitters bundle ID registered in your Apple Dev portal) or falls back to the merchant&apos;s website.
              </p>
              <Badge variant="primary">Apex tracks: scan → click → attribution → conversion</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── SMS placeholder ────────────────────────────────────── */}
      <Card>
        <CardBody className="space-y-2 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              SMS deep link
            </span>
          </div>
          <p className="text-xs text-fg-muted">
            In a real merchant integration, your CRM sends the campaign URL via SMS. iOS/Android render the URL as a tappable link, and the Universal Link / App Link route opens the app directly to the deep-linked product.
          </p>
          <Button
            size="sm"
            variant="ghost"
            iconLeft={<MessageSquare className="size-3.5" />}
            onClick={() => toast.info("In a real integration this fires your SMS connector")}
          >
            Send to my phone (simulated)
          </Button>
        </CardBody>
      </Card>

      {/* ── Branded redirect verification ──────────────────────── */}
      <Card>
        <CardBody className="space-y-2 py-4">
          <div className="flex items-center gap-2">
            <Globe className="size-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Branded redirect
            </span>
            <Badge>Project subdomain</Badge>
          </div>
          <p className="text-xs text-fg-muted">
            Every project gets a wildcard subdomain under{" "}
            <span className="font-mono">links.apex.inc</span>. Apex auto-hosts the AASA + assetlinks files so Universal Links and App Links work on first install.
          </p>
        </CardBody>
      </Card>
    </motion.div>
  );
}
