import { useCallback, useEffect, useRef, useState } from "react";
import api from "../axios";
import aiApi from "../AI_axios";
import { useAuth } from "../services/auth.services";

// Mirrors useNotifications' poll cadence — fresh enough for a badge without
// hammering either backend.
const POLL_INTERVAL_MS = 90000;

const ZERO_COUNTS = { words: 0, howToSay: 0, paragraphs: 0, conjugations: 0 };

// Polls the per-report-type counts backing the "Reports (N)" nav badge and
// each tab's "<Type> Reports (N)" label. All four admin count endpoints are
// SUPER_ADMIN-gated on both the main backend and the AI service, so this
// only fetches for that role — a plain admin just sees no badges, same as
// how the Word/How-to-Say report tabs already hide for them.
export const useReportCounts = () => {
  const { isLoggedIn, userRole: role } = useAuth();
  const [counts, setCounts] = useState(ZERO_COUNTS);
  const pollRef = useRef(null);

  const refetchCounts = useCallback(async () => {
    if (!isLoggedIn || role !== "super_admin") {
      setCounts(ZERO_COUNTS);
      return;
    }

    const [words, howToSay, paragraphs, conjugations] = await Promise.all([
      api
        .get("/word-reports/admin/count", { skipErrorReporting: true })
        .then((res) => res.data?.data?.count ?? 0)
        .catch(() => 0),
      api
        .get("/how-to-say-reports/admin/count", { skipErrorReporting: true })
        .then((res) => res.data?.data?.count ?? 0)
        .catch(() => 0),
      aiApi
        .get("/paragraphs/reports/count")
        .then((res) => res.data?.count ?? 0)
        .catch(() => 0),
      aiApi
        .get("/conjugations/reports/count")
        .then((res) => res.data?.count ?? 0)
        .catch(() => 0),
    ]);

    setCounts({ words, howToSay, paragraphs, conjugations });
  }, [isLoggedIn, role]);

  useEffect(() => {
    void refetchCounts();
  }, [refetchCounts]);

  useEffect(() => {
    if (!isLoggedIn || role !== "super_admin") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(refetchCounts, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [isLoggedIn, role, refetchCounts]);

  const total =
    counts.words + counts.howToSay + counts.paragraphs + counts.conjugations;

  return { counts, total, refetchCounts };
};

export default useReportCounts;
