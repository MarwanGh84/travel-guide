import type { DataSource } from "@/lib/types/travel";

export type ActivityResult = {
  id?: string;
  title: string;
  category: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  estimatedPrice: number;
  duration: string;
  bookingLink?: string;
  source: DataSource;
};

export type ActivitySearchParams = {
  destination: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  limit?: number;
};

const getYourGuideApiBase = "https://api.getyourguide.com";
const getYourGuideApiVersion = "1";

export async function searchActivities(params: ActivitySearchParams | string): Promise<ActivityResult[]> {
  const normalized = typeof params === "string" ? { destination: params } : params;
  const token = process.env.GETYOURGUIDE_API_KEY?.trim();
  if (!token) return [];

  const query = new URLSearchParams({
    q: normalized.destination,
    cnt_language: "en",
    currency: normalized.currency ?? "USD",
    limit: String(normalizeLimit(normalized.limit)),
    sortfield: "rating",
    sortdirection: "DESC",
    preformatted: "teaser",
  });

  const dateRange = getDateRange(normalized.startDate, normalized.endDate);
  dateRange.forEach((date) => query.append("date[]", date));

  const response = await fetch(`${getYourGuideApiBase}/${getYourGuideApiVersion}/tours?${query.toString()}`, {
    headers: {
      "X-ACCESS-TOKEN": token,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GetYourGuide returned ${response.status}. Check API token access and partner permissions.`);
  }

  const payload = await response.json();
  const tours = Array.isArray(payload?.data?.tours) ? payload.data.tours : [];
  return tours.map(toActivityResult).filter(Boolean).slice(0, normalizeLimit(normalized.limit));
}

export async function checkGetYourGuideConnection() {
  if (!process.env.GETYOURGUIDE_API_KEY?.trim()) {
    return {
      ok: false,
      configured: false,
      message: "No GetYourGuide partner API token configured.",
    };
  }

  try {
    const results = await searchActivities({ destination: "Berlin", currency: "USD", limit: 1 });
    return {
      ok: true,
      configured: true,
      message: `Connected. Sample search returned ${results.length} tour${results.length === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      message: error instanceof Error ? error.message : "GetYourGuide connection check failed.",
    };
  }
}

function toActivityResult(tour: Record<string, unknown>): ActivityResult {
  const price = getPrice(tour.price);
  const duration = getDuration(tour.durations);
  const category = Array.isArray(tour.categories) && tour.categories[0] && typeof tour.categories[0] === "object"
    ? String((tour.categories[0] as Record<string, unknown>).name ?? "Tour")
    : "Tour";

  return {
    id: tour.tour_id ? String(tour.tour_id) : undefined,
    title: String(tour.title ?? "GetYourGuide activity"),
    category,
    description: String(tour.abstract ?? tour.description ?? ""),
    rating: typeof tour.overall_rating === "number" ? tour.overall_rating : undefined,
    reviewCount: typeof tour.number_of_ratings === "number" ? tour.number_of_ratings : undefined,
    estimatedPrice: price,
    duration,
    bookingLink: typeof tour.url === "string" ? tour.url : undefined,
    source: {
      provider: "getyourguide",
      isMock: false,
      note: "Live GetYourGuide Partner API data.",
    },
  };
}

function getDateRange(startDate?: string, endDate?: string) {
  const dates = [];
  if (startDate) dates.push(`${startDate.slice(0, 10)}T00:00:00`);
  if (endDate) dates.push(`${endDate.slice(0, 10)}T23:59:59`);
  return dates;
}

function getPrice(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const price = value as Record<string, unknown>;
  return numberValue(price.values ?? price.value ?? price.amount ?? price.price);
}

function getDuration(value: unknown) {
  if (!Array.isArray(value) || !value[0] || typeof value[0] !== "object") return "Duration varies";
  const duration = value[0] as Record<string, unknown>;
  const min = numberValue(duration.duration ?? duration.min ?? duration.min_duration);
  const max = numberValue(duration.max_duration ?? duration.max);
  const minutes = max || min;
  if (!minutes) return "Duration varies";
  if (minutes >= 1440) return `${Math.round(minutes / 1440)} day${Math.round(minutes / 1440) === 1 ? "" : "s"}`;
  if (minutes >= 60) return `${Math.round(minutes / 60)} hr`;
  return `${minutes} min`;
}

function numberValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (Array.isArray(value)) return numberValue(value[0]);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return numberValue(record.amount ?? record.value ?? record.original ?? record.from);
  }
  return 0;
}

function normalizeLimit(value: number | undefined) {
  const limit = Number(value ?? 8);
  return Number.isFinite(limit) ? Math.min(Math.max(Math.round(limit), 1), 20) : 8;
}
