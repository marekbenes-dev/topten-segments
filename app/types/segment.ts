export type LatLng = [number, number];

type SummaryPRSegmentEffort = {
  pr_activity_id: number;
  pr_elapsed_time: number;
  pr_date: string; // ISO date string
  effort_count: number;
  id: number;
  activity_id: number;
  elapsed_time: number;
  start_date: string; // ISO date string
  start_date_local: string; // ISO date string
  distance: number;
  is_kom: boolean;
};

type Xoms = {
  kom?: string; // seconds, but returned as a string (e.g. "130")
  qom?: string; // "
  cr?: string; // "
};

type SummarySegmentEffort = {
  id: number;
  activity_id: number;
  elapsed_time: number;
  start_date: string; // ISO date string
  start_date_local: string; // ISO date string
  distance: number;
  is_kom: boolean;
};

type PolylineMap = {
  id: string;
  polyline: string;
  summary_polyline: string;
};

export type DetailedSegment = {
  id: number;
  name: string;
  activity_type: "Ride" | "Run";
  distance: number;
  average_grade: number;
  maximum_grade: number;
  elevation_high: number;
  elevation_low: number;
  start_latlng: LatLng;
  end_latlng: LatLng;
  climb_category: number;
  city: string;
  state: string;
  country: string;
  private: boolean;
  athlete_pr_effort: SummaryPRSegmentEffort;
  athlete_segment_stats: SummarySegmentEffort;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  total_elevation_gain: number;
  map: PolylineMap;
  effort_count: number;
  athlete_count: number;
  hazardous: boolean;
  star_count: number;
  xoms?: Xoms;
};
