import { Button, Input } from '@krgaa/react-developer-burger-ui-components';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { resetPassword } from '@utils/api';
import { RESET_PASSWORD_ACCESS_KEY } from '@utils/constants';

import type { FormEvent } from 'react';

import authStyles from '../auth-links.module.css';
import formStyles from '../page-form.module.css';
import layoutStyles from '../page-layout.module.css';

export const ResetPasswordPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [hasResetAccess] = useState(
    () => localStorage.getItem(RESET_PASSWORD_ACCESS_KEY) === 'true'
  );
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    void resetPassword(password, token)
      .then(() => {
        localStorage.removeItem(RESET_PASSWORD_ACCESS_KEY);
        void navigate('/login', { replace: true });
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не удалось сохранить пароль'
        );
      })
      .finally(() => setIsLoading(false));
  };

  if (!hasResetAccess) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <main className={layoutStyles.centered}>
      <h1 className="text text_type_main-medium mb-6">Восстановление пароля</h1>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <Input
          name="password"
          type="password"
          placeholder="Введите новый пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Input
          name="token"
          placeholder="Введите код из письма"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
        {error && (
          <p className={`${formStyles.error} text text_type_main-default`}>{error}</p>
        )}
        <Button disabled={isLoading} htmlType="submit" type="primary" size="medium">
          Сохранить
        </Button>
      </form>
      <div className={authStyles.links}>
        <p className="text text_type_main-default text_color_inactive">
          Вспомнили пароль?{' '}
          <Link className={layoutStyles.link} to="/login">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
};
