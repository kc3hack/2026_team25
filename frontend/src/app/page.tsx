import { MapView } from "@/components/map/MapView";
import { DesireSliders } from "@/components/panel/DesireSliders";

export default function HomePage() {
  return (
    <main>
      <h1>Wagamama Gourmet</h1>
      <MapView />
      <DesireSliders />
    </main>
  );
}
