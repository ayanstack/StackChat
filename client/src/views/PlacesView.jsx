import React, { useState } from "react";
import { MapPin, Star, Clock, Phone, Globe, ChevronRight, AlertCircle, Loader } from "lucide-react";
import { placesApi } from "../services/api.js";

export default function PlacesView() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      setLoading(true);
      setError("");
      setResults([]);
      setSelectedPlace(null);
      const res = await placesApi.search({ query, ...(type && { type }) });
      setResults(res.data?.results || []);
    } catch (err) {
      setError(err.message || "Places search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (placeId) => {
    try {
      setDetailLoading(true);
      const res = await placesApi.details(placeId);
      setSelectedPlace(res.data);
    } catch (err) {
      setError(err.message || "Failed to fetch place details");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Places & Location Explorer
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
          Search global business entities, establishments, and geo-coordinates via Google Places API.
        </p>
      </div>

      {error && (
        <div style={{ padding: "9px 12px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.1)", color: "var(--accent-rose)", fontSize: "0.82rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Query Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Specialty coffee roasters in Shoreditch, Urgent care in Brooklyn"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
            required
          />
          <select className="select-field" style={{ width: 150 }} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Any Category</option>
            <option value="restaurant">Restaurant</option>
            <option value="cafe">Café</option>
            <option value="hospital">Hospital</option>
            <option value="hotel">Hotel</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="bank">Bank</option>
            <option value="park">Park</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ whiteSpace: "nowrap", height: 38 }}>
            {loading ? <Loader size={14} className="spin" /> : <MapPin size={14} />}
            <span>Find Places</span>
          </button>
        </form>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedPlace ? "1fr 1.1fr" : "1fr", gap: 18 }}>
        {results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Locations Found ({results.length})
            </h3>
            {results.map((place) => (
              <div
                key={place.placeId}
                className="card"
                style={{
                  padding: "14px 16px",
                  cursor: "pointer",
                  backgroundColor: selectedPlace?.placeId === place.placeId ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
                  borderColor: selectedPlace?.placeId === place.placeId ? "var(--border-focus)" : "var(--border-hairline)",
                  transition: "all 0.12s ease",
                }}
                onClick={() => handleViewDetails(place.placeId)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                      {place.name}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 2 }}>{place.formattedAddress}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      {place.rating && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.76rem", fontWeight: 600, color: "var(--accent-amber)" }}>
                          <Star size={11} fill="var(--accent-amber)" />
                          <span>{place.rating}</span>
                        </div>
                      )}
                      {place.openNow !== undefined && (
                        <span className={`badge ${place.openNow ? "badge-active" : "badge-disabled"}`}>
                          <Clock size={9} /> {place.openNow ? "Open" : "Closed"}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={15} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedPlace && (
          <div className="card" style={{ padding: 20, position: "sticky", top: 20 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{selectedPlace.name}</h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2, marginBottom: 16 }}>{selectedPlace.formattedAddress}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {selectedPlace.formattedPhoneNumber && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem" }}>
                  <Phone size={13} color="var(--accent-primary)" />
                  <span>{selectedPlace.formattedPhoneNumber}</span>
                </div>
              )}
              {selectedPlace.website && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem" }}>
                  <Globe size={13} color="var(--accent-primary)" />
                  <a href={selectedPlace.website} target="_blank" rel="noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>
                    {selectedPlace.website}
                  </a>
                </div>
              )}

              {selectedPlace.openingHours?.weekday_text && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>Operating Schedule</div>
                  {selectedPlace.openingHours.weekday_text.map((day, i) => (
                    <div key={i} style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 2 }}>{day}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
