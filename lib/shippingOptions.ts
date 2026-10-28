// A delivery option as the server sends it
export interface ZoneOption {
  id: string;
  name: string;
  description?: string | null;
  fee: number;
  type: string; // FlatRate, FreeShipping, Pickup, ...
  isActive?: boolean;
  deliveryEstimate?: string | null;
  state?: string | null;
  city?: string | null;
}

export const normState = (s?: string | null) => {
  const v = (s ?? '').trim().toLowerCase().replace(' state', '');
  return v === 'fct' || v === 'fct abuja' || v === 'abuja' ? 'abuja' : v;
};

// Does this delivery option serve the chosen state?
export const zoneCovers = (z: ZoneOption, wanted: string) => {
  const states = (z.state ?? '')
    .split(',').map(normState).filter(Boolean);
  if (states.length > 0) return states.includes(wanted);
  const n = normState(z.name);
  if (['nationwide', 'all states', 'all'].includes(n)) return true;
  return n === wanted; // older zones are named after their state
};

// What the customer pays for this option
export const zoneFee = (z: ZoneOption) =>
  z.type === 'FreeShipping' || z.type === 'Pickup' ? 0 : z.fee;

// The options for a state: cheapest first, pickup last
export const optionsForState = (zones: ZoneOption[], state: string) => {
  const wanted = normState(state);
  if (!wanted) return [];
  return zones
    .filter(z => z.isActive !== false && zoneCovers(z, wanted))
    .sort((a, b) => {
      const pa = a.type === 'Pickup' ? 1 : 0;
      const pb = b.type === 'Pickup' ? 1 : 0;
      if (pa !== pb) return pa - pb;
      return a.fee - b.fee;
    });
};