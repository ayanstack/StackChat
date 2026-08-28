import ApiError from "../utils/ApiError.js";

export const searchPlaces = async ({ query, location, radius, type }) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, "Places provider (Google Maps/Places API) is NOT_CONFIGURED on the server");
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    if (location) url += `&location=${location}`;
    if (radius) url += `&radius=${radius}`;
    if (type) url += `&type=${type}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(data.error_message || `Places API status: ${data.status}`);
    }

    const results = (data.results || []).map((place) => ({
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      types: place.types,
      location: place.geometry?.location,
      openNow: place.opening_hours?.open_now,
    }));

    return {
      provider: "google-places",
      query,
      results,
    };
  } catch (error) {
    throw ApiError.internal(`Google Places search failed: ${error.message}`);
  }
};

export const getPlaceDetails = async (placeId) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, "Places provider (Google Maps/Places API) is NOT_CONFIGURED on the server");
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status !== "OK") {
      throw new Error(data.error_message || `Places API status: ${data.status}`);
    }

    const place = data.result;
    return {
      provider: "google-places",
      placeId,
      name: place.name,
      formattedAddress: place.formatted_address,
      formattedPhoneNumber: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      reviews: place.reviews,
      location: place.geometry?.location,
      openingHours: place.opening_hours,
      photos: (place.photos || []).map((p) => ({
        photoReference: p.photo_reference,
        height: p.height,
        width: p.width,
      })),
    };
  } catch (error) {
    throw ApiError.internal(`Google Place details fetch failed: ${error.message}`);
  }
};

export default {
  searchPlaces,
  getPlaceDetails,
};
