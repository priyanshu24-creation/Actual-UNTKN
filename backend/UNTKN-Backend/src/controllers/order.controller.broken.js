const db = require("../config/db");
const crypto = require("crypto");

const createOrder = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const userId = req.user.id;

    const {
      shipping_address,
      shippingAddress,
      billing_address,
      billingAddress,
      payment_method,
      paymentMethod,
      coupon_code,
      couponCode,
    } = req.body;

    const shippingAddressValue =
      shipping_address ||
      shippingAddress;

    const billingAddressValue =
      billing_address ||
      billingAddress ||
      shippingAddressValue;

    const paymentMethodValue =
      payment_method ||
      paymentMethod ||
      "cod";

    const couponCodeValue =
      coupon_code ||
      couponCode ||
      null;

    if (!shippingAddressValue) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    await connection.beginTransaction();

    const [cartItems] = await connection.query(
      `
      SELECT
        ci.id AS cart_item_id,
        ci.product_id,
        ci.variant_id,
        ci.quantity,

        p.name,
        p.base_price,
        p.sale_price,
        p.stock_quantity AS product_stock,
        p.active AS product_active,

        pv.sku,
        pv.stock_quantity,
        pv.active AS variant_active,
        pv.size,
        pv.color

      FROM cart_items ci

      INNER JOIN products p
        ON p.id = ci.product_id

      LEFT JOIN product_variants pv
        ON pv.id = ci.variant_id

      WHERE ci.user_id = ?

      FOR UPDATE
      `,
      [userId]
    );

    if (!cartItems.length) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    let subtotal = 0;

    const orderItems = [];

    for (const item of cartItems) {
      if (!item.product_active) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: `${item.name} is currently unavailable`,
        });
      }

      if (
        item.variant_id &&
        !item.variant_active
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: `Selected variant of ${item.name} is unavailable`,
        });
      }

      const availableStock =
        item.variant_id
          ? Number(item.stock_quantity || 0)
          : Number(item.product_stock || 0);

      if (
        availableStock > 0 &&
        Number(item.quantity) > availableStock
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} item(s) available for ${item.name}`,
        });
      }

      /*
       * IMPORTANT:
       * Always use the current product price from the products table.
       * Do not use pv.price here because it can contain an old/stale
       * variant price after the admin changes the main product price.
       */
      const unitPrice =
        item.sale_price !== null &&
        item.sale_price !== undefined
          ? Number(item.sale_price)
          : Number(item.base_price);

      const quantity =
        Number(item.quantity);

      const totalPrice =
        unitPrice * quantity;

      subtotal += totalPrice;

      orderItems.push({
        cart_item_id:
          item.cart_item_id,

        product_id:
          item.product_id,

        variant_id:
          item.variant_id,

        product_name:
          item.name,

        sku:
          item.sku || null,

        size:
          item.size || null,

        color:
          item.color || null,

        quantity,

        unit_price:
          unitPrice,

        total_price:
          totalPrice,
      });
    }

    let discount = 0;

    let coupon = null;

    if (couponCodeValue) {
      const normalizedCoupon =
        String(couponCodeValue)
          .trim()
          .toUpperCase();

      const [coupons] = await connection.query(
        `
        SELECT
          id,
          code,
          discount_type,
          discount_value,
          minimum_order_amount,
          maximum_discount_amount,
          usage_limit,
          used_count,
          starts_at,
          expires_at,
          active
        FROM coupons
        WHERE UPPER(code) = ?
        LIMIT 1
        `,
        [normalizedCoupon]
      );

      if (!coupons.length) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Invalid coupon code",
        });
      }

      coupon = coupons[0];

      const now = new Date();

      if (!coupon.active) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "This coupon is inactive",
        });
      }

      if (
        coupon.starts_at &&
        new Date(coupon.starts_at) > now
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "This coupon is not active yet",
        });
      }

      if (
        coupon.expires_at &&
        new Date(coupon.expires_at) < now
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "This coupon has expired",
        });
      }

      if (
        coupon.usage_limit !== null &&
        coupon.usage_limit !== undefined &&
        Number(coupon.used_count || 0) >=
          Number(coupon.usage_limit)
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "This coupon usage limit has been reached",
        });
      }

      if (
        coupon.minimum_order_amount !== null &&
        coupon.minimum_order_amount !== undefined &&
        subtotal <
          Number(coupon.minimum_order_amount)
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: `Minimum order amount for this coupon is ₹${Number(
            coupon.minimum_order_amount
          ).toFixed(2)}`,
        });
      }

      const discountType =
        String(
          coupon.discount_type || ""
        ).toLowerCase();

      const discountValue =
        Number(coupon.discount_value || 0);

      if (
        discountType === "percentage" ||
        discountType === "percent"
      ) {
        discount =
          subtotal *
          (discountValue / 100);

        if (
          coupon.maximum_discount_amount !==
            null &&
          coupon.maximum_discount_amount !==
            undefined
        ) {
          discount = Math.min(
            discount,
            Number(
              coupon.maximum_discount_amount
            )
          );
        }
      } else {
        discount = discountValue;
      }

      discount = Math.max(
        0,
        Math.min(discount, subtotal)
      );
    }

    const shippingCharge = 0;

    const tax = 0;

    const totalAmount =
      Math.max(
        0,
        subtotal -
          discount +
          shippingCharge +
          tax
      );

    const orderNumber =
      `UNTKN-${Date.now()}-${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;

    const [orderResult] =
      await connection.query(
        `
        INSERT INTO orders (
          order_number,
          user_id,
          subtotal,
          discount_amount,
          shipping_amount,
          tax_amount,
          total_amount,
          payment_method,
          payment_status,
          order_status,
          shipping_address,
          billing_address,
          coupon_code,
          created_at,
          updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        `,
        [
          orderNumber,
          userId,
          subtotal,
          discount,
          shippingCharge,
          tax,
          totalAmount,
          paymentMethodValue,
          "pending",
          "pending",
          JSON.stringify(
            shippingAddressValue
          ),
          JSON.stringify(
            billingAddressValue
          ),
          coupon
            ? coupon.code
            : null,
        ]
      );

    const orderId =
      orderResult.insertId;

    for (const item of orderItems) {
      await connection.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          variant_id,
          product_name,
          sku,
          size,
          color,
          quantity,
          unit_price,
          total_price,
          created_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
        )
        `,
        [
          orderId,
          item.product_id,
          item.variant_id,
          item.product_name,
          item.sku,
          item.size,
          item.color,
          item.quantity,
          item.unit_price,
          item.total_price,
        ]
      );

      if (item.variant_id) {
        await connection.query(
          `
          UPDATE product_variants
          SET
            stock_quantity =
              GREATEST(
                0,
                stock_quantity - ?
              )
          WHERE id = ?
          `,
          [
            item.quantity,
            item.variant_id,
          ]
        );
      } else {
        await connection.query(
          `
          UPDATE products
          SET
            stock_quantity =
              GREATEST(
                0,
                stock_quantity - ?
              )
          WHERE id = ?
          `,
          [
            item.quantity,
            item.product_id,
          ]
        );
      }
    }

    if (coupon) {
      await connection.query(
        `
        UPDATE coupons
        SET
          used_count =
            COALESCE(used_count, 0) + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [coupon.id]
      );
    }

    await connection.query(
      `
      DELETE FROM cart_items
      WHERE user_id = ?
      `,
      [userId]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",

      order: {
        id: orderId,
        order_id: orderId,
        order_number: orderNumber,

        subtotal,
        discount,
        discount_amount: discount,

        shipping:
          shippingCharge,

        shipping_amount:
          shippingCharge,

        tax,
        tax_amount: tax,

        total:
          totalAmount,

        total_amount:
          totalAmount,

        payment_method:
          paymentMethodValue,

        payment_status:
          "pending",

        order_status:
          "pending",

        coupon_code:
          coupon
            ? coupon.code
            : null,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  } finally {
    connection.release();
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await db.query(
      `
      SELECT
        o.*
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get my orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load orders",
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;

    const orderId =
      req.params.id ||
      req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const [orders] = await db.query(
      `
      SELECT
        *
      FROM orders
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [
        orderId,
        userId,
      ]
    );

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const [items] =
      await db.query(
        `
        SELECT
          *
        FROM order_items
        WHERE order_id = ?
        ORDER BY id ASC
        `,
        [orderId]
      );

    return res.status(200).json({
      success: true,
      order: {
        ...orders[0],
        items,
      },
    });
  } catch (error) {
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load order",
    });
  }
};

const cancelOrder = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const userId = req.user.id;

    const orderId =
      req.params.id ||
      req.params.orderId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    await connection.beginTransaction();

    const [orders] = await connection.query(
      `
      SELECT
        id,
        order_status
      FROM orders
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [
        orderId,
        userId,
      ]
    );

    if (!orders.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order =
      orders[0];

    const status =
      String(
        order.order_status || ""
      ).toLowerCase();

    if (
      [
        "cancelled",
        "canceled",
        "delivered",
        "completed",
      ].includes(status)
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "This order cannot be cancelled",
      });
    }

    const [items] =
      await connection.query(
        `
        SELECT
          product_id,
          variant_id,
          quantity
        FROM order_items
        WHERE order_id = ?
        `,
        [orderId]
      );

    for (const item of items) {
      if (item.variant_id) {
        await connection.query(
          `
          UPDATE product_variants
          SET
            stock_quantity =
              stock_quantity + ?
          WHERE id = ?
          `,
          [
            item.quantity,
            item.variant_id,
          ]
        );
      } else {
        await connection.query(
          `
          UPDATE products
          SET
            stock_quantity =
              stock_quantity + ?
          WHERE id = ?
          `,
          [
            item.quantity,
            item.product_id,
          ]
        );
      }
    }

    await connection.query(
      `
      UPDATE orders
      SET
        order_status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND user_id = ?
      `,
      [
        orderId,
        userId,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Cancel order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
 

        const [orders] = await pool.execute(
            `
            SELECT
                id,
                order_status,
                payment_status
            FROM orders
            WHERE id = ?
              AND user_id = ?
            LIMIT 1
            `,
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];

        if (
            order.order_status !== "pending" &&
            order.order_status !== "confirmed"
        ) {
            return res.status(400).json({
                success: false,
                message: "This order cannot be cancelled"
            });
        }

        if (order.payment_status === "paid") {
            return res.status(400).json({
                success: false,
                message: "Paid orders require refund processing"
            });
        }

        await pool.execute(
            `
            UPDATE orders
            SET
                order_status = 'cancelled',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND user_id = ?
            `,
            [orderId, userId]
        );

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully"
        });
    } catch (error) {
        console.error("Cancel order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel order"
        });
    }
};
