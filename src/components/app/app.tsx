import { useCallback, useEffect, useMemo } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { AppHeader } from '@components/app-header/app-header';
import {
  ProfileFeedConnectionLayout,
  PublicFeedConnectionLayout,
} from '@components/feed-connection-layout/feed-connection-layout';
import { Modal } from '@components/modal/modal';
import { ProtectedRoute } from '@components/protected-route/protected-route';
import { FeedPage } from '@pages/feed-page/feed-page';
import { ForgotPasswordPage } from '@pages/forgot-password-page/forgot-password-page';
import { Home } from '@pages/home-page/home-page';
import {
  IngredientContent,
  IngredientPage,
} from '@pages/ingredient-page/ingredient-page';
import { LoginPage } from '@pages/login-page/login-page';
import { NotFoundPage } from '@pages/not-found-page/not-found-page';
import { OrderContent, OrderPage } from '@pages/order-page/order-page';
import { ProfileForm } from '@pages/profile-form/profile-form';
import { ProfileOrdersPage } from '@pages/profile-orders-page/profile-orders-page';
import { ProfilePage } from '@pages/profile-page/profile-page';
import { RegisterPage } from '@pages/register-page/register-page';
import { ResetPasswordPage } from '@pages/reset-password-page/reset-password-page';
import { useAppDispatch } from '@services/hooks';
import { fetchIngredients } from '@services/ingredients/actions';
import { checkUserAuth } from '@services/user/actions';
import {
  clearRouteOverlay,
  getStoredRouteOverlay,
  isAllowedRouteOverlayPair,
  saveRouteOverlay,
} from '@utils/route-overlay-storage';

import type { Location } from 'react-router-dom';

import styles from './app.module.css';

type TRoutedLocationState = { backgroundLocation?: Location };

const GuestRoute = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
  <ProtectedRoute guestOnly>{children}</ProtectedRoute>
);

export const App = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const overlayPath = `${location.pathname}${location.search}${location.hash}`;
  const routedBackgroundLocation = (location.state as TRoutedLocationState | null)
    ?.backgroundLocation;
  const routedBackgroundPath = routedBackgroundLocation
    ? `${routedBackgroundLocation.pathname}${routedBackgroundLocation.search}${routedBackgroundLocation.hash}`
    : null;
  const stateBackgroundLocation =
    routedBackgroundLocation &&
    routedBackgroundPath &&
    isAllowedRouteOverlayPair(overlayPath, routedBackgroundPath)
      ? routedBackgroundLocation
      : undefined;
  const reloadBackgroundLocation = useMemo((): Location | undefined => {
    if (stateBackgroundLocation) return undefined;
    const entry = getStoredRouteOverlay(overlayPath);
    if (!entry) return undefined;
    return {
      hash: '',
      key: 'route-overlay-reload-background',
      pathname: entry.backgroundPath,
      search: '',
      state: null,
    };
  }, [overlayPath, stateBackgroundLocation]);
  const backgroundLocation = stateBackgroundLocation ?? reloadBackgroundLocation;

  useEffect(() => {
    void dispatch(fetchIngredients());
    void dispatch(checkUserAuth());
  }, [dispatch]);

  useEffect(() => {
    if (stateBackgroundLocation && routedBackgroundPath) {
      saveRouteOverlay(overlayPath, routedBackgroundPath);
      return;
    }
    if (!reloadBackgroundLocation) {
      clearRouteOverlay();
    }
  }, [
    overlayPath,
    reloadBackgroundLocation,
    routedBackgroundPath,
    stateBackgroundLocation,
  ]);

  const closeRouteModal = useCallback((): void => {
    clearRouteOverlay();
    if (reloadBackgroundLocation) {
      void navigate(reloadBackgroundLocation.pathname, { replace: true });
      return;
    }
    void navigate(-1);
  }, [navigate, reloadBackgroundLocation]);

  return (
    <div className={styles.app}>
      <AppHeader />
      <Routes location={backgroundLocation ?? location}>
        <Route path="/" element={<Home />} />
        <Route path="/ingredients/:id" element={<IngredientPage />} />
        <Route path="/feed" element={<PublicFeedConnectionLayout />}>
          <Route index element={<FeedPage />} />
          <Route path=":id" element={<OrderPage scope="public" />} />
        </Route>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProfileForm />} />
          <Route path="orders" element={<ProfileFeedConnectionLayout />}>
            <Route index element={<ProfileOrdersPage />} />
            <Route path=":id" element={<OrderPage scope="profile" />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {backgroundLocation && (
        <Routes>
          <Route
            path="/ingredients/:id"
            element={
              <Modal title="Детали ингредиента" onClose={closeRouteModal}>
                <IngredientContent />
              </Modal>
            }
          />
          <Route
            path="/feed/:id"
            element={
              <Modal title="Детали заказа" onClose={closeRouteModal}>
                <OrderContent scope="public" />
              </Modal>
            }
          />
          <Route
            path="/profile/orders/:id"
            element={
              <ProtectedRoute>
                <Modal title="Детали заказа" onClose={closeRouteModal}>
                  <OrderContent scope="profile" />
                </Modal>
              </ProtectedRoute>
            }
          />
        </Routes>
      )}
    </div>
  );
};

export default App;
