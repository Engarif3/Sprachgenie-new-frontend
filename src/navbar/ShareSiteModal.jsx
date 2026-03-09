import { QRCodeCanvas } from "qrcode.react";
import {
  FaFacebookMessenger,
  FaShareAlt,
  FaTelegramPlane,
  FaWhatsapp,
} from "react-icons/fa";
import { toast } from "sonner";

const SITE_URL = "https://simplegerman.de";
const SITE_TITLE = "SimpleGerman";
const SITE_TEXT = "Learn German with SimpleGerman";
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const MESSENGER_APP_URL = `fb-messenger://share?link=${encodeURIComponent(SITE_URL)}`;

const ShareSiteModal = ({ onClose }) => {
  const encodedShareText = encodeURIComponent(`${SITE_TEXT} ${SITE_URL}`);
  const messengerSendDialogUrl = FACEBOOK_APP_ID
    ? `https://www.facebook.com/dialog/send?app_id=${encodeURIComponent(FACEBOOK_APP_ID)}&link=${encodeURIComponent(SITE_URL)}&redirect_uri=${encodeURIComponent(window.location.origin)}`
    : null;

  const handleMessengerShare = async () => {
    const isMobileDevice = /android|iphone|ipad|ipod/i.test(
      navigator.userAgent,
    );

    if (isMobileDevice) {
      window.location.href = MESSENGER_APP_URL;
      return;
    }

    if (messengerSendDialogUrl) {
      window.open(messengerSendDialogUrl, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      await navigator.clipboard.writeText(SITE_URL);
      toast.success("Link copied. Open Messenger and paste it there.");
    } catch (_error) {
      toast.info("Open Messenger and share this link manually.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: SITE_TITLE,
          text: SITE_TEXT,
          url: SITE_URL,
        });
        return;
      } catch (_error) {
        return;
      }
    }

    await navigator.clipboard.writeText(SITE_URL);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-sky-800/60 bg-slate-950 p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-white/5 text-xl transition hover:border-rose-400/60 hover:text-rose-300"
          aria-label="Close share modal"
        >
          ×
        </button>

        <div className="pr-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-400">
            Share SimpleGerman
          </p>
          <h2 className="mt-2 text-2xl font-bold">Open on any device</h2>
          <p className="mt-2 text-sm text-slate-300">
            Share the link directly or scan the QR code to open {SITE_URL}.
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-slate-800 bg-white/5 p-5">
          <div className="rounded-2xl bg-white p-4 shadow-xl">
            <QRCodeCanvas value={SITE_URL} size={160} includeMargin />
          </div>
          <p className="text-center text-sm text-slate-300">
            Scan to open SimpleGerman instantly.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-blue-500"
          >
            <FaShareAlt size={16} aria-hidden="true" />
            Share / Copy Link
          </button>
          <a
            href={`https://wa.me/?text=${encodedShareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-500"
          >
            <FaWhatsapp size={18} aria-hidden="true" />
            WhatsApp
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodedShareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            <FaTelegramPlane size={18} aria-hidden="true" />
            Telegram
          </a>
          <a
            href={MESSENGER_APP_URL}
            onClick={(event) => {
              const isMobileDevice = /android|iphone|ipad|ipod/i.test(
                navigator.userAgent,
              );

              if (!isMobileDevice) {
                event.preventDefault();
                void handleMessengerShare();
              }
            }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <FaFacebookMessenger size={18} aria-hidden="true" />
            Messenger
          </a>
        </div>
      </div>
    </div>
  );
};

export default ShareSiteModal;
