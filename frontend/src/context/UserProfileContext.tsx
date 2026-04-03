"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useUserProfile } from "@/hooks/useQueries";
import type { UserProfile } from "@/types/user";

type UserProfileContextValue = UseQueryResult<UserProfile, Error>;

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const userProfileQuery = useUserProfile();

  return (
    <UserProfileContext.Provider value={userProfileQuery}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfileContext(): UserProfileContextValue {
  const context = useContext(UserProfileContext);

  if (!context) {
    throw new Error(
      "useUserProfileContext must be used within UserProfileProvider"
    );
  }

  return context;
}
