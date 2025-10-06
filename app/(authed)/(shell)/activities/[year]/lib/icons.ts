export function iconForType(type: string): string {
  const map: Record<string, string> = {
    Run: "🏃",
    Ride: "🚴",
    VirtualRide: "🚴‍♂️",
    EBikeRide: "🚴‍♀️",
    Walk: "🚶",
    Hike: "🥾",
    Swim: "🏊",
    Rowing: "🚣",
    Canoeing: "🛶",
    Kayaking: "🛶",
    RockClimbing: "🧗",
    AlpineSki: "🎿",
    Snowboard: "🏂",
    Golf: "🏌️",
    Soccer: "⚽",
    Surfing: "🏄",
    Windsurf: "🏄‍♂️",
    Kitesurf: "🏄‍♀️",
    StandUpPaddling: "🏄",
    Elliptical: "🔁",
    StairStepper: "🧗‍♂️",
    WeightTraining: "🏋️",
    Yoga: "🧘",
    Workout: "💪",
    InlineSkate: "🛼",
    NordicSki: "🎿",
    BackcountrySki: "🎿",
    Snowshoe: "🥾",
    Wheelchair: "🦽",
    Handcycle: "🚴",
    Row: "🚣",
  };
  return map[type] ?? "🏃";
}

export function prettyTypeLabel(type: string): string {
  // turn "EBikeRide" → "E-Bike Ride", "StandUpPaddling" → "Stand Up Paddling", etc.
  const special: Record<string, string> = {
    EBikeRide: "E-Bike Ride",
    VirtualRide: "Virtual Ride",
    StandUpPaddling: "Stand Up Paddling",
    Handcycle: "Handcycle",
    InlineSkate: "Inline Skate",
    BackcountrySki: "Backcountry Ski",
    NordicSki: "Nordic Ski",
    AlpineSki: "Alpine Ski",
  };
  if (special[type]) return special[type];
  return type.replace(/([a-z])([A-Z])/g, "$1 $2");
}
