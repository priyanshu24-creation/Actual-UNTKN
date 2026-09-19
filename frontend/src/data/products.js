import product1 from "../assets/images/product-1.jpg";
import product1_2 from "../assets/images/product-1-2.jpg";
import product1_3 from "../assets/images/product-1-3.jpg";

import product2 from "../assets/images/product-2.jpg";
import product2_1 from "../assets/images/product-2-1.jpg";
import product2_2 from "../assets/images/product-2-2.jpg";

import product3 from "../assets/images/product-3.jpg";
import product3_1 from "../assets/images/product-3-1.jpg";
import product3_2 from "../assets/images/product-3-2.jpg";

import product4 from "../assets/images/product-4.jpg";
import product4_1 from "../assets/images/product-4-1.jpg";

const products = [
  {
    id: 1,
    name: "Karma",
    category: "T-Shirts",
    collection: "New Arrivals",
    price: 549,
    oldPrice: 799,

    // Main image
    image: product1,

    // Three product photos
    images: [
      product1,
      product1_2,
      product1_3,
    ],

    sizes: ["S", "M", "L", "XL"],
  },

  {
    id: 2,
    name: "History",
    category: "T-Shirts",
    collection: "New Arrivals",
    price: 549,
    oldPrice: 799,
    image: product2,
    images: [
      product2,
      product2_1,
      product2_2,
    ],
    sizes: ["S", "M", "L", "XL"],
  },

  {
    id: 3,
    name: "Misery World",
    category: "Thermals",
    collection: "Waffle Programme",
    price: 899,
    oldPrice: 1199,
    image: product3,
    images:[
      product3,
      product3_1,
      product3_2,
    ],
    sizes: ["S", "M", "L", "XL"],
  },

  {
    id: 4,
    name: "Dragon Flame",
    category: "Thermals",
    collection: "Waffle Programme",
    price: 899,
    oldPrice: 1199,
    image: product4,
    images:[
      product4,
      product4_1,
    ],
    sizes: ["S", "M", "L", "XL"],
  },
];

export default products;