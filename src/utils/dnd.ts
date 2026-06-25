export const DND_ITEM_TYPES = {
  constructorIngredient: 'constructorIngredient',
  ingredient: 'ingredient',
} as const;

export type TConstructorDragItem = {
  constructorId: string;
  index: number;
  initialIndex: number;
  type: typeof DND_ITEM_TYPES.constructorIngredient;
};
