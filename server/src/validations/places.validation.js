import { z } from "zod";

export const placesSearchSchema = z.object({
  body: z.object({
    query: z.string().min(1, "Search query is required").max(300),
    location: z.string().optional(), // "lat,lng" e.g., "37.7749,-122.4194"
    radius: z.number().int().positive().max(50000).optional(), // in meters
    type: z.string().optional(), // "restaurant", "cafe", "hospital", etc.
  }),
});

export const placeDetailsSchema = z.object({
  params: z.object({
    placeId: z.string().min(1, "Place ID is required"),
  }),
});
