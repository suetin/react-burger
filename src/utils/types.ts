export type TIngredientType = 'bun' | 'main' | 'sauce';

export type TIngredient = {
  _id: string;
  name: string;
  type: TIngredientType;
  proteins: number;
  fat: number;
  carbohydrates: number;
  calories: number;
  price: number;
  image: string;
  image_large: string;
  image_mobile: string;
  __v: number;
};

export type TConstructorIngredient = TIngredient & {
  constructorId: string;
};

export type TCreateOrderResponse = {
  name: string;
  order: {
    number: number;
  };
  success: boolean;
};

export type TUser = {
  email: string;
  name: string;
};

export type TAuthResponse = {
  accessToken: string;
  refreshToken: string;
  success: boolean;
  user: TUser;
};

export type TTokenResponse = {
  accessToken: string;
  refreshToken: string;
  success: boolean;
};

export type TUserResponse = {
  success: boolean;
  user: TUser;
};

export type TMessageResponse = {
  message: string;
  success: boolean;
};

export type TLoginData = {
  email: string;
  password: string;
};

export type TRegisterData = TLoginData & {
  name: string;
};

export type TUpdateUserData = TRegisterData;
