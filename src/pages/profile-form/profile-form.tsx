import { Button, Input } from '@krgaa/react-developer-burger-ui-components';
import { useEffect, useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@services/hooks';
import { updateUserThunk } from '@services/user/actions';
import { selectUser, selectUserError, selectUserLoading } from '@services/user/slice';

import type { FormEvent } from 'react';

import styles from '../page.module.css';

export const ProfileForm = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const error = useAppSelector(selectUserError);
  const isLoading = useAppSelector(selectUserLoading);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setPassword('');
  }, [user]);

  const isDirty = useMemo(
    () =>
      name !== (user?.name ?? '') || email !== (user?.email ?? '') || password !== '',
    [email, name, password, user?.email, user?.name]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void dispatch(updateUserThunk({ email, name, password })).then((result) => {
      if (updateUserThunk.fulfilled.match(result)) setPassword('');
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        name="name"
        placeholder="Имя"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Input
        name="email"
        type="email"
        placeholder="Логин"
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
      {error && <p className={`${styles.error} text text_type_main-default`}>{error}</p>}
      {isDirty && (
        <div>
          <Button
            htmlType="button"
            type="secondary"
            size="medium"
            onClick={() => {
              setName(user?.name ?? '');
              setEmail(user?.email ?? '');
              setPassword('');
            }}
          >
            Отмена
          </Button>
          <Button disabled={isLoading} htmlType="submit" type="primary" size="medium">
            Сохранить
          </Button>
        </div>
      )}
    </form>
  );
};
