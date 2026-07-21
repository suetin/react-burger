import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@services/hooks';
import { logoutUserThunk } from '@services/user/actions';

import styles from './profile-page.module.css';

export const ProfilePage = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <nav className={styles.menu}>
          <NavLink
            end
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''} text text_type_main-medium`
            }
            to="/profile"
          >
            Профиль
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''} text text_type_main-medium`
            }
            to="/profile/orders"
          >
            История заказов
          </NavLink>
          <button
            className={`${styles.logout} text text_type_main-medium`}
            type="button"
            onClick={() => {
              void dispatch(logoutUserThunk()).then(() => {
                void navigate('/login', { replace: true });
              });
            }}
          >
            Выход
          </button>
        </nav>
        <p className="text text_type_main-default text_color_inactive mt-20">
          В этом разделе вы можете изменить свои персональные данные
        </p>
      </aside>
      <section className={styles.content}>
        <Outlet />
      </section>
    </main>
  );
};
