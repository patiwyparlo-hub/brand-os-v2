import { currentUser } from "@/lib/session";
import LoginScreen from "@/components/LoginScreen";
import Chat from "@/components/Chat";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) return <LoginScreen />;
  return <Chat user={user} />;
}
