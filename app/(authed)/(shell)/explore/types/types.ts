import type { LatLng } from "@/app/types/segment";

export type ExploreSegment = {
  id: number;
  name: string;
  climb_category: number;
  climb_category_desc: "NC" | "4" | "3" | "2" | "1" | "HC";
  avg_grade: number;
  start_latlng: LatLng;
  end_latlng: LatLng;
  elev_difference: number;
  distance: number;
  points: string;
};
