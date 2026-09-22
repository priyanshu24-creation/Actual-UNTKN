import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  

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

      
      const normalizedItems = items.map(
        (item) => ({
          
          id: Number(
            item.product_id
          ),

          
          cartItemId: Number(
            item.id ??
              item.cart_item_id ??
              item.cartItemId ??
              item.item_id
          ),

          
          product_id: Number(
            item.product_id
          ),

          
          variant_id:
            item.variant_id !== null &&
            item.variant_id !== undefined
              ? Number(
                  item.variant_id
                )
              : null,

          
          name:
            item.product_name ||
            "UNTKN Product",

          product_name:
            item.product_name ||
            "UNTKN Product",

          slug:
            item.product_slug ||
            "",

          
          image:
            item.image_url ||
            "",

          image_url:
            item.image_url ||
            "",

          
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

          
          quantity: Number(
            item.quantity || 1
          ),

          
          price: Number(
            item.unit_price || 0
          ),

          unit_price: Number(
            item.unit_price || 0
          ),

          total_price: Number(
            item.total_price || 0
          ),

          
          stock_quantity:
            item.stock_quantity !== null &&
            item.stock_quantity !== undefined
              ? Number(
                  item.stock_quantity
                )
              : null,

          
          currency:
            item.currency ||
            "INR",
        })
      );

      setCartItems(
        normalizedItems
      );
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setCartItems([]);
        setError("");
        return;
      }

      console.error("Failed to load cart:", requestError);

      setCartItems([]);

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to load cart."
      );
    } finally {
      setLoading(false);
    }
  };

  

  useEffect(() => {
    loadCart();
  }, []);

  

  const addToCart = async (
    product,
    size = "",
    quantity = 1,
    variantId = null
  ) => {
    try {
      setError("");

      
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

      
      let resolvedVariantId =
        variantId;

      
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
                  variant?.size_name ||
                  (typeof variant?.size === "object"
                    ? variant?.size?.name
                    : variant?.size) ||
                  variant?.size_label ||
                  "";

                return (
                  String(variantSize).toLowerCase() ===
                  String(size || "").toLowerCase()
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

  

  const findCartItem = (
    productId,
    size = "",
    variantId = null
  ) => {
    
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

      
      if (
        !Number.isInteger(
          newQuantity
        )
      ) {
        throw new Error(
          "Quantity must be a whole number."
        );
      }

      
      let actualCartItemId =
        cartItemId;

      
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

  

  const removeFromCart = async (
    id,
    size = "",
    cartItemId = null,
    variantId = null
  ) => {
    try {
      setError("");

      
      let actualCartItemId =
        cartItemId;

      
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

  

  const totalItems =
    cartItems.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 0
        ),
      0
    );

  

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
