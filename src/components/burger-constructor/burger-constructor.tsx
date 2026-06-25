import {
  Button,
  ConstructorElement,
  CurrencyIcon,
  DragIcon,
} from '@krgaa/react-developer-burger-ui-components';
import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { useAppDispatch, useAppSelector } from '@services/hooks';
import {
  addIngredient,
  moveIngredient,
  removeIngredientByConstructorId,
  selectConstructorBun,
  selectConstructorIngredientIds,
  selectConstructorIngredients,
  selectConstructorTotalPrice,
} from '@services/slices/constructor-slice';
import { createOrderThunk, selectOrderLoading } from '@services/slices/order-slice';
import { DND_ITEM_TYPES } from '@utils/dnd';

import type { TConstructorDragItem } from '@utils/dnd';
import type { TConstructorIngredient, TIngredient } from '@utils/types';
import type { Identifier } from 'dnd-core';

import styles from './burger-constructor.module.css';

type TConstructorIngredientItemProps = {
  index: number;
  ingredient: TConstructorIngredient;
};

const ConstructorPlaceholder = ({
  text,
  type,
}: {
  text: string;
  type?: 'bottom' | 'top';
}): React.JSX.Element => {
  const typeClassName =
    type === 'top'
      ? styles.placeholder_top
      : type === 'bottom'
        ? styles.placeholder_bottom
        : '';

  return (
    <div className={`${styles.placeholder} ${typeClassName}`}>
      <span className="text text_type_main-default text_color_inactive">{text}</span>
    </div>
  );
};

const ConstructorIngredientItem = ({
  index,
  ingredient,
}: TConstructorIngredientItemProps): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLLIElement>(null);
  const [{ handlerId }, drop] = useDrop<
    TConstructorDragItem,
    { droppedInConstructor: boolean },
    { handlerId: Identifier | null }
  >({
    accept: DND_ITEM_TYPES.constructorIngredient,
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId(),
    }),
    drop: () => ({ droppedInConstructor: true }),
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) {
        return;
      }

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      dispatch(
        moveIngredient({ constructorId: item.constructorId, toIndex: hoverIndex })
      );
      item.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag<
    TConstructorDragItem,
    { droppedInConstructor: boolean } | undefined,
    { isDragging: boolean }
  >({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (!monitor.didDrop() && item.index !== item.initialIndex) {
        dispatch(
          moveIngredient({
            constructorId: item.constructorId,
            toIndex: item.initialIndex,
          })
        );
      }
    },
    item: {
      constructorId: ingredient.constructorId,
      index,
      initialIndex: index,
      type: DND_ITEM_TYPES.constructorIngredient,
    },
    type: DND_ITEM_TYPES.constructorIngredient,
  });

  drag(drop(ref));

  return (
    <li
      className={styles.item}
      data-handler-id={handlerId ?? undefined}
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <DragIcon type="primary" />
      <ConstructorElement
        text={ingredient.name}
        price={ingredient.price}
        thumbnail={ingredient.image}
        handleClose={() => {
          dispatch(removeIngredientByConstructorId(ingredient.constructorId));
        }}
      />
    </li>
  );
};

export const BurgerConstructor = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const burgerBun = useAppSelector(selectConstructorBun);
  const middleIngredients = useAppSelector(selectConstructorIngredients);
  const orderIngredientIds = useAppSelector(selectConstructorIngredientIds);
  const totalPrice = useAppSelector(selectConstructorTotalPrice);
  const isOrderLoading = useAppSelector(selectOrderLoading);
  const containerRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const canCreateOrder = Boolean(burgerBun) && middleIngredients.length > 0;
  const [, dropIngredient] = useDrop<TIngredient>(() => ({
    accept: DND_ITEM_TYPES.ingredient,
    drop: (ingredient): void => {
      dispatch(addIngredient(ingredient));
    },
  }));
  const [, dropConstructorItem] = useDrop<
    TConstructorDragItem,
    { droppedInConstructor: boolean }
  >(() => ({
    accept: DND_ITEM_TYPES.constructorIngredient,
    drop: (): { droppedInConstructor: boolean } => ({ droppedInConstructor: true }),
  }));

  dropIngredient(containerRef);
  dropConstructorItem(listRef);

  const handleOrderClick = (): void => {
    if (canCreateOrder) {
      void dispatch(createOrderThunk(orderIngredientIds));
    }
  };

  return (
    <section className={`${styles.burger_constructor}`} ref={containerRef}>
      <div className={`${styles.locked_item} pl-8 mb-4`}>
        {burgerBun ? (
          <ConstructorElement
            type="top"
            isLocked
            text={`${burgerBun.name} (верх)`}
            price={burgerBun.price}
            thumbnail={burgerBun.image}
          />
        ) : (
          <ConstructorPlaceholder type="top" text="Выберите булки" />
        )}
      </div>
      <ul className={`${styles.list} custom-scroll`} ref={listRef}>
        {middleIngredients.length ? (
          middleIngredients.map((ingredient, index) => (
            <ConstructorIngredientItem
              index={index}
              ingredient={ingredient}
              key={ingredient.constructorId}
            />
          ))
        ) : (
          <li className={styles.placeholder_item}>
            <ConstructorPlaceholder text="Выберите начинку" />
          </li>
        )}
      </ul>
      <div className={`${styles.locked_item} pl-8 mt-4`}>
        {burgerBun ? (
          <ConstructorElement
            type="bottom"
            isLocked
            text={`${burgerBun.name} (низ)`}
            price={burgerBun.price}
            thumbnail={burgerBun.image}
          />
        ) : (
          <ConstructorPlaceholder type="bottom" text="Выберите булки" />
        )}
      </div>
      <footer className={`${styles.footer} mt-10 pr-4`}>
        <p className={styles.total}>
          <span className="text text_type_digits-medium">{totalPrice}</span>
          <CurrencyIcon type="primary" />
        </p>
        <Button
          disabled={!canCreateOrder || isOrderLoading}
          htmlType="button"
          type="primary"
          size="large"
          onClick={handleOrderClick}
        >
          Оформить заказ
        </Button>
      </footer>
    </section>
  );
};
