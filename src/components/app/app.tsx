import { useCallback, useEffect, useMemo } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { AppHeader } from '@components/app-header/app-header';
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
import { ProfileForm } from '@pages/profile-form/profile-form';
import { ProfileOrdersPage } from '@pages/profile-orders-page/profile-orders-page';
import { ProfilePage } from '@pages/profile-page/profile-page';
import { RegisterPage } from '@pages/register-page/register-page';
import { ResetPasswordPage } from '@pages/reset-password-page/reset-password-page';
import { useAppDispatch } from '@services/hooks';
import { fetchIngredients } from '@services/ingredients/slice';
import { checkUserAuth } from '@services/user/actions';
import {
  clearIngredientOverlay,
  getStoredIngredientBackground,
  saveIngredientOverlay,
} from '@utils/ingredient-overlay-storage';

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
  const stateBackgroundLocation = (location.state as TRoutedLocationState | null)
    ?.backgroundLocation;
  const reloadBackgroundLocation = useMemo((): Location | undefined => {
    if (stateBackgroundLocation) return undefined;
    const backgroundPath = getStoredIngredientBackground(
      `${location.pathname}${location.search}${location.hash}`
    );
    if (!backgroundPath) return undefined;
    const url = new URL(backgroundPath, window.location.origin);
    return {
      hash: url.hash,
      key: 'ingredient-overlay-reload-background',
      pathname: url.pathname,
      search: url.search,
      state: null,
    };
  }, [location.hash, location.pathname, location.search, stateBackgroundLocation]);
  const backgroundLocation = stateBackgroundLocation ?? reloadBackgroundLocation;

  useEffect(() => {
    void dispatch(fetchIngredients());
    void dispatch(checkUserAuth());
  }, [dispatch]);

  useEffect(() => {
    const overlayPath = `${location.pathname}${location.search}${location.hash}`;
    if (stateBackgroundLocation) {
      const backgroundPath = `${stateBackgroundLocation.pathname}${stateBackgroundLocation.search}${stateBackgroundLocation.hash}`;
      saveIngredientOverlay(overlayPath, backgroundPath);
      return;
    }
    if (!location.pathname.startsWith('/ingredients/')) {
      clearIngredientOverlay();
    }
  }, [location.hash, location.pathname, location.search, stateBackgroundLocation]);

  const closeIngredientModal = useCallback((): void => {
    clearIngredientOverlay();
    if (reloadBackgroundLocation) {
      const backgroundPath = `${reloadBackgroundLocation.pathname}${reloadBackgroundLocation.search}${reloadBackgroundLocation.hash}`;
      void navigate(backgroundPath, { replace: true });
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
        <Route path="/feed" element={<FeedPage />} />
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
          <Route path="orders" element={<ProfileOrdersPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {backgroundLocation && (
        <Routes>
          <Route
            path="/ingredients/:id"
            element={
              <Modal title="Детали ингредиента" onClose={closeIngredientModal}>
                <IngredientContent />
              </Modal>
            }
          />
        </Routes>
      )}
    </div>
  );
};

export default App;
