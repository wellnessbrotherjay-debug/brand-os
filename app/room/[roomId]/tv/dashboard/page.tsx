import { getWelcomeContext } from "./context";
import { LiveWelcome } from "./LiveWelcome";

export default async function RoomTvDashboard({ params }: { params: { roomId: string } }) {
  const context = await getWelcomeContext(params.roomId);
  return <LiveWelcome initialContext={context} roomId={params.roomId} />;
}
