import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { useAppDispatch } from '@services/hooks';
import {
  profileFeedConnect,
  profileFeedDisconnect,
} from '@services/profile-feed/actions';
import { publicFeedConnect, publicFeedDisconnect } from '@services/public-feed/actions';

export const PublicFeedConnectionLayout = (): React.JSX.Element => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(publicFeedConnect());

    return (): void => {
      dispatch(publicFeedDisconnect());
    };
  }, [dispatch]);

  return <Outlet />;
};

export const ProfileFeedConnectionLayout = (): React.JSX.Element => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(profileFeedConnect());

    return (): void => {
      dispatch(profileFeedDisconnect());
    };
  }, [dispatch]);

  return <Outlet />;
};
