export const WALKING_SPEED_KMH = 4.8;
export const BIKING_SPEED_KMH = 15;
export const BUS_SPEED_KMH = 12;
export const TRAIN_SPEED_KMH = 25;
export const CAR_SPEED_KMH = 20;

export type TransportMode = 'walk' | 'bike' | 'bus' | 'train' | 'car';

export const TRANSPORT_MODES: {
  id: TransportMode;
  label: string;
  icon: string;
  speedKmh: number;
  roundTripCost: number;
}[] = [
  { id: 'walk', label: 'Walk', icon: '🚶', speedKmh: WALKING_SPEED_KMH, roundTripCost: 0 },
  { id: 'bike', label: 'Bike', icon: '🚲', speedKmh: BIKING_SPEED_KMH, roundTripCost: 0 },
  { id: 'bus', label: 'Bus', icon: '🚌', speedKmh: BUS_SPEED_KMH, roundTripCost: 5.80 },
  { id: 'train', label: 'Train', icon: '🚇', speedKmh: TRAIN_SPEED_KMH, roundTripCost: 5.80 },
  { id: 'car', label: 'Car', icon: '🚗', speedKmh: CAR_SPEED_KMH, roundTripCost: 0 },
];
