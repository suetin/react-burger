import { Button, Input } from '@krgaa/react-developer-burger-ui-components';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@services/hooks';
import { registerUserThunk } from '@services/user/actions';
import { selectUserError, selectUserLoading } from '@services/user/slice';

import styles from '../page.module.css';

export const RegisterPage = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <main className={styles.centered}>
      <h1 className="text text_type_main-medium mb-6">Регистрация</h1>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void dispatch(registerUserThunk({ email, name, password }));
        }}
      >
        <Input
          name="name"
          placeholder="Имя"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
          Зарегистрироваться
        </Button>
      </form>
      <div className={styles.links}>
        <p className="text text_type_main-default text_color_inactive">
          Уже зарегистрированы?{' '}
          <Link className={styles.link} to="/login">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
};
