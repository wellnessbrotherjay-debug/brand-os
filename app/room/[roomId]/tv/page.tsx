import { getWelcomeContext } from "./context";
import { LiveWelcome } from "./LiveWelcome";

type PageProps = {
  params: { roomId: string };
};

export const dynamic = "force-dynamic";

export default async function RoomWelcomePage({ params }: PageProps) {
  const context = await getWelcomeContext(params.roomId);
  return <LiveWelcome initialContext={context} roomId={params.roomId} />;
}
