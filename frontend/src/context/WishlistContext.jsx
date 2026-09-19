import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const WishlistContext = createContext();


export function WishlistProvider({ children }) {

  const [wishlistItems, setWishlistItems] = useState(() => {

    const savedWishlist =
      localStorage.getItem("fashion-wishlist");

    return savedWishlist
      ? JSON.parse(savedWishlist)
      : [];

  });


  // =========================
  // SAVE TO LOCAL STORAGE
  // =========================

  useEffect(() => {

    localStorage.setItem(
      "fashion-wishlist",
      JSON.stringify(wishlistItems)
    );

  }, [wishlistItems]);


  // =========================
  // ADD / REMOVE
  // =========================

  const toggleWishlist = (product) => {

    setWishlistItems((currentItems) => {

      const exists = currentItems.some(
        (item) => item.id === product.id
      );


      if (exists) {

        return currentItems.filter(
          (item) => item.id !== product.id
        );

      }


      return [
        ...currentItems,
        product,
      ];

    });

  };


  // =========================
  // CHECK WISHLIST
  // =========================

  const isInWishlist = (productId) => {

    return wishlistItems.some(
      (item) => item.id === productId
    );

  };


  // =========================
  // REMOVE
  // =========================

  const removeFromWishlist = (productId) => {

    setWishlistItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== productId
      )
    );

  };


  // =========================
  // CLEAR
  // =========================

  const clearWishlist = () => {
    setWishlistItems([]);
  };


  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );

}


export function useWishlist() {

  const context = useContext(WishlistContext);

  if (!context) {

    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );

  }

  return context;

}