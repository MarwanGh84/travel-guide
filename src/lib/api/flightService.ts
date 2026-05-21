import { format } from "date-fns";

export type FlightTelemetry = {
  status: string;
  departure: {
    airport: string;
    terminal?: string;
    gate?: string;
    scheduledTime: string;
    actualTime?: string;
  };
  arrival: {
    airport: string;
    terminal?: string;
    gate?: string;
    scheduledTime: string;
    actualTime?: string;
  };
  aircraft?: string;
};

export async function getLiveFlightStatus(flightIdentifier: string, date: string): Promise<FlightTelemetry | null> {
  const apiKey = process.env.AERODATABOX_API_KEY;
  if (!apiKey) {
    console.error("AERODATABOX_API_KEY is not configured.");
    return null;
  }

  // Extract airline and number (e.g., "DL 123", "DL123", "Delta DL 123")
  // Looks for any 2-3 letters followed by 1-4 digits
  const match = flightIdentifier.match(/([a-zA-Z]{2,3})\s*(\d{1,4})/);
  if (!match) {
    console.warn(`[FlightService] Could not parse flight identifier: "${flightIdentifier}". Expected format like "DL 123".`);
    return null;
  }

  const airlineCode = match[1].toUpperCase();
  const flightNumber = match[2];
  const formattedDate = format(new Date(date), "yyyy-MM-dd");

  console.log(`[FlightService] Fetching telemetry for: ${airlineCode}${flightNumber} on ${formattedDate}`);

  try {
    const response = await fetch(
      `https://aerodatabox.p.rapidapi.com/flights/number/${airlineCode}${flightNumber}/${formattedDate}`,
      {
        headers: {
          "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`[FlightService] API Error: ${response.status} ${response.statusText}`);
      if (response.status === 404) return null;
      throw new Error(`AeroDataBox API Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[FlightService] API Response data length: ${Array.isArray(data) ? data.length : "Not an array"}`);
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`[FlightService] No flights found for ${airlineCode}${flightNumber} on this date.`);
      return null;
    }

    // Use the first match (most relevant for that date)
    const flight = data[0];

    return {
      status: flight.status || "Unknown",
      departure: {
        airport: flight.departure.airport.iata,
        terminal: flight.departure.terminal,
        gate: flight.departure.gate,
        scheduledTime: flight.departure.scheduledTimeLocal,
        actualTime: flight.departure.actualTimeLocal,
      },
      arrival: {
        airport: flight.arrival.airport.iata,
        terminal: flight.arrival.terminal,
        gate: flight.arrival.gate,
        scheduledTime: flight.arrival.scheduledTimeLocal,
        actualTime: flight.arrival.actualTimeLocal,
      },
      aircraft: flight.aircraft?.model,
    };
  } catch (error) {
    console.error("Flight Telemetry Fetch Error:", error);
    return null;
  }
}
