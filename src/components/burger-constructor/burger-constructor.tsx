import {
  Button,
  ConstructorElement,
  CurrencyIcon,
  DragIcon,
} from '@krgaa/react-developer-burger-ui-components';

import type { TIngredient } from '@utils/types';

import styles from './burger-constructor.module.css';

type TBurgerConstructorProps = {
  burgerBun: TIngredient | undefined;
  middleIngredients: TIngredient[];
  onOrderClick: () => void;
};

export const BurgerConstructor = ({
  burgerBun,
  middleIngredients,
  onOrderClick,
}: TBurgerConstructorProps): React.JSX.Element => {
  const bunPrice = burgerBun ? burgerBun.price * 2 : 0;
  const middlePrice = middleIngredients.reduce(
    (sum, ingredient) => sum + ingredient.price,
    0
  );
  const totalPrice = bunPrice + middlePrice;

  return (
    <section className={`${styles.burger_constructor} pt-15`}>
      {burgerBun && (
        <div className={`${styles.locked_item} pl-8`}>
          <ConstructorElement
            type="top"
            isLocked
            text={`${burgerBun.name} (верх)`}
            price={burgerBun.price}
            thumbnail={burgerBun.image}
          />
        </div>
      )}
      <ul className={`${styles.list} custom-scroll mt-4 mb-4`}>
        {middleIngredients.map((ingredient) => (
          <li className={styles.item} key={ingredient._id}>
            <DragIcon type="primary" />
            <ConstructorElement
              text={ingredient.name}
              price={ingredient.price}
              thumbnail={ingredient.image}
            />
          </li>
        ))}
      </ul>
      {burgerBun && (
        <div className={`${styles.locked_item} pl-8`}>
          <ConstructorElement
            type="bottom"
            isLocked
            text={`${burgerBun.name} (низ)`}
            price={burgerBun.price}
            thumbnail={burgerBun.image}
          />
        </div>
      )}
      <footer className={`${styles.footer} mt-10 pr-4`}>
        <p className={styles.total}>
          <span className="text text_type_digits-medium">{totalPrice}</span>
          <CurrencyIcon type="primary" />
        </p>
        <Button htmlType="button" type="primary" size="large" onClick={onOrderClick}>
          Оформить заказ
        </Button>
      </footer>
    </section>
  );
};
