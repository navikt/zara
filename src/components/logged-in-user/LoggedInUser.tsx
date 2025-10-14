import { BodyShort, Detail, Skeleton, Tooltip } from "@navikt/ds-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";

import { getLoggedInUser } from "./logged-in-user-actions.ts";

export function LoggedInUser(): ReactElement {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getLoggedInUser,
  });

  if (isLoading) {
    return <LoggedInUserSkeleton />;
  }

  if (user == null || error) {
    return (
      <div className="flex flex-col items-end justify-center h-full">
        <BodyShort className="w-32 text-right">Ikke logget inn</BodyShort>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="hidden sm:block text-right">
        <BodyShort>{user.name}</BodyShort>
        <Detail className="whitespace-nowrap">{user.email}</Detail>
      </div>
      <Tooltip content={`Logget in som ${user.name} (${user.email})`}>
        <div className="w-[48px] h-[48px] bg-gray-400 rounded-full flex items-center justify-center text-2xl">
          {user.name[0]}
        </div>
      </Tooltip>
    </div>
  );
}

function LoggedInUserSkeleton(): ReactElement {
  return (
    <div className="flex gap-4">
      <div>
        <Skeleton width={120} />
        <Skeleton width={60} />
      </div>
      <Skeleton width={48} height={48} variant="circle" />
    </div>
  );
}
