import { Postcard } from '@app/play/Postcard';
import { Road } from '@app/play/Road';
import { Setup } from '@app/play/Setup';
import { useTrips } from '@app/state/TripStore';

export function PlayPage() {
  const { current } = useTrips();
  if (!current) return <Setup />;
  if (current.finishedAt !== null) return <Postcard trip={current} />;
  return <Road key={current.id} trip={current} />;
}
