import { Counter, CurrencyIcon, Tab } from '@krgaa/react-developer-burger-ui-components';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useDrag } from 'react-dnd';

import { DND_ITEM_TYPES } from '@utils/dnd';

import type { TIngredient, TIngredientType } from '@utils/types';

import styles from './burger-ingredients.module.css';

const ingredientTabs: { label: string; value: TIngredientType }[] = [
  { label: 'Булки', value: 'bun' },
  { label: 'Соусы', value: 'sauce' },
  { label: 'Начинки', value: 'main' },
];

const ingredientTitles: Record<TIngredientType, string> = {
  bun: 'Булки',
  sauce: 'Соусы',
  main: 'Начинки',
};

type TIngredientCardProps = {
  count: number;
  ingredient: TIngredient;
  onIngredientClick: (ingredient: TIngredient) => void;
};

type TBurgerIngredientsProps = {
  ingredientCounts: Record<string, number>;
  ingredients: TIngredient[];
  onIngredientClick: (ingredient: TIngredient) => void;
};

const IngredientCard = ({
  count,
  ingredient,
  onIngredientClick,
}: TIngredientCardProps): React.JSX.Element => {
  const dragRef = useRef<HTMLButtonElement>(null);
  const [{ isDragging }, drag] = useDrag<TIngredient, void, { isDragging: boolean }>(
    () => ({
      collect: (monitor): { isDragging: boolean } => ({
        isDragging: monitor.isDragging(),
      }),
      item: ingredient,
      type: DND_ITEM_TYPES.ingredient,
    }),
    [ingredient]
  );

  drag(dragRef);

  return (
    <button
      className={styles.card}
      ref={dragRef}
      type="button"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={() => onIngredientClick(ingredient)}
    >
      {Boolean(count) && <Counter count={count} size="default" />}
      <img className={styles.image} src={ingredient.image} alt={ingredient.name} />
      <span className={`${styles.price} mt-1 mb-1`}>
        <span className="text text_type_digits-default">{ingredient.price}</span>
        <CurrencyIcon type="primary" />
      </span>
      <span className="text text_type_main-default">{ingredient.name}</span>
    </button>
  );
};

export const BurgerIngredients = ({
  ingredientCounts,
  ingredients,
  onIngredientClick,
}: TBurgerIngredientsProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<TIngredientType>('bun');
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<TIngredientType, HTMLElement | null>>({
    bun: null,
    sauce: null,
    main: null,
  });

  const groupedIngredients = useMemo(() => {
    const groups: Record<TIngredientType, TIngredient[]> = {
      bun: [],
      sauce: [],
      main: [],
    };

    ingredients.forEach((ingredient) => {
      groups[ingredient.type].push(ingredient);
    });

    return groups;
  }, [ingredients]);

  const handleScroll = useCallback((): void => {
    if (!listRef.current) {
      return;
    }

    const listTop = listRef.current.getBoundingClientRect().top;
    const closestType = ingredientTabs.reduce<TIngredientType>((closest, { value }) => {
      const closestElement = sectionRefs.current[closest];
      const currentElement = sectionRefs.current[value];

      if (!currentElement) {
        return closest;
      }

      if (!closestElement) {
        return value;
      }

      const closestDistance = Math.abs(
        closestElement.getBoundingClientRect().top - listTop
      );
      const currentDistance = Math.abs(
        currentElement.getBoundingClientRect().top - listTop
      );

      return currentDistance < closestDistance ? value : closest;
    }, 'bun');

    setActiveTab((currentTab) =>
      currentTab === closestType ? currentTab : closestType
    );
  }, []);

  const handleTabClick = (value: string): void => {
    const ingredientType = value as TIngredientType;

    setActiveTab(ingredientType);
    sectionRefs.current[ingredientType]?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles.burger_ingredients}>
      <nav aria-label="Категории ингредиентов">
        <ul className={styles.menu}>
          {ingredientTabs.map(({ label, value }) => (
            <li className={styles.menu_item} key={value}>
              <Tab value={value} active={activeTab === value} onClick={handleTabClick}>
                {label}
              </Tab>
            </li>
          ))}
        </ul>
      </nav>
      <div
        className={`${styles.list} custom-scroll`}
        ref={listRef}
        onScroll={handleScroll}
      >
        {ingredientTabs.map(({ value }) => (
          <section
            className="pt-10"
            key={value}
            ref={(element) => {
              sectionRefs.current[value] = element;
            }}
          >
            <h2 className="text text_type_main-medium mb-6">
              {ingredientTitles[value]}
            </h2>
            <ul className={`${styles.cards} pl-4 pr-4`}>
              {groupedIngredients[value].map((ingredient) => (
                <li className={styles.card_item} key={ingredient._id}>
                  <IngredientCard
                    count={ingredientCounts[ingredient._id] ?? 0}
                    ingredient={ingredient}
                    onIngredientClick={onIngredientClick}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
};
