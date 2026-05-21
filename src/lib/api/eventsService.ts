export type LiveEvent = {
  id: string;
  name: string;
  description?: string;
  date: string;
  startTime?: string;
  thumbnail?: string;
  link: string;
  venue?: string;
  address?: string;
};

export async function searchLiveEvents(query: string, date: string): Promise<LiveEvent[]> {
  const apiKey = process.env.AERODATABOX_API_KEY; // Reusing the shared RapidAPI key
  if (!apiKey) {
    console.error("RapidAPI Key is not configured.");
    return [];
  }

  try {
    const url = new URL("https://real-time-events-search.p.rapidapi.com/search-events");
    url.searchParams.set("query", query);
    url.searchParams.set("date", date || "any_date");
    url.searchParams.set("is_virtual", "false");

    const response = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-host": "real-time-events-search.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Real-Time Events API Error: ${response.statusText}`);
    }

    const json = await response.json();
    if (!json.data || !Array.isArray(json.data)) return [];

    return json.data.map((item: { 
      event_id: string; 
      name: string; 
      description?: string; 
      start_time?: string; 
      date?: string; 
      thumbnail?: string; 
      link?: string; 
      event_link?: string; 
      venue?: { name?: string; full_address?: string; street_address?: string } 
    }) => ({
      id: item.event_id,
      name: item.name,
      description: item.description,
      date: item.start_time || item.date || "Unknown",
      startTime: item.start_time,
      thumbnail: item.thumbnail,
      link: item.link || item.event_link || "",
      venue: item.venue?.name || "Local Venue",
      address: item.venue?.full_address || item.venue?.street_address,
    }));
  } catch (error) {
    console.error("Search Live Events Error:", error);
    return [];
  }
}
