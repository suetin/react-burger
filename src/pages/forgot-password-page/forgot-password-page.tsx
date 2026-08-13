import { Button, Input } from '@krgaa/react-developer-burger-ui-components';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { forgotPassword } from '@utils/api';
import { RESET_PASSWORD_ACCESS_KEY } from '@utils/constants';

import type { FormEvent } from 'react';

import authStyles from '../auth-links.module.css';
import formStyles from '../page-form.module.css';
import layoutStyles from '../page-layout.module.css';

export const ForgotPasswordPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    void forgotPassword(email)
      .then(() => {
        localStorage.setItem(RESET_PASSWORD_ACCESS_KEY, 'true');
        void navigate('/reset-password');
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не удалось отправить письмо'
        );
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <main className={layoutStyles.centered}>
      <h1 className="text text_type_main-medium mb-6">Восстановление пароля</h1>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <Input
          name="email"
          type="email"
          placeholder="Укажите e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error && (
          <p className={`${formStyles.error} text text_type_main-default`}>{error}</p>
        )}
        <Button disabled={isLoading} htmlType="submit" type="primary" size="medium">
          Восстановить
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
