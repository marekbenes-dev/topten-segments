export type ExploreSegment = {
  id: number;
  name: string;
  climb_category: number;
  climb_category_desc: "NC" | "4" | "3" | "2" | "1" | "HC";
  avg_grade: number;
  start_latlng: [number, number];
  end_latlng: [number, number];
  elev_difference: number;
  distance: number;
  points: string;
};
