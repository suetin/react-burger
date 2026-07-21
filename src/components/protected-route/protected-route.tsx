import { Preloader } from '@krgaa/react-developer-burger-ui-components';
import { Navigate, useLocation } from 'react-router-dom';

import { useAppSelector } from '@services/hooks';
import { selectIsAuthChecked, selectUser } from '@services/user/slice';

import type { ReactNode } from 'react';

type TProtectedRouteProps = {
  children: ReactNode;
  guestOnly?: boolean;
};

export const ProtectedRoute = ({
  children,
  guestOnly = false,
}: TProtectedRouteProps): React.JSX.Element => {
  const location = useLocation();
  const isAuthChecked = useAppSelector(selectIsAuthChecked);
  const user = useAppSelector(selectUser);

  if (!isAuthChecked) return <Preloader />;
  if (guestOnly && user) return <Navigate to="/" replace />;
  if (!guestOnly && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};
