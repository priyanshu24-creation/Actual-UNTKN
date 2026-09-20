import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const CartContext = createContext();

/*
|--------------------------------------------------------------------------
| CART PROVIDER
|--------------------------------------------------------------------------
*/

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD CART
  |--------------------------------------------------------------------------
  */

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/cart");

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to load cart."
        );
      }

      const items =
        response.data?.cart?.items || [];

      /*
       * Normalize backend cart data
       */
      const normalizedItems = items.map(
        (item) => ({
          /*
           * Product ID
           */
          id: Number(
            item.product_id
          ),

          /*
           * IMPORTANT:
           * This is the exact cart_items.id
           * from the backend database.
           *
           * Backend returns:
           * ci.id
           */
          cartItemId: Number(
            item.id ??
              item.cart_item_id ??
              item.cartItemId ??
              item.item_id
          ),

          /*
           * Product ID
           */
          product_id: Number(
            item.product_id
          ),

          /*
           * Variant ID
           */
          variant_id:
            item.variant_id !== null &&
            item.variant_id !== undefined
              ? Number(
                  item.variant_id
                )
              : null,

          /*
           * Product information
           */
          name:
            item.product_name ||
            "UNTKN Product",

          product_name:
            item.product_name ||
            "UNTKN Product",

          slug:
            item.product_slug ||
            "",

          /*
           * Image
           */
          image:
            item.image_url ||
            "",

          image_url:
            item.image_url ||
            "",

          /*
           * Variant information
           */
          sku:
            item.sku ||
            "",

          size:
            item.size ||
            "",

          color:
            item.color ||
            "",

          hex_code:
            item.hex_code ||
            "",

          /*
           * Quantity
           */
          quantity: Number(
            item.quantity || 1
          ),

          /*
           * Price
           */
          price: Number(
            item.unit_price || 0
          ),

          unit_price: Number(
            item.unit_price || 0
          ),

          total_price: Number(
            item.total_price || 0
          ),

          /*
           * Stock
           */
          stock_quantity:
            item.stock_quantity !== null &&
            item.stock_quantity !== undefined
              ? Number(
                  item.stock_quantity
                )
              : null,

          /*
           * Currency
           */
          currency:
            item.currency ||
            "INR",
        })
      );

      setCartItems(
        normalizedItems
      );
    } catch (requestError) {
      console.error(
        "Failed to load cart:",
        requestError
      );

      /*
       * If user is not logged in,
       * keep cart empty.
       */
      if (
        requestError.response?.status ===
        401
      ) {
        setCartItems([]);
      } else {
        setError(
          requestError.response?.data
            ?.message ||
            requestError.message ||
            "Unable to load cart."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadCart();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | ADD TO CART
  |--------------------------------------------------------------------------
  */

  const addToCart = async (
    product,
    size = "",
    quantity = 1,
    variantId = null
  ) => {
    try {
      setError("");

      /*
       * Get product ID
       */
      const productId = Number(
        product?.id ??
          product?.product_id
      );

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {
        throw new Error(
          "Invalid product."
        );
      }

      /*
       * Validate quantity
       */
      const requestedQuantity =
        Number(quantity);

      if (
        !Number.isInteger(
          requestedQuantity
        ) ||
        requestedQuantity < 1
      ) {
        throw new Error(
          "Quantity must be at least 1."
        );
      }

      /*
       * Resolve variant ID
       */
      let resolvedVariantId =
        variantId;

      /*
       * If ProductDetails did not
       * provide variant ID, find it
       * using the selected size.
       */
      if (
        resolvedVariantId === null ||
        resolvedVariantId === undefined
      ) {
        if (
          Array.isArray(
            product?.variants
          ) &&
          size
        ) {
          const matchingVariant =
            product.variants.find(
              (variant) => {
                const variantSize =
                  variant.size_name ||
                  variant.size ||
                  variant.size_label ||
                  variant?.size?.name;

                return (
                  String(
                    variantSize || ""
                  ).toLowerCase() ===
                  String(
                    size || ""
                  ).toLowerCase()
                );
              }
            );

          if (
            matchingVariant?.id
          ) {
            resolvedVariantId =
              Number(
                matchingVariant.id
              );
          }
        }
      }

      /*
       * Send product to backend
       */
      const response =
        await api.post(
          "/cart/items",
          {
            product_id:
              productId,

            variant_id:
              resolvedVariantId !==
                null &&
              resolvedVariantId !==
                undefined
                ? Number(
                    resolvedVariantId
                  )
                : null,

            quantity:
              requestedQuantity,
          }
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to add product to cart."
        );
      }

      /*
       * Reload latest cart
       */
      await loadCart();

      return {
        success: true,
        data: response.data,
      };
    } catch (requestError) {
      console.error(
        "Add to cart error:",
        requestError
      );

      const message =
        requestError.response?.data
          ?.message ||
        requestError.message ||
        "Unable to add product to cart.";

      setError(message);

      throw new Error(
        message
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FIND CART ITEM
  |--------------------------------------------------------------------------
  */

  const findCartItem = (
    productId,
    size = "",
    variantId = null
  ) => {
    /*
     * First try exact variant match.
     */
    if (
      variantId !== null &&
      variantId !== undefined
    ) {
      const variantMatch =
        cartItems.find(
          (item) =>
            Number(
              item.product_id
            ) ===
              Number(
                productId
              ) &&
            Number(
              item.variant_id
            ) ===
              Number(
                variantId
              )
        );

      if (variantMatch) {
        return variantMatch;
      }
    }

    /*
     * Fallback to product + size.
     */
    return cartItems.find(
      (item) =>
        Number(
          item.product_id
        ) ===
          Number(
            productId
          ) &&
        String(
          item.size || ""
        ).toLowerCase() ===
          String(
            size || ""
          ).toLowerCase()
    );
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE QUANTITY
  |--------------------------------------------------------------------------
  */

  const updateQuantity = async (
    id,
    size,
    quantity,
    cartItemId = null,
    variantId = null
  ) => {
    try {
      setError("");

      const newQuantity =
        Number(quantity);

      /*
       * Validate quantity
       */
      if (
        !Number.isInteger(
          newQuantity
        )
      ) {
        throw new Error(
          "Quantity must be a whole number."
        );
      }

      /*
       * Use the exact backend
       * cart item ID if provided.
       */
      let actualCartItemId =
        cartItemId;

      /*
       * If no cart item ID was provided,
       * find it from current cart.
       */
      if (!actualCartItemId) {
        const matchingItem =
          findCartItem(
            id,
            size,
            variantId
          );

        actualCartItemId =
          matchingItem?.cartItemId;
      }

      /*
       * Validate cart item ID
       */
      actualCartItemId =
        Number(
          actualCartItemId
        );

      if (
        !actualCartItemId ||
        !Number.isInteger(
          actualCartItemId
        )
      ) {
        throw new Error(
          "Cart item not found."
        );
      }

      /*
       * Quantity below 1
       * means remove item.
       */
      if (
        newQuantity < 1
      ) {
        await removeFromCart(
          id,
          size,
          actualCartItemId,
          variantId
        );

        return;
      }

      /*
       * Update backend
       */
      const response =
        await api.put(
          `/cart/items/${actualCartItemId}`,
          {
            quantity:
              newQuantity,
          }
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to update cart."
        );
      }

      /*
       * Reload latest cart
       */
      await loadCart();
    } catch (requestError) {
      console.error(
        "Update cart error:",
        requestError
      );

      const message =
        requestError.response?.data
          ?.message ||
        requestError.message ||
        "Unable to update cart.";

      setError(message);

      throw new Error(
        message
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE FROM CART
  |--------------------------------------------------------------------------
  */

  const removeFromCart = async (
    id,
    size = "",
    cartItemId = null,
    variantId = null
  ) => {
    try {
      setError("");

      /*
       * Use the exact backend
       * cart item ID first.
       */
      let actualCartItemId =
        cartItemId;

      /*
       * Fallback:
       * Find the cart item locally.
       */
      if (!actualCartItemId) {
        const matchingItem =
          findCartItem(
            id,
            size,
            variantId
          );

        actualCartItemId =
          matchingItem?.cartItemId;
      }

      /*
       * Convert to number
       */
      actualCartItemId =
        Number(
          actualCartItemId
        );

      /*
       * Validate ID
       */
      if (
        !actualCartItemId ||
        !Number.isInteger(
          actualCartItemId
        )
      ) {
        throw new Error(
          "Cart item not found."
        );
      }

      /*
       * Debug information
       */
      console.log(
        "Removing cart item:",
        actualCartItemId
      );

      /*
       * Delete from backend
       */
      const response =
        await api.delete(
          `/cart/items/${actualCartItemId}`
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to remove cart item."
        );
      }

      /*
       * Reload cart from database
       */
      await loadCart();
    } catch (requestError) {
      console.error(
        "Remove cart item error:",
        requestError
      );

      const message =
        requestError.response?.data
          ?.message ||
        requestError.message ||
        "Unable to remove cart item.";

      setError(message);

      throw new Error(
        message
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR CART
  |--------------------------------------------------------------------------
  */

  const clearCart = async () => {
    try {
      setError("");

      const response =
        await api.delete(
          "/cart"
        );

      if (
        !response.data?.success
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to clear cart."
        );
      }

      /*
       * Immediately clear frontend state.
       */
      setCartItems([]);
    } catch (requestError) {
      console.error(
        "Clear cart error:",
        requestError
      );

      const message =
        requestError.response?.data
          ?.message ||
        requestError.message ||
        "Unable to clear cart.";

      setError(message);

      throw new Error(
        message
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOTAL ITEMS
  |--------------------------------------------------------------------------
  */

  const totalItems =
    cartItems.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | SUBTOTAL
  |--------------------------------------------------------------------------
  */

  const subtotal =
    cartItems.reduce(
      (total, item) => {
        const price =
          Number(
            item.unit_price ??
              item.price ??
              0
          );

        const quantity =
          Number(
            item.quantity || 0
          );

        return (
          total +
          price * quantity
        );
      },
      0
    );

  /*
  |--------------------------------------------------------------------------
  | PROVIDER
  |--------------------------------------------------------------------------
  */

  return (
    <CartContext.Provider
      value={{
        cartItems,

        addToCart,

        updateQuantity,

        removeFromCart,

        clearCart,

        totalItems,

        subtotal,

        loading,

        error,

        refreshCart:
          loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| USE CART
|--------------------------------------------------------------------------
*/

export function useCart() {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}