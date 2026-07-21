import { Button, Input } from '@krgaa/react-developer-burger-ui-components';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@services/hooks';
import { loginUserThunk } from '@services/user/actions';
import { selectUserError, selectUserLoading } from '@services/user/slice';

import type { FormEvent } from 'react';
import type { Location } from 'react-router-dom';

import styles from '../page.module.css';

type TLoginLocationState = { from?: Location };

export const LoginPage = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void dispatch(loginUserThunk({ email, password })).then((result) => {
      if (loginUserThunk.fulfilled.match(result)) {
        const state = location.state as TLoginLocationState | null;
        const destination = state?.from
          ? `${state.from.pathname}${state.from.search}${state.from.hash}`
          : '/';
        void navigate(destination, { replace: true });
      }
    });
  };

  return (
    <main className={styles.centered}>
      <h1 className="text text_type_main-medium mb-6">Вход</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          name="email"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          name="password"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p className={`${styles.error} text text_type_main-default`}>{error}</p>
        )}
        <Button disabled={isLoading} htmlType="submit" type="primary" size="medium">
          Войти
        </Button>
      </form>
      <div className={styles.links}>
        <p className="text text_type_main-default text_color_inactive">
          Вы — новый пользователь?{' '}
          <Link className={styles.link} to="/register">
            Зарегистрироваться
          </Link>
        </p>
        <p className="text text_type_main-default text_color_inactive">
          Забыли пароль?{' '}
          <Link className={styles.link} to="/forgot-password">
            Восстановить пароль
          </Link>
        </p>
      </div>
    </main>
  );
};
