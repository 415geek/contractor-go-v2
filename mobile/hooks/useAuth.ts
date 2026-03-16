import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";

export function useAuth() {
  const { isSignedIn, isLoaded, signOut } = useClerkAuth();
  const { user } = useUser();

  const phone = user?.phoneNumbers[0]?.phoneNumber ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  return {
    user: user ? { id: user.id, phone, email } : null,
    isLoading: !isLoaded,
    initialized: isLoaded,
    isSignedIn: !!isSignedIn,
    signOut,
  };
}
